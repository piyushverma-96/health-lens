import logging
import datetime
import re
import json
from app.core.db import get_db_cursor
from app.services.ocr import run_ocr_pipeline
from app.services.parser import (
    parse_report_text, 
    evaluate_biomarker_status, 
    generate_personalized_report
)
from app.services.rag import save_report_chunks, similarity_search_knowledge

logger = logging.getLogger("healthlens.worker")

def process_report_background_job(report_id: str, file_path: str, mime_type: str, recorded_at: str):
    """
    Background worker that runs OCR on the uploaded document,
    sends the raw text to Groq/Instructor to parse key biomarkers and patient name,
    evaluates abnormal ranges, fetches user historical data and RAG medical facts,
    generates a personalized 9-section report summary and explanation,
    and conditionally commits metrics to database based on name matching.
    """
    logger.info(f"Starting background processing for report {report_id}")
    
    try:
        # 1. Run OCR Pipeline (Download, convert if PDF, OCR text)
        extracted_text = run_ocr_pipeline(file_path, mime_type)
        if not extracted_text or len(extracted_text.strip()) < 15:
            raise RuntimeError(
                "No readable text could be extracted from this document. "
                "Please ensure your document is not password-protected, encrypted, or "
                "too low resolution, and upload a clear scan or native digital PDF."
            )
        
        # 2. Call the LLM Structured parser to extract biomarkers list and patient name
        logger.info(f"Sending OCR text to Groq for structured parsing...")
        analysis = parse_report_text(extracted_text)
        
        if not analysis.biomarkers:
            raise RuntimeError(
                "No structured medical biomarkers or laboratory panel values could be identified. "
                "Please ensure you uploaded a supported blood panel or lab scan document containing values."
            )
        
        # 3. Fetch the user ID associated with this report
        with get_db_cursor() as cur:
            cur.execute("SELECT user_id FROM public.reports WHERE id = %s", (report_id,))
            report = cur.fetchone()
            user_id = report["user_id"] if report else None
            
        if not user_id:
            raise RuntimeError(f"Report {report_id} owner user_id could not be found.")

        # 4. Fetch User Profile (including height & blood_group)
        user_profile = {}
        with get_db_cursor() as cur:
            cur.execute("SELECT first_name, date_of_birth, gender, height, blood_group FROM public.profiles WHERE id = %s", (user_id,))
            profile = cur.fetchone()
            if profile:
                age = None
                if profile["date_of_birth"]:
                    today = datetime.date.today()
                    dob = profile["date_of_birth"]
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                user_profile = {
                    "first_name": profile["first_name"],
                    "age": age,
                    "gender": profile["gender"],
                    "height": profile["height"],
                    "blood_group": profile["blood_group"]
                }
                
        # 5. Fetch User Historical Biomarker values (records before current test date)
        historical_data = []
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT name, value, unit, recorded_at
                FROM public.biomarkers
                WHERE user_id = %s AND recorded_at < %s
                ORDER BY name, recorded_at ASC
                """,
                (user_id, recorded_at)
            )
            historical_rows = cur.fetchall()
            for row in historical_rows:
                historical_data.append({
                    "name": row["name"],
                    "value": row["value"],
                    "unit": row["unit"],
                    "recorded_at": str(row["recorded_at"])
                })

        # 6. Retrieve relevant medical facts for each extracted biomarker name via RAG
        medical_facts = []
        for biomarker in analysis.biomarkers:
            results = similarity_search_knowledge(biomarker.name, limit=1)
            if results:
                medical_facts.extend(results)
                
        # 7. Call generator for personalized 9-section report
        logger.info("Generating personalized clinical health summary and explanation report...")
        report_data = generate_personalized_report(
            biomarkers=analysis.biomarkers,
            user_profile=user_profile,
            historical_data=historical_data,
            medical_facts=medical_facts
        )

        # 8. Check if patient name on report matches logged-in user profile name
        is_mismatched = False
        if analysis.patient_name:
            user_first_name = user_profile.get("first_name", "").strip().lower()
            report_patient_name = analysis.patient_name.strip().lower()
            
            # Split user first name into keywords to perform sub-string match check
            first_name_parts = [p for p in re.split(r'\s+', user_first_name) if len(p) > 2]
            if first_name_parts:
                if not any(part in report_patient_name for part in first_name_parts):
                    is_mismatched = True
                    logger.warning(f"Name Mismatch: Report belongs to '{analysis.patient_name}', User profile is '{user_profile.get('first_name')}'")

        # 9. Format biomarkers to dict list for JSON storage
        biomarkers_list = []
        for b in analysis.biomarkers:
            biomarkers_list.append({
                "name": b.name,
                "value": b.value,
                "unit": b.unit,
                "reference_range": b.reference_range
            })

        # 10. If mismatched, prepend warnings to report explanation and hold commits
        approved_for_history = True
        if is_mismatched:
            approved_for_history = False
            warning_notice = (
                f"### ⚠️ Name Mismatch Detected\n\n"
                f"We detected that this report belongs to **{analysis.patient_name}**, but your account profile "
                f"first name is **{user_profile.get('first_name', 'User')}**.\n\n"
                f"To keep your health records personalized and clean, these biomarkers have **not** been added "
                f"to your tracking charts or RAG chat memory. Do you want to include them anyway?\n\n"
                f"--- \n\n"
            )
            report_data.explanation = warning_notice + report_data.explanation

        # 11. Save report metadata, summary, explanation and JSON list to database
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                UPDATE public.reports
                SET status = 'completed', 
                    raw_ocr_text = %s, 
                    summary = %s,
                    explanation = %s,
                    patient_name = %s,
                    is_mismatched = %s,
                    approved_for_history = %s,
                    extracted_biomarkers_json = %s,
                    updated_at = now()
                WHERE id = %s
                """,
                (
                    extracted_text, 
                    report_data.summary, 
                    report_data.explanation, 
                    analysis.patient_name,
                    is_mismatched,
                    approved_for_history,
                    json.dumps(biomarkers_list),
                    report_id
                )
            )

        # 12. Commit to historical timeline & generate embeddings ONLY if name is verified or approved
        if not is_mismatched:
            logger.info(f"Saving {len(analysis.biomarkers)} verified biomarkers to public.biomarkers...")
            with get_db_cursor(commit=True) as cur:
                cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
                for biomarker in analysis.biomarkers:
                    status = evaluate_biomarker_status(biomarker.value, biomarker.reference_range)
                    cur.execute(
                        """
                        INSERT INTO public.biomarkers (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            report_id, 
                            user_id, 
                            biomarker.name, 
                            biomarker.value, 
                            biomarker.unit, 
                            biomarker.reference_range, 
                            status, 
                            recorded_at
                        )
                    )
            
            logger.info(f"Generating sliding-window vector chunks for report {report_id}...")
            try:
                save_report_chunks(report_id, user_id, extracted_text)
            except Exception as chunk_err:
                logger.warning(f"Non-fatal warning: skipped saving vector chunks: {chunk_err}")
        else:
            logger.info("Skipped public.biomarkers timeline database commits due to name mismatch.")

        logger.info(f"Successfully processed report {report_id}.")
        
    except Exception as e:
        logger.error(f"Failed background processing for report {report_id}: {str(e)}")
        
        # Mark as failed in DB
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    """
                    UPDATE public.reports
                    SET status = 'failed', error_message = %s, updated_at = now()
                    WHERE id = %s
                    """,
                    (str(e), report_id)
                )
        except Exception as db_err:
            logger.error(f"Failed to save job failure status in DB: {str(db_err)}")
