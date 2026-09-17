r"""
HealthLens AI - OCR Service
============================
Extraction pipeline for medical lab reports.

Extraction priority:
  1. Native digital PDF text  ->  pypdf  (zero dependencies, best quality)
  2. Scanned PDF / image file ->  Tesseract OCR  (requires system binary)

Tesseract configuration
-----------------------
Set TESSERACT_CMD in your .env to the absolute path of the tesseract executable.

  Windows (local dev):
      TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

  Linux / Docker (production):
      TESSERACT_CMD=/usr/bin/tesseract
      (or leave blank - pytesseract finds it automatically via PATH)

Poppler configuration (PDF -> image rasterisation for scanned PDFs)
---------------------------------------------------------------------
  Windows (local dev):
      POPPLER_PATH=C:\path\to\poppler\bin
      (download from https://github.com/oschwartz10612/poppler-windows/releases)

  Linux / Docker (production):
      Leave blank - pdf2image finds poppler-utils automatically.
"""

import os
import concurrent.futures
import logging
import shutil
from typing import Optional

from PIL import Image, ImageFilter
import numpy as np
import pytesseract
from pdf2image import convert_from_path
from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger("healthlens.ocr")

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# ---------------------------------------------------------------------------
# Temp directory
# ---------------------------------------------------------------------------
TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Tesseract configuration - environment-aware, never hardcoded
# ---------------------------------------------------------------------------

def _configure_tesseract() -> bool:
    """
    Configure the pytesseract executable path from the environment.

    Priority:
      1. TESSERACT_CMD env variable (explicit path, any OS)
      2. System PATH lookup (works on Linux/Docker automatically)
      3. Common Windows installation paths (fallback for local dev)

    Returns True if a working Tesseract was found, False otherwise.
    """
    # 1. Explicit path from environment
    if settings.TESSERACT_CMD:
        if os.path.isfile(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            logger.info(f"Tesseract configured from TESSERACT_CMD: {settings.TESSERACT_CMD}")
            return True
        else:
            logger.warning(
                f"TESSERACT_CMD is set to '{settings.TESSERACT_CMD}' but the file does not exist. "
                "Falling back to PATH lookup."
            )

    # 2. Check if tesseract is on the system PATH
    tesseract_on_path = shutil.which("tesseract")
    if tesseract_on_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_on_path
        logger.info(f"Tesseract found on PATH: {tesseract_on_path}")
        return True

    # 3. Well-known Windows installation locations (local dev fallback)
    windows_candidates = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Tesseract-OCR", "tesseract.exe"),
        os.path.join(os.environ.get("APPDATA", ""), "Tesseract-OCR", "tesseract.exe"),
    ]
    for candidate in windows_candidates:
        if candidate and os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            logger.info(f"Tesseract found at well-known Windows path: {candidate}")
            return True

    logger.warning(
        "Tesseract OCR binary not found. "
        "Scanned PDFs and image uploads will not be processed. "
        "Native digital PDFs will continue to work. "
        "To enable OCR: install Tesseract and set TESSERACT_CMD in your .env file."
    )
    return False


TESSERACT_AVAILABLE: bool = _configure_tesseract()


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------

def download_storage_file(file_path: str) -> str:
    file_name = os.path.basename(file_path)
    local_path = os.path.join(TEMP_DIR, file_name)
    try:
        response = supabase.storage.from_("reports").download(file_path)
        with open(local_path, "wb") as f:
            f.write(response)
        logger.debug(f"Downloaded '{file_path}' to '{local_path}' ({len(response)} bytes)")
        return local_path
    except Exception as e:
        if os.path.exists(local_path):
            os.remove(local_path)
        raise RuntimeError(f"Failed to download report from Supabase Storage: {e}") from e


def validate_file_signature(file_path: str) -> bool:
    try:
        with open(file_path, "rb") as f:
            header = f.read(8)
        return (
            header.startswith(b"%PDF")
            or header.startswith(b"\x89PNG\r\n\x1a\n")
            or header.startswith(b"\xff\xd8\xff")
        )
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Image pre-processing + Tesseract OCR
# ---------------------------------------------------------------------------

def _preprocess_image(img: Image.Image) -> Image.Image:
    """Apply clinical-document pre-processing for better OCR accuracy."""
    img = img.convert("L")

    width, height = img.size
    min_side = min(width, height)
    if min_side < 2000:
        factor = max(2, int(2000 / min_side))
        img = img.resize((width * factor, height * factor), Image.Resampling.LANCZOS)

    blur_radius = 31
    img_blur = img.filter(ImageFilter.GaussianBlur(blur_radius))
    arr_orig = np.array(img, dtype=np.float32)
    arr_blur = np.array(img_blur, dtype=np.float32)
    binary_arr = np.where(arr_orig < (arr_blur - 12.0), 0, 255).astype(np.uint8)
    img = Image.fromarray(binary_arr)

    img = img.filter(ImageFilter.MedianFilter(size=3))
    img = img.filter(ImageFilter.SHARPEN)
    return img


def _correct_orientation(img: Image.Image) -> Image.Image:
    """Use Tesseract OSD to detect and correct image rotation."""
    try:
        osd = pytesseract.image_to_osd(img)
        rotation = 0
        for line in osd.split("\n"):
            if "Rotate:" in line:
                rotation = int(line.split(":")[-1].strip())
                break
        if rotation in (90, 180, 270):
            logger.info(f"Correcting image rotation by {rotation} degrees")
            img = img.rotate(360 - rotation, expand=True)
    except Exception as osd_err:
        logger.debug(f"OSD skipped: {osd_err}")
    return img


