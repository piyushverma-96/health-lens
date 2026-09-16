import json
import os
from app.core.db import get_db_cursor
from app.services.ocr import supabase

reports_template = [
    {
        "file_name": "Comprehensive_Metabolic_Panel_Demo.pdf",
        "mime_type": "application/pdf",
        "recorded_at": "2025-12-15",
        "patient_name": "Piyush Verma",
        "summary": "Comprehensive Metabolic Panel (CMP) showing optimal liver enzyme activity (ALT 24 U/L, AST 22 U/L), healthy kidney filtration (Creatinine 0.9 mg/dL), and stable fasting glucose at 92 mg/dL.",
        "explanation": "### Clinical Assessment & Metabolic Baseline\nYour liver and kidney function panels demonstrate strong baseline physiological health. Electrolyte balance and cellular metabolism are well within recommended reference ranges.",
        "biomarkers": [
            {"name": "Fasting Glucose", "value": 92, "unit": "mg/dL", "reference_range": "70-99", "status": "normal"},
            {"name": "BUN", "value": 14, "unit": "mg/dL", "reference_range": "7-20", "status": "normal"},
            {"name": "Creatinine", "value": 0.9, "unit": "mg/dL", "reference_range": "0.7-1.3", "status": "normal"},
            {"name": "ALT (SGPT)", "value": 24, "unit": "U/L", "reference_range": "7-56", "status": "normal"},
            {"name": "AST (SGOT)", "value": 22, "unit": "U/L", "reference_range": "10-40", "status": "normal"},
            {"name": "Total Bilirubin", "value": 0.7, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "normal"}
        ]
    },
    {
        "file_name": "Complete_Blood_Count_and_Vitamins_Demo.pdf",
        "mime_type": "application/pdf",
        "recorded_at": "2026-02-10",
        "patient_name": "Piyush Verma",
        "summary": "CBC panel is robust with strong hemoglobin (14.2 g/dL) and normal platelet counts. Vitamin D (25-OH) is sub-optimal at 19.5 ng/mL, indicating mild deficiency that requires supplementation.",
        "explanation": "### Hematologic & Micronutrient Analysis\n1. **Red & White Blood Cells**: Hemoglobin and immune cell counts reflect excellent bone marrow production.\n2. **⚠️ Micronutrient Deficiency**: Vitamin D is 19.5 ng/mL (optimal range: 30-100 ng/mL). Recommend discussing a 2000-4000 IU/day D3 + K2 regimen or morning sunlight exposure.",
        "biomarkers": [
            {"name": "Hemoglobin", "value": 14.2, "unit": "g/dL", "reference_range": "13.8-17.2", "status": "normal"},
            {"name": "RBC Count", "value": 4.8, "unit": "million/mcL", "reference_range": "4.5-5.9", "status": "normal"},
            {"name": "WBC Count", "value": 6.5, "unit": "x10^3/mcL", "reference_range": "4.5-11.0", "status": "normal"},
            {"name": "Platelets", "value": 250, "unit": "x10^3/mcL", "reference_range": "150-450", "status": "normal"},
            {"name": "Vitamin D", "value": 19.5, "unit": "ng/mL", "reference_range": "30-100", "status": "low"},
            {"name": "Vitamin B12", "value": 480, "unit": "pg/mL", "reference_range": "200-900", "status": "normal"}
        ]
    },
    {
        "file_name": "Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
        "mime_type": "application/pdf",
        "recorded_at": "2026-03-05",
        "patient_name": "Piyush Verma",
        "summary": "Cardiovascular screening reveals elevated Total Cholesterol (215 mg/dL) and borderline-high LDL (138 mg/dL). Triglycerides (145 mg/dL), HbA1c (5.4%), and TSH (2.1 mIU/L) remain in optimal ranges.",
        "explanation": "### Cardiovascular & Endocrine Profile\n- **Atherogenic Lipids**: Elevated LDL (138 mg/dL) indicates potential buildup risk over time. Dietary adjustments reducing saturated fats and increasing soluble fiber are advised.\n- **Glycemic & Thyroid Control**: HbA1c at 5.4% indicates healthy long-term glucose stability, and thyroid function is normal.",
        "biomarkers": [
            {"name": "Total Cholesterol", "value": 215, "unit": "mg/dL", "reference_range": "<200", "status": "high"},
            {"name": "LDL", "value": 138, "unit": "mg/dL", "reference_range": "<100", "status": "high"},
            {"name": "HDL", "value": 48, "unit": "mg/dL", "reference_range": ">40", "status": "normal"},
            {"name": "Triglycerides", "value": 145, "unit": "mg/dL", "reference_range": "<150", "status": "normal"},
            {"name": "HbA1c", "value": 5.4, "unit": "%", "reference_range": "<5.7", "status": "normal"},
            {"name": "TSH", "value": 2.1, "unit": "mIU/L", "reference_range": "0.4-4.0", "status": "normal"}
        ]
    }
]

def seed():
    with get_db_cursor() as cur:
        cur.execute("SELECT id, email FROM auth.users")
        users = cur.fetchall()

    if not users:
        print("No users found in auth.users.")
        return

    print(f"Found {len(users)} users in auth.users.")

    for u in users:
        user_id = str(u["id"])
        email = u.get("email", "")
        print(f"\n--- Seeding demo reports for user {email} ({user_id}) ---")

        for rep in reports_template:
            file_name = rep["file_name"]
            storage_path = f"{user_id}/demo_{file_name}"
            
            with get_db_cursor(commit=True) as cur:
                # Check if report exists
                cur.execute(
                    "SELECT id FROM public.reports WHERE user_id = %s AND file_name = %s",
                    (user_id, file_name)
                )
                existing = cur.fetchone()
                if existing:
                    report_id = existing["id"]
                    print(f"  Report already exists: {file_name}")
                else:
                    cur.execute(
                        """
                        INSERT INTO public.reports (
                            user_id, file_path, file_name, mime_type, status, 
                            summary, explanation, patient_name, is_mismatched, 
                            approved_for_history, extracted_biomarkers_json, recorded_at
                        )
                        VALUES (%s, %s, %s, %s, 'completed', %s, %s, %s, false, true, %s, %s)
                        RETURNING id
                        """,
                        (
                            user_id,
                            storage_path,
                            file_name,
                            rep["mime_type"],
                            rep["summary"],
                            rep["explanation"],
                            rep["patient_name"],
                            json.dumps(rep["biomarkers"]),
                            rep["recorded_at"]
                        )
                    )
                    report_id = cur.fetchone()["id"]
                    print(f"  Created report: {file_name} (id={report_id})")

                # Insert biomarkers
                cur.execute("DELETE FROM public.biomarkers WHERE report_id = %s", (report_id,))
                for b in rep["biomarkers"]:
                    cur.execute(
                        """
                        INSERT INTO public.biomarkers (
                            report_id, user_id, name, value, unit, reference_range, status, recorded_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            report_id,
                            user_id,
                            b["name"],
                            b["value"],
                            b["unit"],
                            b["reference_range"],
                            b["status"],
                            rep["recorded_at"]
                        )
                    )
                print(f"    Inserted {len(rep['biomarkers'])} biomarkers for {file_name}")

    print("\nSuccessfully seeded demo medical reports for all user accounts!")

if __name__ == "__main__":
    seed()
