import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Directories for saving demo PDFs
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DEMO_DIR = os.path.join(ROOT_DIR, "frontend", "public", "demo-reports")
ROOT_SAMPLE_DIR = os.path.join(ROOT_DIR, "sample_reports")

os.makedirs(FRONTEND_DEMO_DIR, exist_ok=True)
os.makedirs(ROOT_SAMPLE_DIR, exist_ok=True)

REPORTS_DATA = [
    {
        "filename": "Comprehensive_Metabolic_Panel_Demo.pdf",
        "title": "COMPREHENSIVE METABOLIC PANEL (CMP)",
        "recorded_at": "2025-12-15",
        "sample_id": "HL-2025-88412",
        "category": "Routine Biochemical Evaluation",
        "patient": {
            "name": "Piyush Verma",
            "age_gender": "20 Y / Male",
            "referred_by": "Dr. R. K. Mehta, MD (General Medicine)",
            "collection_time": "15-Dec-2025 08:30 AM",
            "reported_time": "15-Dec-2025 04:15 PM",
        },
        "tests": [
            ("Fasting Glucose", 92, "mg/dL", "70 - 99", "Normal", "Hexokinase enzymatic"),
            ("BUN (Blood Urea Nitrogen)", 14, "mg/dL", "7 - 20", "Normal", "Urease kinetic"),
            ("Creatinine", 0.9, "mg/dL", "0.7 - 1.3", "Normal", "Modified Jaffe method"),
            ("ALT (SGPT)", 24, "U/L", "7 - 56", "Normal", "IFCC without P5P"),
            ("AST (SGOT)", 22, "U/L", "10 - 40", "Normal", "IFCC without P5P"),
            ("Total Bilirubin", 0.7, "mg/dL", "0.2 - 1.2", "Normal", "DPD photometric"),
        ],
        "notes": "Patient was fasting for 10 hours prior to venipuncture. Hepatic and renal function baseline indicators are intact."
    },
    {
        "filename": "Complete_Blood_Count_and_Vitamins_Demo.pdf",
        "title": "COMPLETE BLOOD COUNT & MICRONUTRIENT PANEL",
        "recorded_at": "2026-02-10",
        "sample_id": "HL-2026-10294",
        "category": "Hematology & Immunoassay Profile",
        "patient": {
            "name": "Piyush Verma",
            "age_gender": "20 Y / Male",
            "referred_by": "Dr. Sunita Rao, MD (Internal Medicine)",
            "collection_time": "10-Feb-2026 09:00 AM",
            "reported_time": "10-Feb-2026 05:45 PM",
        },
        "tests": [
            ("Hemoglobin", 14.2, "g/dL", "13.8 - 17.2", "Normal", "SLS-Hemoglobin method"),
            ("RBC Count", 4.8, "million/mcL", "4.5 - 5.9", "Normal", "Automated impedance"),
            ("WBC Count", 6.5, "x10^3/mcL", "4.5 - 11.0", "Normal", "Flow cytometry / scattering"),
            ("Platelets", 250, "x10^3/mcL", "150 - 450", "Normal", "Laser optical detection"),
            ("Vitamin D", 19.5, "ng/mL", "30 - 100", "LOW", "Chemiluminescence (CLIA)"),
            ("Vitamin B12", 480, "pg/mL", "200 - 900", "Normal", "Electrochemiluminescence"),
        ],
        "notes": "Hematology indices show normal erythropoiesis. 25-Hydroxy Vitamin D level is sub-optimal (< 20 ng/mL) indicating mild deficiency."
    },
    {
        "filename": "Cardiovascular_Lipid_and_Thyroid_Demo.pdf",
        "title": "CARDIOVASCULAR LIPID & THYROID PROFILE",
        "recorded_at": "2026-03-05",
        "sample_id": "HL-2026-33921",
        "category": "Cardio-Metabolic & Endocrine Screening",
        "patient": {
            "name": "Piyush Verma",
            "age_gender": "20 Y / Male",
            "referred_by": "Dr. R. K. Mehta, MD (General Medicine)",
            "collection_time": "05-Mar-2026 08:15 AM",
            "reported_time": "05-Mar-2026 06:00 PM",
        },
        "tests": [
            ("Total Cholesterol", 215, "mg/dL", "< 200", "HIGH", "Enzymatic esterase / oxidase"),
            ("LDL", 138, "mg/dL", "< 100", "HIGH", "Direct homogeneous assay"),
            ("HDL", 48, "mg/dL", "> 40", "Normal", "Direct accelerator clearance"),
            ("Triglycerides", 145, "mg/dL", "< 150", "Normal", "GPO-PAP enzymatic"),
            ("HbA1c", 5.4, "%", "< 5.7", "Normal", "HPLC Ion-exchange"),
            ("TSH", 2.1, "mIU/L", "0.4 - 4.0", "Normal", "Ultrasensitive ECLIA"),
        ],
        "notes": "Total cholesterol and calculated LDL are moderately elevated above recommended primary prevention thresholds. Glycemic control (HbA1c) and thyroid function (TSH) are within normal reference limits."
    }
]