def extract_text_from_image(image_path: str) -> str:
    """Extract text from a single image file using Tesseract OCR."""
    if not TESSERACT_AVAILABLE:
        raise RuntimeError(
            "Tesseract OCR is not installed or not found on this system.\n"
            "Windows (local dev): winget install UB-Mannheim.TesseractOCR\n"
            "  then set TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe in .env\n"
            "Linux / Docker: apt-get install -y tesseract-ocr tesseract-ocr-eng\n"
            "Native digital PDFs still work without Tesseract."
        )
    try:
        img = Image.open(image_path)
        img = _correct_orientation(img)
        img = _preprocess_image(img)
        custom_config = r"--oem 3 --psm 3"
        text = pytesseract.image_to_string(img, config=custom_config)
        logger.debug(f"OCR extracted {len(text)} characters from '{image_path}'")
        return text
    except RuntimeError:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if any(kw in err_str for kw in ("tesseract is not installed", "not found", "winerror 2", "no such file")):
            raise RuntimeError(
                "Tesseract OCR binary could not be executed. "
                "Verify your TESSERACT_CMD path in .env points to a valid tesseract executable."
            ) from e
        raise RuntimeError(f"Tesseract OCR failed on '{image_path}': {e}") from e


# ---------------------------------------------------------------------------
# PDF extraction
# ---------------------------------------------------------------------------

def _ocr_single_pdf_page(page_data: tuple) -> str:
    """Worker: OCR one rasterised PDF page. Used by ThreadPoolExecutor."""
    i, page, pdf_basename = page_data
    page_img_path = os.path.join(TEMP_DIR, f"page_{i}_{pdf_basename}.png")
    page.save(page_img_path, "PNG")
    try:
        return extract_text_from_image(page_img_path)
    finally:
        if os.path.exists(page_img_path):
            os.remove(page_img_path)


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF using a two-stage pipeline:

    Stage 1 - Native digital extraction (pypdf)
        No external dependencies. Used when PDF has embedded text (>50 chars).

    Stage 2 - Scanned PDF fallback (pdf2image + Tesseract OCR)
        Activated when Stage 1 produces insufficient text.
        Requires: Tesseract OCR binary + Poppler.
    """
    # Stage 1: native digital PDF
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        if len(text.strip()) > 50:
            logger.info(
                f"Native digital PDF extraction succeeded: "
                f"{len(reader.pages)} page(s), {len(text.strip())} chars."
            )
            return text
        else:
            logger.info(
                f"Native PDF produced insufficient text ({len(text.strip())} chars). Falling back to OCR."
            )
    except Exception as pdf_err:
        logger.warning(f"pypdf extraction failed: {pdf_err}. Falling back to OCR.")

    # Stage 2: scanned PDF
    if not TESSERACT_AVAILABLE:
        raise RuntimeError(
            "This PDF appears to be scanned (image-based) and contains no selectable text. "
            "Tesseract OCR is required to process scanned PDFs but is not installed.\n"
            "Windows: winget install UB-Mannheim.TesseractOCR then set TESSERACT_CMD in .env\n"
            "Linux / Docker: apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils\n"
            "Alternatively, upload the native digital version of this report."
        )

    logger.info(f"Converting scanned PDF to images for OCR: {os.path.basename(pdf_path)}")
    try:
        poppler_path: Optional[str] = getattr(settings, "POPPLER_PATH", None) or os.getenv("POPPLER_PATH") or None
        pages = convert_from_path(pdf_path, poppler_path=poppler_path or None)
        pdf_basename = os.path.basename(pdf_path)
        logger.info(f"Rasterised {len(pages)} page(s). Running parallel OCR...")

        tasks = [(i, page, pdf_basename) for i, page in enumerate(pages)]
        max_workers = min(4, max(1, len(pages)))

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(_ocr_single_pdf_page, tasks))

        combined = "\n\n--- Page Break ---\n\n".join(results)
        logger.info(f"Scanned PDF OCR completed: {len(combined)} chars extracted.")
        return combined
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(
            f"Failed to extract text from scanned PDF via OCR. "
            f"Ensure Poppler is installed (pdf2image dependency). Error: {e}"
        ) from e


# ---------------------------------------------------------------------------
# Public pipeline entry-point
# ---------------------------------------------------------------------------

def run_ocr_pipeline(file_path: str, mime_type: str) -> str:
    """
    Full extraction pipeline:
      1. Download file from Supabase Storage.
      2. Validate file signature (magic bytes).
      3. Route to the correct extractor based on MIME type.
      4. Clean up temp file.
    """
    local_file: Optional[str] = None
    try:
        local_file = download_storage_file(file_path)

        if not validate_file_signature(local_file):
            logger.error(f"Security validation failed for: {file_path}")
            raise ValueError(
                "File security check failed: unsupported file type or corrupt file header. "
                "Only PDF, PNG, and JPEG/JPG files are accepted."
            )

        mime_lower = mime_type.lower()
        is_pdf = "pdf" in mime_lower or local_file.lower().endswith(".pdf")
        is_image = (
            any(t in mime_lower for t in ("image/png", "image/jpeg", "image/jpg"))
            or any(local_file.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg"))
        )

        if is_pdf:
            return extract_text_from_pdf(local_file)
        elif is_image:
            return extract_text_from_image(local_file)
        else:
            raise ValueError(
                f"Unsupported file type '{mime_type}'. "
                "HealthLens accepts PDF, PNG, and JPEG/JPG files."
            )
    finally:
        if local_file and os.path.exists(local_file):
            os.remove(local_file)
            logger.debug(f"Cleaned up temp file: {local_file}")
