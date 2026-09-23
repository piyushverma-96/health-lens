import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from typing import List
from app.core.security import get_current_user
from app.core.db import get_db_cursor
from app.models.report import ReportCreate, ReportResponse
from app.services.worker import process_report_background_job
from app.services.ocr import supabase  # Re-use initialized Supabase client
from app.services.parser import evaluate_biomarker_status
from app.services.rag import save_report_chunks

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Registers a new uploaded report in the database and triggers background OCR processing.
    """
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
    file_name = (report_data.file_name or "").strip()
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format ('.{ext}'). Only PNG, JPG, and PDF files are accepted for medical reports."
        )

    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO public.reports (user_id, file_path, file_name, mime_type, status, recorded_at)
                VALUES (%s, %s, %s, %s, 'pending', %s)
                RETURNING id, user_id, file_path, file_name, mime_type, status, raw_ocr_text, summary, explanation, error_message, patient_name, is_mismatched, approved_for_history, recorded_at, uploaded_at, updated_at
                """,
                (user_id, report_data.file_path, report_data.file_name, report_data.mime_type, report_data.recorded_at)
            )
            report = cur.fetchone()
            
        if not report:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register report in the database."
            )

        # Trigger async background worker task for OCR
        background_tasks.add_task(
            process_report_background_job,
            str(report["id"]),
            report_data.file_path,
            report_data.mime_type,
            str(report["recorded_at"])
        )
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create report: {str(e)}"
        )

