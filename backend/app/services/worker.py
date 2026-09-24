import logging
import datetime
import re
import json
import concurrent.futures
from app.core.db import get_db_cursor
from app.services.ocr import run_ocr_pipeline
from app.services.parser import (
    parse_report_text, 
    evaluate_biomarker_status, 
    generate_personalized_report
)
from app.services.rag import save_report_chunks, similarity_search_knowledge

logger = logging.getLogger("healthlens.worker")

def _fetch_user_context(report_id: str, recorded_at: str):
    """
    Fetches user_id, profile, and historical biomarker values in a single pooled connection.
    Executes concurrently while document OCR and LLM extraction are in progress.
    """
    with get_db_cursor() as cur:
        # Fetch the user ID associated with this report
        cur.execute("SELECT user_id FROM public.reports WHERE id = %s", (report_id,))
        report_row = cur.fetchone()
        user_id = report_row["user_id"] if report_row else None
        
        if not user_id:
            raise RuntimeError(f"Report {report_id} owner user_id could not be found.")

        # Fetch User Profile (including height & blood_group)
        cur.execute(
            "SELECT first_name, date_of_birth, gender, height, blood_group FROM public.profiles WHERE id = %s",
            (user_id,)
        )
        profile = cur.fetchone()
        user_profile = {}
        if profile:
            age = None
            if profile.get("date_of_birth"):
                today = datetime.date.today()
                dob = profile["date_of_birth"]
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            user_profile = {
                "first_name": profile.get("first_name"),
                "age": age,
                "gender": profile.get("gender"),
                "height": profile.get("height"),
                "blood_group": profile.get("blood_group")
            }

        # Fetch User Historical Biomarker values (records before current test date)
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
        historical_data = [
            {
                "name": row["name"],
                "value": row["value"],
                "unit": row["unit"],
                "recorded_at": str(row["recorded_at"])
            }
            for row in historical_rows
        ]

    return user_id, user_profile, historical_data

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
        # Start DB user profile and history retrieval concurrently with document OCR/extraction
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            user_context_future = executor.submit(_fetch_user_context, report_id, recorded_at)

            # 1. Run OCR Pipeline (Download, convert if PDF, OCR text)
            extracted_text = run_ocr_pipeline(file_path, mime_type)
            if not extracted_text or len(extracted_text.strip()) < 15:
                raise RuntimeError(
                    "No readable text could be extracted from this document. "
                    "Please ensure your document is not password-protected, encrypted, or "
                    "too low resolution, and upload a clear scan or native digital PDF."
                )
            
            # 2. Call the LLM Structured parser to extract biomarkers list and patient name
            logger.info("Sending OCR text to Groq for structured parsing...")
            analysis = parse_report_text(extracted_text)
            
            if not analysis.biomarkers:
                raise RuntimeError(
                    "No structured medical biomarkers or laboratory panel values could be identified. "
                    "Please ensure you uploaded a supported blood panel or lab scan document containing values."
                )

            # Retrieve user profile and historical data (already completed concurrently in background)
            user_id, user_profile, historical_data = user_context_future.result()

        # 3. Retrieve relevant medical facts for key/abnormal biomarkers via RAG (fast targeted lookup)
        medical_facts = []
        abnormal_biomarkers = [
            b for b in analysis.biomarkers 
            if evaluate_biomarker_status(b.value, b.reference_range) != "normal"
        ]
        target_biomarkers = abnormal_biomarkers[:4] if abnormal_biomarkers else analysis.biomarkers[:3]
        for biomarker in target_biomarkers:
            results = similarity_search_knowledge(biomarker.name, limit=1)
            if results:
                medical_facts.extend(results)
                
        # 4. Call generator for personalized 9-section report
        logger.info("Generating personalized clinical health summary and explanation report...")
        report_data = generate_personalized_report(
            biomarkers=analysis.biomarkers,
            user_profile=user_profile,
            historical_data=historical_data,
            medical_facts=medical_facts
        )

        # 5. Check if patient name on report matches logged-in user profile name
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

        # 6. Format biomarkers to dict list for JSON storage
        biomarkers_list = []
        for b in analysis.biomarkers:
            biomarkers_list.append({
                "name": b.name,
                "value": b.value,
                "unit": b.unit,
                "reference_range": b.reference_range
            })

        # 7. If mismatched, prepend warnings to report explanation and hold commits
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

        # 8. Save report metadata, summary, explanation and commit biomarkers in a single DB session
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

            # 9. Batch-insert verified biomarkers in ONE single SQL roundtrip
            if not is_mismatched:
                cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
                if analysis.biomarkers:
                    logger.info(f"Batch-inserting {len(analysis.biomarkers)} verified biomarkers to public.biomarkers...")
                    values_placeholders = []
                    insert_params = []
                    for biomarker in analysis.biomarkers:
                        status_val = evaluate_biomarker_status(biomarker.value, biomarker.reference_range)
                        values_placeholders.append("(%s, %s, %s, %s, %s, %s, %s, %s)")
                        insert_params.extend([
                            report_id,
                            user_id,
                            biomarker.name,
                            biomarker.value,
                            biomarker.unit,
                            biomarker.reference_range,
                            status_val,
                            recorded_at
                        ])
                    batch_sql = f"""
                        INSERT INTO public.biomarkers (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                        VALUES {", ".join(values_placeholders)}
                    """
                    cur.execute(batch_sql, insert_params)
            else:
                logger.info("Skipped public.biomarkers timeline database commits due to name mismatch.")

        # 10. Index vector chunks for RAG chat search (non-blocking)
        if not is_mismatched:
            logger.info(f"Generating sliding-window vector chunks for report {report_id}...")
            try:
                save_report_chunks(report_id, user_id, extracted_text)
            except Exception as chunk_err:
                logger.warning(f"Non-fatal warning: skipped saving vector chunks: {chunk_err}")

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
