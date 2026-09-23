import re
import logging
import groq
import instructor
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger("healthlens.parser")

# Initialize the Instructor-wrapped Groq client
groq_client = groq.Groq(api_key=settings.GROQ_API_KEY)
client = instructor.from_groq(groq_client, mode=instructor.Mode.JSON)

class ExtractedBiomarker(BaseModel):
    name: str = Field(description="Normalized name of the biomarker (e.g. 'Hemoglobin', 'RBC', 'WBC', 'Platelets', 'LDL', 'HDL', 'Triglycerides', 'Vitamin D', 'TSH', 'Creatinine', 'HbA1c')")
    value: float = Field(description="Numerical value of the biomarker measurement")
    unit: str = Field(description="Measurement unit, normalized (e.g. 'mg/dL', 'g/dL', 'ng/mL', 'uIU/mL', '%')")
    reference_range: Optional[str] = Field(None, description="The normal reference range displayed on the sheet (e.g., '< 100', '30-100')")

class ExtractedReportData(BaseModel):
    patient_name: Optional[str] = Field(None, description="The name of the patient as written on the report. If not found or anonymous, leave as None.")
    biomarkers: List[ExtractedBiomarker] = Field(description="List of all extracted biomarkers from the report")
    summary: Optional[str] = Field(None, description="Optional brief summary")
    abnormal_findings: Optional[List[str]] = Field(default_factory=list, description="Optional abnormal findings")
    explanation: Optional[str] = Field(None, description="Optional explanation")

class GeneratedHealthReport(BaseModel):
    summary: str = Field(description="A clean, concise 2-3 sentence executive summary of the health report findings.")
    explanation: str = Field(description="The complete, personalized, structured health report formatted in Markdown, strictly containing sections 1 to 9 as requested.")

def evaluate_biomarker_status(value: float, ref_range: str) -> str:
    """
    Parses common reference range string formats and evaluates whether
    the value is 'normal', 'low', or 'high'.
    """
    if not ref_range:
        return "normal"
    
    # Clean up whitespace and symbols
    clean_range = ref_range.replace(" ", "").replace("—", "-").replace("–", "-").lower()
    
    try:
        # Case: <100 or <=100
        lt_match = re.match(r"^<=?([\d\.]+)$", clean_range)
        if lt_match:
            limit = float(lt_match.group(1))
            return "normal" if value <= limit else "high"
            
        # Case: >30 or >=30
        gt_match = re.match(r"^>=?([\d\.]+)$", clean_range)
        if gt_match:
            limit = float(gt_match.group(1))
            return "normal" if value >= limit else "low"
            
        # Case: 30-100 or 30to100
        range_match = re.match(r"^([\d\.]+)(?:-|to)([\d\.]+)$", clean_range)
        if range_match:
            low = float(range_match.group(1))
            high = float(range_match.group(2))
            if value < low:
                return "low"
            elif value > high:
                return "high"
            else:
                return "normal"
    except Exception as e:
        logger.warning(f"Failed to parse reference range '{ref_range}': {str(e)}")
        
    return "normal"

def normalize_biomarker_name(raw_name: str) -> str:
    """
    Maps various common lab synonyms to standardized biomarker keys.
    """
    name_lower = raw_name.lower().strip()
    
    mapping = {
        "hemoglobin": "Hemoglobin",
        "hgb": "Hemoglobin",
        "red blood cell": "RBC",
        "rbc": "RBC",
        "white blood cell": "WBC",
        "wbc": "WBC",
        "platelet": "Platelets",
        "plt": "Platelets",
        "ldl": "LDL",
        "ldl cholesterol": "LDL",
        "hdl": "HDL",
        "hdl cholesterol": "HDL",
        "triglyceride": "Triglycerides",
        "triglycerides": "Triglycerides",
        "vitamin d": "Vitamin D",
        "vit d": "Vitamin D",
        "25-hydroxyvitamin d": "Vitamin D",
        "tsh": "TSH",
        "thyroid stimulating hormone": "TSH",
        "creatinine": "Creatinine",
        "hba1c": "HbA1c",
        "hemoglobin a1c": "HbA1c",
        "a1c": "HbA1c"
    }
    
    for key, normalized in mapping.items():
        if key in name_lower:
            return normalized
            
    return raw_name.title()

