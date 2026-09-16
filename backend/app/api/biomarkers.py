from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.core.security import get_current_user
from app.core.db import get_db_cursor
from app.models.biomarker import BiomarkerResponse

router = APIRouter(prefix="/biomarkers", tags=["biomarkers"])

@router.get("/", response_model=List[BiomarkerResponse])
def get_biomarkers(
    name: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """
    Retrieves historical measurements for a specific biomarker or all biomarkers.
    Sorted by recorded_at ASC (chronological order) for easy charting.
    """
    try:
        with get_db_cursor() as cur:
            if name:
                cur.execute(
                    """
                    SELECT id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                    FROM public.biomarkers
                    WHERE user_id = %s AND name = %s
                    ORDER BY recorded_at ASC
                    """,
                    (user_id, name)
                )
            else:
                cur.execute(
                    """
                    SELECT id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                    FROM public.biomarkers
                    WHERE user_id = %s
                    ORDER BY recorded_at ASC
                    """,
                    (user_id,)
                )
            biomarkers = cur.fetchall()
        return biomarkers
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve biomarkers: {str(e)}"
        )

@router.get("/summary", response_model=List[BiomarkerResponse])
def get_biomarker_summary(user_id: str = Depends(get_current_user)):
    """
    Retrieves the latest measurement record for each unique biomarker type.
    """
    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT ON (name) id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                FROM public.biomarkers
                WHERE user_id = %s
                ORDER BY name, recorded_at DESC
                """,
                (user_id,)
            )
            summary = cur.fetchall()
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve biomarker summary: {str(e)}"
        )

from pydantic import BaseModel
from datetime import date

class BiomarkerUpdate(BaseModel):
    value: float
    unit: str
    reference_range: Optional[str] = None
    recorded_at: date

class BiomarkerCreate(BaseModel):
    name: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    recorded_at: date

@router.post("/", response_model=BiomarkerResponse, status_code=status.HTTP_201_CREATED)
def create_biomarker(
    biomarker_data: BiomarkerCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Manually creates a new biomarker record in the user's health memory.
    """
    try:
        from app.services.parser import evaluate_biomarker_status, normalize_biomarker_name, normalize_biomarker_unit_and_value
        
        # Normalize name, unit, and value before saving
        normalized_name = normalize_biomarker_name(biomarker_data.name)
        normalized_val, normalized_unit, normalized_ref = normalize_biomarker_unit_and_value(
            normalized_name, biomarker_data.value, biomarker_data.unit, biomarker_data.reference_range
        )
        status_val = evaluate_biomarker_status(normalized_val, normalized_ref)
        
        with get_db_cursor(commit=True) as cur:
            # 1. Check if the special manual report exists
            cur.execute(
                """
                SELECT id FROM public.reports
                WHERE user_id = %s AND file_path = 'manual' AND file_name = 'Manual Health Log'
                LIMIT 1
                """,
                (user_id,)
            )
            report = cur.fetchone()
            
            if not report:
                # Create the manual report log
                cur.execute(
                    """
                    INSERT INTO public.reports (user_id, file_path, file_name, mime_type, status, summary, explanation, approved_for_history)
                    VALUES (%s, 'manual', 'Manual Health Log', 'application/json', 'completed', 'Manually entered health metrics', 'This report contains your manually entered health readings.', true)
                    RETURNING id
                    """,
                    (user_id,)
                )
                report = cur.fetchone()
                
            report_id = report["id"]
            
            # 2. Insert biomarker
            cur.execute(
                """
                INSERT INTO public.biomarkers (report_id, user_id, name, value, unit, reference_range, status, recorded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                """,
                (
                    report_id,
                    user_id,
                    normalized_name,
                    normalized_val,
                    normalized_unit,
                    normalized_ref,
                    status_val,
                    biomarker_data.recorded_at
                )
            )
            new_record = cur.fetchone()
            
        return new_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create biomarker record: {str(e)}"
        )

@router.put("/{biomarker_id}", response_model=BiomarkerResponse)
def update_biomarker(
    biomarker_id: str,
    update_data: BiomarkerUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Updates an existing biomarker record's value, unit, reference range, or test date.
    Re-evaluates normal/low/high biological status based on the new value and range.
    """
    try:
        # Check ownership first
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT id, name FROM public.biomarkers WHERE id = %s AND user_id = %s",
                (biomarker_id, user_id)
            )
            existing = cur.fetchone()
            
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Biomarker not found or access denied."
            )
            
        # Re-evaluate biomarker status using new range and normalize
        from app.services.parser import evaluate_biomarker_status, normalize_biomarker_unit_and_value
        
        biomarker_name = existing["name"]
        normalized_val, normalized_unit, normalized_ref = normalize_biomarker_unit_and_value(
            biomarker_name, update_data.value, update_data.unit, update_data.reference_range
        )
        new_status = evaluate_biomarker_status(normalized_val, normalized_ref)
        
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                UPDATE public.biomarkers
                SET value = %s,
                    unit = %s,
                    reference_range = %s,
                    status = %s,
                    recorded_at = %s
                WHERE id = %s AND user_id = %s
                RETURNING id, report_id, user_id, name, value, unit, reference_range, status, recorded_at
                """,
                (
                    normalized_val,
                    normalized_unit,
                    normalized_ref,
                    new_status,
                    update_data.recorded_at,
                    biomarker_id,
                    user_id
                )
            )
            updated = cur.fetchone()
            
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update biomarker record: {str(e)}"
        )

@router.delete("/{biomarker_id}", status_code=status.HTTP_200_OK)
def delete_biomarker(
    biomarker_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Removes a specific biomarker record from the user's health memory.
    """
    try:
        # Check ownership first
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT id FROM public.biomarkers WHERE id = %s AND user_id = %s",
                (biomarker_id, user_id)
            )
            existing = cur.fetchone()
            
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Biomarker not found or access denied."
            )
            
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "DELETE FROM public.biomarkers WHERE id = %s AND user_id = %s",
                (biomarker_id, user_id)
            )
            
        return {"status": "success", "message": "Biomarker successfully deleted from memory."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete biomarker record: {str(e)}"
        )