@router.get("/", response_model=List[ReportResponse])
def list_reports(user_id: str = Depends(get_current_user)):
    """
    Retrieves all reports for the authenticated user, ordered by report test date.
    """
    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, file_path, file_name, mime_type, status, raw_ocr_text, summary, explanation, error_message, patient_name, is_mismatched, approved_for_history, recorded_at, uploaded_at, updated_at
                FROM public.reports
                WHERE user_id = %s
                ORDER BY recorded_at DESC, uploaded_at DESC
                """,
                (user_id,)
            )
            reports = cur.fetchall()
        return reports
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reports list: {str(e)}"
        )

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, user_id: str = Depends(get_current_user)):
    """
    Retrieves full details of a specific report.
    Uses a single DB connection for both the report and its biomarkers.
    """
    try:
        biomarkers = []
        report = None

        with get_db_cursor() as cur:
            # Fetch report
            cur.execute(
                """
                SELECT id, user_id, file_path, file_name, mime_type, status, raw_ocr_text, summary, explanation, error_message, patient_name, is_mismatched, approved_for_history, extracted_biomarkers_json, recorded_at, uploaded_at, updated_at
                FROM public.reports
                WHERE id = %s AND user_id = %s
                """,
                (report_id, user_id)
            )
            report = cur.fetchone()

            if not report:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Report not found or access denied."
                )

            # Fetch biomarkers in the same connection — avoids a second round-trip
            if report["status"] == "completed":
                if report.get("approved_for_history", True):
                    cur.execute(
                        """
                        SELECT id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                        FROM public.biomarkers
                        WHERE report_id = %s
                        ORDER BY name ASC
                        """,
                        (report_id,)
                    )
                    biomarkers = cur.fetchall()
                else:
                    # Load from extracted_biomarkers_json to render in detailed table before approval
                    if report.get("extracted_biomarkers_json"):
                        raw_json = report["extracted_biomarkers_json"]
                        if isinstance(raw_json, str):
                            biomarkers = json.loads(raw_json)
                        else:
                            biomarkers = raw_json

                        # Format to fit BiomarkerResponse structure
                        for idx, b in enumerate(biomarkers):
                            b["id"] = f"temp-{idx}"
                            b["report_id"] = report_id
                            b["user_id"] = user_id
                            b["status"] = evaluate_biomarker_status(b["value"], b.get("reference_range"))
                            b["recorded_at"] = report["recorded_at"]

        # Inject biomarkers list into dictionary response
        report["biomarkers"] = biomarkers
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch report details: {str(e)}"
        )

@router.delete("/{report_id}", status_code=status.HTTP_200_OK)
def delete_report(report_id: str, user_id: str = Depends(get_current_user)):
    """
    Deletes the report record from the database and deletes the physical file from storage.
    """
    try:
        # 1. Fetch file details to clean up from storage
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT file_path FROM public.reports WHERE id = %s AND user_id = %s",
                (report_id, user_id)
            )
            report = cur.fetchone()

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied."
            )

        file_path = report["file_path"]

        # 2. Delete database row (cascades automatically to biomarkers and chunks)
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "DELETE FROM public.reports WHERE id = %s AND user_id = %s",
                (report_id, user_id)
            )

        # 3. Clean up physical asset from Supabase Storage
        try:
            supabase.storage.from_("reports").remove([file_path])
        except Exception as st_err:
            print(f"Non-fatal error: Failed to clean up file {file_path} from storage: {str(st_err)}")

        return {"status": "success", "message": "Report successfully deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete report: {str(e)}"
        )

@router.post("/{report_id}/approve", status_code=status.HTTP_200_OK)
def approve_report(report_id: str, user_id: str = Depends(get_current_user)):
    """
    Approves a name-mismatched report, committing its parsed biomarkers
    to the personal historical timeline and chunking its text for RAG memory.
    """
    try:
        # 1. Fetch the report details
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, file_path, status, recorded_at, raw_ocr_text, 
                       is_mismatched, approved_for_history, extracted_biomarkers_json, explanation
                FROM public.reports
                WHERE id = %s AND user_id = %s
                """,
                (report_id, user_id)
            )
            report = cur.fetchone()
            
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied."
            )
            
        if report["approved_for_history"]:
            return {"status": "success", "message": "Report is already approved."}
            
        # 2. Extract biomarkers from JSON
        biomarkers = []
        if report["extracted_biomarkers_json"]:
            raw_json = report["extracted_biomarkers_json"]
            if isinstance(raw_json, str):
                biomarkers = json.loads(raw_json)
            else:
                biomarkers = raw_json
                
        # Remove warning notice from explanation since user approved it
        clean_explanation = report["explanation"]
        if "---" in clean_explanation:
            parts = clean_explanation.split("---", 1)
            if len(parts) > 1:
                clean_explanation = parts[1].strip()
        
        with get_db_cursor(commit=True) as cur:
            # 3. Update report status to approved and clean warnings
            cur.execute(
                """
                UPDATE public.reports
                SET approved_for_history = true,
                    explanation = %s,
                    updated_at = now()
                WHERE id = %s
                """,
                (clean_explanation, report_id)
            )
            
            # 4. Insert biomarkers into public.biomarkers
            cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
            for b in biomarkers:
                status_val = evaluate_biomarker_status(b["value"], b.get("reference_range"))
                cur.execute(
                    """
                    INSERT INTO public.biomarkers (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        report_id,
                        user_id,
                        b["name"],
                        b["value"],
                        b["unit"],
                        b.get("reference_range"),
                        status_val,
                        report["recorded_at"]
                    )
                )
                
        # 5. Index chunks for RAG conversation search
        if report["raw_ocr_text"]:
            save_report_chunks(report_id, user_id, report["raw_ocr_text"])
            
        return {"status": "success", "message": "Report approved. Biomarkers and RAG memory initialized successfully."}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve report: {str(e)}"
        )

@router.post("/{report_id}/retry", status_code=status.HTTP_200_OK)
def retry_report_extraction(
    report_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Retries OCR text extraction and biomarker parsing for a failed report.
    Rate-limited to prevent spam.
    """
    try:
        # 1. Fetch report details
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, file_path, mime_type, status, updated_at, recorded_at
                FROM public.reports
                WHERE id = %s AND user_id = %s
                """,
                (report_id, user_id)
            )
            report = cur.fetchone()
            
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied."
            )
            
        # 2. Rate limit check (e.g. 30 seconds cooldown)
        import datetime
        from datetime import timezone
        now = datetime.datetime.now(timezone.utc)
        updated_at = report["updated_at"]
        
        # If updated_at is naive, make it aware (or vice versa)
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
            
        time_since_update = (now - updated_at).total_seconds()
        cooldown = 30 # seconds
        if time_since_update < cooldown:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(cooldown - time_since_update)} seconds before retrying extraction."
            )
            
        # 3. Reset report status to pending and clear error/ocr/biomarkers fields
        with get_db_cursor(commit=True) as cur:
            # Delete any partially extracted biomarkers
            cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
            # Delete any partially saved report chunks
            cur.execute("DELETE FROM public.report_chunks WHERE report_id = %s", (report_id,))
            
            cur.execute(
                """
                UPDATE public.reports
                SET status = 'pending',
                    error_message = NULL,
                    raw_ocr_text = NULL,
                    summary = NULL,
                    explanation = NULL,
                    patient_name = NULL,
                    extracted_biomarkers_json = NULL,
                    updated_at = now()
                WHERE id = %s AND user_id = %s
                RETURNING id, file_path, mime_type, recorded_at
                """,
                (report_id, user_id)
            )
            updated_report = cur.fetchone()
            
        # 4. Trigger async background worker task for OCR
        background_tasks.add_task(
            process_report_background_job,
            str(updated_report["id"]),
            updated_report["file_path"],
            updated_report["mime_type"],
            str(updated_report["recorded_at"])
        )
        
        return {"status": "success", "message": "Extraction retry scheduled successfully."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry report extraction: {str(e)}"
        )