def normalize_biomarker_unit_and_value(name: str, value: float, unit: str, ref_range: Optional[str] = None) -> tuple[float, str, Optional[str]]:
    """
    Standardizes biomarker units and converts values if necessary.
    Also updates reference range bounds dynamically if values are converted.
    
    Supported:
    - Cholesterol (LDL, HDL, Cholesterol): mmol/L -> mg/dL (factor 38.67)
    - Triglycerides: mmol/L -> mg/dL (factor 88.57)
    - Vitamin D: nmol/L -> ng/mL (factor 0.4)
    - HbA1c: mmol/mol -> % (formula: (value / 10.929) + 2.15)
    """
    if not unit:
        return value, unit, ref_range
        
    unit_clean = unit.strip().lower()
    name_clean = name.strip()
    
    new_value = value
    new_unit = unit
    new_ref_range = ref_range
    
    # Helper to parse and convert numerical reference range bounds
    def convert_range_bounds(range_str: Optional[str], factor: float, is_hba1c: bool = False) -> Optional[str]:
        if not range_str:
            return range_str
        try:
            # Helper to convert a single float string
            def conv(val_str: str) -> str:
                v = float(val_str)
                if is_hba1c:
                    res = (v / 10.929) + 2.15
                else:
                    res = v * factor
                return f"{res:.1f}" if res % 1 != 0 else f"{int(res)}"
            
            # Case <= or < or >= or >
            op_match = re.match(r"^([<>]=?)([\d\.]+)$", range_str.replace(" ", ""))
            if op_match:
                return f"{op_match.group(1)} {conv(op_match.group(2))}"
                
            # Case low-high
            range_match = re.match(r"^([\d\.]+)\s*(?:-|to)\s*([\d\.]+)$", range_str.replace(" ", "").lower())
            if range_match:
                return f"{conv(range_match.group(1))} - {conv(range_match.group(2))}"
        except Exception:
            pass
        return range_str

    # 1. LDL, HDL, Cholesterol from mmol/L -> mg/dL
    if name_clean in ["LDL", "HDL", "Cholesterol"] and "mmol" in unit_clean:
        new_value = value * 38.67
        new_unit = "mg/dL"
        new_ref_range = convert_range_bounds(ref_range, 38.67)
        
    # 2. Triglycerides from mmol/L -> mg/dL
    elif name_clean == "Triglycerides" and "mmol" in unit_clean:
        new_value = value * 88.57
        new_unit = "mg/dL"
        new_ref_range = convert_range_bounds(ref_range, 88.57)

    # 3. Vitamin D from nmol/L -> ng/mL
    elif name_clean == "Vitamin D" and "nmol" in unit_clean:
        new_value = value * 0.4
        new_unit = "ng/mL"
        new_ref_range = convert_range_bounds(ref_range, 0.4)

    # 4. HbA1c from mmol/mol -> %
    elif name_clean == "HbA1c" and "mmol/mol" in unit_clean:
        new_value = (value / 10.929) + 2.15
        new_unit = "%"
        new_ref_range = convert_range_bounds(ref_range, 1.0, is_hba1c=True)
        
    # 5. Clean up units display
    elif unit_clean == "miu/l":
        new_unit = "uIU/mL"
        
    return round(new_value, 2), new_unit, new_ref_range

