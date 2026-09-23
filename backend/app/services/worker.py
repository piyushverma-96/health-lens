import logging
import datetime
import re
import json
import time
import threading
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


# ---------------------------------------------------------------------------
# Non-critical background: biomarker commit + RAG indexing
# ---------------------------------------------------------------------------

def _run_non_critical_background(
    report_id: str,
    user_id: str,
    biomarkers: list,
    extracted_text: str,
    recorded_at: str,
):
    """
    Runs after the primary analysis is already saved and visible to the user.

    Handles:
      - Batch-inserting verified biomarkers into public.biomarkers
      - Generating vector embeddings + saving report chunks for RAG search

    Failures here are non-fatal: the primary report stays 'completed'.
    """
    t_nc_start = time.perf_counter()
    logger.info(f"[NON-CRITICAL] Starting background commit for report {report_id}...")

    # 1. Batch-insert verified biomarkers into public.biomarkers timeline
    try:
        t0 = time.perf_counter()
        logger.info(f"[NON-CRITICAL] Batch-inserting {len(biomarkers)} biomarkers...")

        rows = []
        for b in biomarkers:
            status = evaluate_biomarker_status(b["value"], b["reference_range"])
            rows.append((
                report_id,
                user_id,
                b["name"],
                b["value"],
                b["unit"],
                b["reference_range"],
                status,
                recorded_at,
            ))

        with get_db_cursor(commit=True) as cur:
            cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
            # Try psycopg2 execute_values batch insert (1 round-trip instead of N)
            try:
                from psycopg2.extras import execute_values
                execute_values(
                    cur._cursor if hasattr(cur, "_cursor") else cur,
                    """
                    INSERT INTO public.biomarkers
                        (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                    VALUES %s
                    """,
                    rows,
                )
            except Exception:
                # pg8000 fallback: individual inserts (still one connection)
                for row in rows:
                    cur.execute(
                        """
                        INSERT INTO public.biomarkers
                            (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        row,
                    )

        logger.info(
            f"[TIMING] Biomarker DB save ({len(rows)} rows): "
            f"{(time.perf_counter() - t0) * 1000:.0f} ms"
        )
    except Exception as bm_err:
        logger.warning(f"[NON-CRITICAL] Biomarker save failed (non-fatal): {bm_err}")

    # 2. Generate and save vector embeddings for RAG search
    try:
        logger.info(f"[NON-CRITICAL] Generating sliding-window vector chunks for report {report_id}...")
        t0 = time.perf_counter()
        save_report_chunks(report_id, user_id, extracted_text)
        logger.info(
            f"[TIMING] RAG chunk indexing: {(time.perf_counter() - t0) * 1000:.0f} ms"
        )
    except Exception as chunk_err:
        logger.warning(f"[NON-CRITICAL] Vector chunk indexing failed (non-fatal): {chunk_err}")

    logger.info(
        f"[TIMING] Non-critical background total: "
        f"{(time.perf_counter() - t_nc_start) * 1000:.0f} ms for report {report_id}"
    )


# ---------------------------------------------------------------------------
# Main background worker
# ---------------------------------------------------------------------------

def process_report_background_job(report_id: str, file_path: str, mime_type: str, recorded_at: str):
    """
    Background worker that runs OCR on the uploaded document,
    sends the raw text to Groq/Instructor to parse key biomarkers and patient name,
    evaluates abnormal ranges, fetches user historical data and RAG medical facts,
    generates a personalized 9-section report summary and explanation,
    and conditionally commits metrics to database based on name matching.

    Pipeline stages
    ---------------
    CRITICAL (user waits for these):
      1. Download + extract text (OCR / native PDF)
      2. Groq biomarker extraction
      3. Fetch user profile + history (single DB connection)
      4. RAG knowledge lookup (parallel)
      5. Groq report generation
      6. Save report record → status = 'completed'

    NON-CRITICAL (runs in a daemon thread after step 6):
      7. Batch-insert verified biomarkers into public.biomarkers
      8. Generate embeddings + save report chunks for RAG
    """
    t_total_start = time.perf_counter()
    logger.info(f"Starting background processing for report {report_id}")

    # Mark as 'processing' immediately so the frontend can show real progress
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE public.reports SET status = 'processing', updated_at = now() WHERE id = %s",
                (report_id,)
            )
    except Exception as status_err:
        logger.warning(f"Could not set processing status: {status_err}")
    
    try:
        # ------------------------------------------------------------------ #
        # STAGE 1 (backend): Text extraction — download + native PDF or OCR  #
        # Frontend: Stage 2 "Reading Report"                                  #
        # ------------------------------------------------------------------ #
        # Update status so frontend knows we're actively extracting
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE public.reports SET status = 'extracting', updated_at = now() WHERE id = %s",
                    (report_id,)
                )
        except Exception:
            pass  # non-fatal

        t0 = time.perf_counter()
        extracted_text = run_ocr_pipeline(file_path, mime_type)
        logger.info(
            f"[HealthLens Timing] Text extraction total: {(time.perf_counter() - t0) * 1000:.0f} ms "
            f"— {len(extracted_text)} chars"
        )

        if not extracted_text or len(extracted_text.strip()) < 15:
            raise RuntimeError(
                "No readable text could be extracted from this document. "
                "Please ensure your document is not password-protected, encrypted, or "
                "too low resolution, and upload a clear scan or native digital PDF."
            )
        
        # ------------------------------------------------------------------ #
        # STAGE 2 (backend): Groq biomarker extraction                       #
        # Frontend: Stage 3 "Extracting Biomarkers"                          #
        # ------------------------------------------------------------------ #
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE public.reports SET status = 'analyzing', updated_at = now() WHERE id = %s",
                    (report_id,)
                )
        except Exception:
            pass  # non-fatal

        logger.info(f"Sending extracted text to Groq for structured parsing...")
        t0 = time.perf_counter()
        analysis = parse_report_text(extracted_text)
        logger.info(
            f"[HealthLens Timing] Groq biomarker extraction stage: {(time.perf_counter() - t0) * 1000:.0f} ms"
        )
        
        if not analysis.biomarkers:
            raise RuntimeError(
                "No structured medical biomarkers or laboratory panel values could be identified. "
                "Please ensure you uploaded a supported blood panel or lab scan document containing values."
            )

        # ------------------------------------------------------------------ #
        # STAGE 3: Fetch user profile + history (single DB connection)       #
        # ------------------------------------------------------------------ #
        t0 = time.perf_counter()
        user_id = None
        user_profile = {}
        historical_data = []
        
        with get_db_cursor() as cur:
            # Get the user ID associated with this report
            cur.execute("SELECT user_id FROM public.reports WHERE id = %s", (report_id,))
            report = cur.fetchone()
            user_id = report["user_id"] if report else None
            
            if not user_id:
                raise RuntimeError(f"Report {report_id} owner user_id could not be found.")
            
            # Fetch User Profile (including height & blood_group)
            cur.execute(
                "SELECT first_name, date_of_birth, gender, height, blood_group FROM public.profiles WHERE id = %s",
                (user_id,)
            )
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
            
            # Fetch historical biomarker values before current test date
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

        logger.info(
            f"[HealthLens Timing] DB user/profile/history fetch: {(time.perf_counter() - t0) * 1000:.0f} ms"
        )

        # ------------------------------------------------------------------ #
        # STAGE 4: RAG medical knowledge lookup (parallel)                   #
        # ------------------------------------------------------------------ #
        t0 = time.perf_counter()
        medical_facts = []
        abnormal_biomarkers = [
            b for b in analysis.biomarkers 
            if evaluate_biomarker_status(b.value, b.reference_range) != "normal"
        ]
        target_biomarkers = abnormal_biomarkers[:4] if abnormal_biomarkers else analysis.biomarkers[:3]
        
        if target_biomarkers:
            def _lookup_biomarker_facts(biomarker):
                return similarity_search_knowledge(biomarker.name, limit=1)
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=min(4, len(target_biomarkers))) as executor:
                future_results = list(executor.map(_lookup_biomarker_facts, target_biomarkers))
            
            for results in future_results:
                if results:
                    medical_facts.extend(results)

        logger.info(
            f"[HealthLens Timing] RAG knowledge lookup: {(time.perf_counter() - t0) * 1000:.0f} ms"
        )
            
        # ------------------------------------------------------------------ #
        # STAGE 5 (backend): Groq personalized report generation             #
        # Frontend: Stage 4 "Generating Insights"                            #
        # ------------------------------------------------------------------ #
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE public.reports SET status = 'generating', updated_at = now() WHERE id = %s",
                    (report_id,)
                )
        except Exception:
            pass  # non-fatal

        logger.info("Generating personalized clinical health summary and explanation report...")
        t0 = time.perf_counter()
        report_data = generate_personalized_report(
            biomarkers=analysis.biomarkers,
            user_profile=user_profile,
            historical_data=historical_data,
            medical_facts=medical_facts
        )
        logger.info(
            f"[HealthLens Timing] Insight generation: {(time.perf_counter() - t0) * 1000:.0f} ms"
        )

        # ------------------------------------------------------------------ #
        # STAGE 6: Name mismatch check + format biomarkers                   #
        # ------------------------------------------------------------------ #
        t0 = time.perf_counter()
        is_mismatched = False
        if analysis.patient_name:
            user_first_name = user_profile.get("first_name", "").strip().lower()
            report_patient_name = analysis.patient_name.strip().lower()
            
            first_name_parts = [p for p in re.split(r'\s+', user_first_name) if len(p) > 2]
            if first_name_parts:
                if not any(part in report_patient_name for part in first_name_parts):
                    is_mismatched = True
                    logger.warning(
                        f"Name Mismatch: Report belongs to '{analysis.patient_name}', "
                        f"User profile is '{user_profile.get('first_name')}'"
                    )

        # Format biomarkers to dict list for JSON storage
        biomarkers_list = [
            {
                "name": b.name,
                "value": b.value,
                "unit": b.unit,
                "reference_range": b.reference_range
            }
            for b in analysis.biomarkers
        ]

        # Prepend mismatch warning to explanation if needed
        approved_for_history = not is_mismatched
        if is_mismatched:
            warning_notice = (
                f"### ⚠️ Name Mismatch Detected\n\n"
                f"We detected that this report belongs to **{analysis.patient_name}**, but your account profile "
                f"first name is **{user_profile.get('first_name', 'User')}**.\n\n"
                f"To keep your health records personalized and clean, these biomarkers have **not** been added "
                f"to your tracking charts or RAG chat memory. Do you want to include them anyway?\n\n"
                f"--- \n\n"
            )
            report_data.explanation = warning_notice + report_data.explanation

        # ------------------------------------------------------------------ #
        # STAGE 7 (CRITICAL): Save completed report → visible to user        #
        # ------------------------------------------------------------------ #
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE public.reports SET status = 'saving', updated_at = now() WHERE id = %s",
                    (report_id,)
                )
        except Exception:
            pass  # non-fatal

        t_db_start = time.perf_counter()
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                UPDATE public.reports
                SET status = 'completed', 
                    error_message = NULL,
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

        db_elapsed_ms = (time.perf_counter() - t_db_start) * 1000
        logger.info(f"[HealthLens Timing] Database insert: {db_elapsed_ms:.0f} ms")

        critical_elapsed_ms = (time.perf_counter() - t_total_start) * 1000
        logger.info(f"[HealthLens Timing] Total: {critical_elapsed_ms:.0f} ms")

        # ------------------------------------------------------------------ #
        # NON-CRITICAL: Biomarker timeline + embeddings in background thread #
        # Only runs if name is verified or approved                          #
        # ------------------------------------------------------------------ #
        if not is_mismatched:
            nc_thread = threading.Thread(
                target=_run_non_critical_background,
                args=(report_id, user_id, biomarkers_list, extracted_text, recorded_at),
                daemon=True,
                name=f"healthlens-noncrit-{report_id[:8]}"
            )
            nc_thread.start()
        else:
            logger.info("Skipped public.biomarkers/RAG commits due to name mismatch.")

        total_elapsed_ms = (time.perf_counter() - t_total_start) * 1000
        logger.info(
            f"[HealthLens Timing] Total: {critical_elapsed_ms:.0f} ms (critical) | "
            f"Worker returned: {total_elapsed_ms:.0f} ms for report {report_id}"
        )
        
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