def build_pdf(report_info, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    disclaimer_style = ParagraphStyle(
        'DisclaimerBanner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor("#991b1b"),
        alignment=1, # Center
        spaceAfter=6
    )
    
    lab_name_style = ParagraphStyle(
        'LabName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=2
    )

    lab_sub_style = ParagraphStyle(
        'LabSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=6
    )

    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=4,
        spaceAfter=6
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.HexColor("#334155")
    )

    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor("#0f172a")
    )

    tbl_head_style = ParagraphStyle(
        'TblHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.HexColor("#0f172a")
    )

    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor("#1e293b")
    )

    tbl_bold_style = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.HexColor("#0f172a")
    )

    alert_style = ParagraphStyle(
        'AlertCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.HexColor("#dc2626")
    )

    story = []

    # 1. Prominent SYNTHETIC DATA DISCLAIMER BANNER
    disclaimer_text = (
        "*** DEMO / SYNTHETIC DATA — NOT A REAL MEDICAL REPORT — FOR TESTING HEALTHLENS AI ONLY ***"
    )
    disclaimer_table = Table(
        [[Paragraph(disclaimer_text, disclaimer_style)]],
        colWidths=[7.5 * inch]
    )
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fee2e2")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#ef4444")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(disclaimer_table)
    story.append(Spacer(1, 10))

    # 2. Synthetic Laboratory Header
    story.append(Paragraph("HEALTHLENS CLINICAL REFERENCE LABORATORY (SYNTHETIC LAB)", lab_name_style))
    story.append(Paragraph("Division of Synthetic Health Informatics • Certified Clinical Diagnostic Reference Engine • Demo License #HL-DEMO-2026", lab_sub_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    # 3. Patient Information Box
    p = report_info["patient"]
    patient_table_data = [
        [
            Paragraph("Patient Name:", meta_label_style),
            Paragraph(f"<b>{p['name']}</b>", meta_val_style),
            Paragraph("Sample ID / Barcode:", meta_label_style),
            Paragraph(report_info["sample_id"], meta_val_style),
        ],
        [
            Paragraph("Age / Gender:", meta_label_style),
            Paragraph(p["age_gender"], meta_val_style),
            Paragraph("Referred By:", meta_label_style),
            Paragraph(p["referred_by"], meta_val_style),
        ],
        [
            Paragraph("Collection Date:", meta_label_style),
            Paragraph(p["collection_time"], meta_val_style),
            Paragraph("Reported Date:", meta_label_style),
            Paragraph(p["reported_time"], meta_val_style),
        ],
    ]
    patient_table = Table(patient_table_data, colWidths=[1.3 * inch, 2.4 * inch, 1.4 * inch, 2.4 * inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 10))

    # 4. Department & Test Section Title
    story.append(Paragraph(f"DEPARTMENT: {report_info['category'].upper()}", lab_sub_style))
    story.append(Paragraph(report_info["title"], report_title_style))

    # 5. Biomarkers Table
    table_rows = [
        [
            Paragraph("Biomarker / Investigation", tbl_head_style),
            Paragraph("Observed Value", tbl_head_style),
            Paragraph("Unit", tbl_head_style),
            Paragraph("Biological Ref Interval", tbl_head_style),
            Paragraph("Status", tbl_head_style),
            Paragraph("Methodology", tbl_head_style)
        ]
    ]

    for test in report_info["tests"]:
        name, val, unit, ref, status, method = test
        is_abnormal = status in ["LOW", "HIGH"]
        val_display = f"<b>{val}</b>" if not is_abnormal else f"<b>{val} *</b>"
        
        status_para = Paragraph(status, alert_style if is_abnormal else tbl_cell_style)
        val_para = Paragraph(val_display, alert_style if is_abnormal else tbl_bold_style)

        table_rows.append([
            Paragraph(name, tbl_bold_style),
            val_para,
            Paragraph(unit, tbl_cell_style),
            Paragraph(ref, tbl_cell_style),
            status_para,
            Paragraph(method, tbl_cell_style)
        ])

    test_table = Table(
        table_rows,
        colWidths=[2.2 * inch, 1.1 * inch, 0.8 * inch, 1.3 * inch, 0.8 * inch, 1.3 * inch]
    )
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(test_table)
    story.append(Spacer(1, 12))

    # 6. Clinical Pathologist Notes
    notes_data = [
        [Paragraph(f"<b>Clinical Notes:</b> {report_info['notes']}", tbl_cell_style)],
        [Paragraph("<i>* Indicates biomarker result falls outside normal physiological adult reference ranges.</i>", tbl_cell_style)]
    ]
    notes_table = Table(notes_data, colWidths=[7.5 * inch])
    notes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(notes_table)
    story.append(Spacer(1, 16))

    # 7. Synthetic Signature & Footer Disclaimers
    footer_data = [
        [
            Paragraph("Verified By:<br/><b>Dr. Arvind Kulkarni, MD</b><br/>Consultant Pathologist (Synthetic Simulation)", tbl_cell_style),
            Paragraph("Authorized Signature:<br/><i>[Digitally Verified — Synthetic Record]</i><br/>HealthLens AI Diagnostic Demo", tbl_cell_style)
        ]
    ]
    footer_table = Table(footer_data, colWidths=[3.75 * inch, 3.75 * inch])
    footer_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor("#94a3b8")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(footer_table)
    story.append(Spacer(1, 10))

    # Final Bottom Banner
    final_banner = Table(
        [[Paragraph("DEMO / SYNTHETIC DATA — NOT A REAL MEDICAL REPORT — FOR EDUCATIONAL DEMO PURPOSES ONLY", disclaimer_style)]],
        colWidths=[7.5 * inch]
    )
    final_banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(final_banner)

    doc.build(story)
    print(f"Generated synthetic report: {output_path}")

def main():
    print("Generating 3 synthetic clinical laboratory demo reports...")
    for rep in REPORTS_DATA:
        # Save into frontend public dir
        frontend_path = os.path.join(FRONTEND_DEMO_DIR, rep["filename"])
        build_pdf(rep, frontend_path)
        
        # Save into root sample_reports dir
        root_path = os.path.join(ROOT_SAMPLE_DIR, rep["filename"])
        shutil.copy2(frontend_path, root_path)
        print(f"  Copied to: {root_path}")

    print("\nAll 3 synthetic clinical reports generated successfully!")

if __name__ == "__main__":
    main()