def parse_report_text(raw_text: str) -> ExtractedReportData:
    """
    Sends the raw OCR text to Groq LLM using Instructor to obtain
    a structured Pydantic schema of extracted biomarkers.
    """
    prompt = f"""
    Analyze the following clinical lab report text.
    Extract the patient's name (if present) and all numerical biomarker measurements with units and reference ranges.
    
    Common biomarkers: Hemoglobin, RBC, WBC, Platelets, Total Cholesterol, LDL, HDL, Triglycerides, Vitamin D, TSH, HbA1c, Creatinine, Fasting Glucose, ALT, AST, Bilirubin, Uric Acid, etc.
    
    Report text:
    ---
    {raw_text}
    ---
    """

    try:
        # Fast structured extraction with Groq
        extracted_data = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            response_model=ExtractedReportData,
            messages=[
                {"role": "system", "content": "You are a fast, highly accurate clinical laboratory biomarker extraction parser. Extract patient name and biomarkers list directly into the schema."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        
        # Normalize names and validate status indicators/units
        for biomarker in extracted_data.biomarkers:
            biomarker.name = normalize_biomarker_name(biomarker.name)
            norm_val, norm_unit, norm_ref = normalize_biomarker_unit_and_value(
                biomarker.name, biomarker.value, biomarker.unit, biomarker.reference_range
            )
            biomarker.value = norm_val
            biomarker.unit = norm_unit
            biomarker.reference_range = norm_ref
            
        return extracted_data
    except Exception as e:
        logger.error(f"Structured LLM parsing failed: {str(e)}")
        raise RuntimeError(f"Failed to analyze report text with LLM: {str(e)}")

def generate_personalized_report(
    biomarkers: List[ExtractedBiomarker],
    user_profile: dict,
    historical_data: List[dict],
    medical_facts: List[dict]
) -> GeneratedHealthReport:
    """
    Calls Groq Llama with structured instructions to generate the final personalized health report
    incorporating patient profile, history trends, and retrieved medical facts.
    """
    # Format Biomarkers list
    biomarkers_str = ""
    for b in biomarkers:
        status = evaluate_biomarker_status(b.value, b.reference_range)
        biomarkers_str += f"- {b.name}: {b.value} {b.unit} (Status: {status.capitalize()}, Normal Range: {b.reference_range or 'N/A'})\n"
        
    # Format Profile
    profile_str = f"Name: {user_profile.get('first_name', 'Patient')}\n"
    if user_profile.get("age") is not None:
        profile_str += f"Age: {user_profile['age']} years old\n"
    if user_profile.get("gender"):
        profile_str += f"Biological Sex: {user_profile['gender']}\n"
    if user_profile.get("height"):
        profile_str += f"Height: {user_profile['height']}\n"
    if user_profile.get("blood_group"):
        profile_str += f"Blood Group: {user_profile['blood_group']}\n"
        
    # Format History
    history_str = "No previous history found.\n"
    if historical_data:
        history_str = ""
        # Group historical values by name
        grouped = {}
        for h in historical_data:
            name = h["name"]
            if name not in grouped:
                grouped[name] = []
            grouped[name].append(f"{h['recorded_at']}: {h['value']} {h['unit']}")
        for name, vals in grouped.items():
            history_str += f"- {name}:\n  " + "\n  ".join(vals) + "\n"
            
    # Format Medical Knowledge
    facts_str = "No specific reference facts retrieved.\n"
    if medical_facts:
        facts_str = ""
        for f in medical_facts:
            facts_str += f"- Topic: {f['topic']}: {f['content']}\n"

    # Assemble Prompt
    prompt = f"""
    You are the HealthLens AI Health Intelligence Engine. Your task is to generate a personalized, structured health report in Markdown.
    
    PATIENT PROFILE:
    {profile_str}
    
    CURRENT BIOMARKER VALUES:
    {biomarkers_str}
    
    HISTORICAL VALUES (PAST TRENDS):
    {history_str}
    
    RETRIEVED MEDICAL KNOWLEDGE (FACTS):
    {facts_str}
    
    INSTRUCTIONS FOR OUTPUT:
    Generate a structured report strictly containing the following 9 sections in markdown format. 
    Use the exact headers listed below.
    
    1. ## Executive Summary
       Provide a concise, supportive overview of the patient's general health indicators and mention which biomarkers are out of range. 
       Compare against historical reports if they exist.
       
    2. ## Key Findings
       List details for all abnormal or important biomarkers. For each, show:
       - Status (Normal, Low, High)
       - Current Value
       - Reference Range
       - A patient-friendly, clear, plain-English explanation of the biomarker and what it does.
       
    3. ## Health Trend Analysis
       Compare current values with historical records. If previous records exist, calculate the percentage change (e.g. "LDL has improved by 22%") and provide an assessment of progress. 
       If no previous reports exist, display exactly: "This is your first report. Future reports will be used to identify health trends."
       
    4. ## Areas Showing Improvement
       Highlight metrics that have normalized or improved compared to past results. Always use encouraging, positive progress language.
       
    5. ## Areas Requiring Attention
       Highlight metrics that remain abnormal or require attention. Use calm, supportive, educational language. Do NOT diagnose or create fear.
       
    6. ## Personalized Health Suggestions
       Generate practical, actionable lifestyle suggestions based on the current values, history, and retrieved knowledge facts.
       Include the patient's height and blood group (if provided in their profile) to personalize their metabolic, dietary, or cardiovascular advice.
       CRITICAL: Never prescribe medication or diagnose a disease. Always use safe, non-definitive language such as "may help", "is commonly recommended", "may be worth discussing with a healthcare professional".
       
    7. ## Questions To Discuss With Your Doctor
       Provide 3 to 5 clear, smart questions the user can discuss with their doctor during their next visit.
       
    8. ## Health Intelligence Summary
       Write a final, supportive, highly personalized paragraph synthesizing their health trajectory.
       
    9. ## Ask More Suggestions
       Generate 4-5 bulleted conversational prompt suggestions that the user can click to discuss with their chat assistant (e.g. "Why is my LDL high?", "Show all cholesterol trends").
       
    RULES:
    - Never diagnose diseases.
    - Never prescribe medication.
    - Never use fear-based language.
    - Keep tone supportive, clinical, and highly professional.
    - Do NOT include any intro or outro commentary outside the structured report.
    - CRITICAL: The report must include the exact text "This is educational information and not a medical diagnosis." as a footnote at the very end of section 8.
    """

    try:
        # Fast direct Markdown generation without JSON wrapper bottleneck
        raw_completion = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a world-class clinical laboratory AI that generates concise, beautifully structured patient health reports in clean Markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1800
        )
        
        report_markdown = raw_completion.choices[0].message.content or ""
        
        # Extract executive summary directly from section 1
        summary = "Processed laboratory biomarkers successfully."
        summary_match = re.search(r"(?:##\s*(?:1\.?\s*)?Executive Summary\s*\n+)(.*?)(?=\n+## |\Z)", report_markdown, re.DOTALL | re.IGNORECASE)
        if summary_match and len(summary_match.group(1).strip()) > 15:
            summary = summary_match.group(1).strip()
        else:
            # Fallback to first non-heading paragraph
            non_heading = [l.strip() for l in report_markdown.split("\n") if l.strip() and not l.startswith("#")]
            if non_heading:
                summary = non_heading[0]

        # Enforce exact phrasing for Section 3 (Health Trend Analysis) if no history exists
        if not historical_data and report_markdown:
            pattern = r"(##\s*(?:3\.?\s*)?Health Trend Analysis\s*\n+)(.*?)(?=\n+## |\Z)"
            replacement = r"\1This is your first report. Future reports will be used to identify health trends.\n\n"
            report_markdown = re.sub(pattern, replacement, report_markdown, flags=re.IGNORECASE | re.DOTALL)
            
        return GeneratedHealthReport(
            summary=summary,
            explanation=report_markdown
        )
    except Exception as e:
        logger.error(f"Personalized report generation failed: {str(e)}")
        # Fallback to direct mapping
        return GeneratedHealthReport(
            summary="Processed biomarkers successfully.",
            explanation="Failed to generate personalized layout: " + str(e)
        )
