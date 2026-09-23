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
import time
import concurrent.futures
import logging
import shutil
from typing import Optional

from PIL import Image
import pytesseract

from app.core.config import settings

logger = logging.getLogger("healthlens.ocr")

# ---------------------------------------------------------------------------
# Temp directory
# ---------------------------------------------------------------------------
TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Minimum characters from native PDF extraction to consider it sufficient
# and skip OCR entirely. Increase if very short PDFs are incorrectly OCR'd.
MIN_NATIVE_TEXT_CHARS = 50

# ---------------------------------------------------------------------------
# Lazy Supabase client — initialized ONCE on first use, NOT at import time.
# Avoids an 8+ second network initialization penalty every time this module
# is imported by the FastAPI worker process.
# ---------------------------------------------------------------------------
_supabase_client = None

def _get_supabase():
    """Returns the module-level Supabase client, creating it lazily on first call."""
    global _supabase_client
    if _supabase_client is None:
        t0 = time.perf_counter()
        from supabase import create_client
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info(f"[TIMING] Supabase client init (lazy): {(time.perf_counter() - t0) * 1000:.0f} ms")
    return _supabase_client

# Keep this alias so reports.py import `from app.services.ocr import supabase` still works.
# It returns the lazy singleton on first access.
class _SupabaseLazyProxy:
    """Thin proxy so `supabase.storage...` calls work without eager initialization."""
    def __getattr__(self, item):
        return getattr(_get_supabase(), item)

supabase = _SupabaseLazyProxy()


# ---------------------------------------------------------------------------
# Tesseract configuration — environment-aware, never hardcoded
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

def download_storage_file(file_path: str, timeout_seconds: float = 15.0) -> str:
    """
    Downloads the report file from Supabase Storage to a local temp file.

    Features:
      - Strict timeout ({timeout_seconds}s) to prevent hanging indefinitely.
      - Dual route: fast authenticated HTTP request with service role key,
        falling back to the Supabase client with a ThreadPoolExecutor timeout guard.
      - Returns a clear exception on failure and cleans up any partial files.
    """
    t0 = time.perf_counter()
    file_name = os.path.basename(file_path)
    local_path = os.path.join(TEMP_DIR, file_name)
    response_bytes: Optional[bytes] = None
    last_err: Optional[str] = None

    # Route 1: Fast direct HTTP download to Supabase Storage with strict timeout
    try:
        import httpx
        base_url = settings.SUPABASE_URL.rstrip("/")
        clean_path = file_path.lstrip("/")
        url = f"{base_url}/storage/v1/object/authenticated/reports/{clean_path}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY
        }
        with httpx.Client(timeout=httpx.Timeout(timeout_seconds, connect=5.0)) as http_client:
            resp = http_client.get(url, headers=headers)
            if resp.status_code == 200:
                response_bytes = resp.content
            else:
                last_err = f"Storage HTTP {resp.status_code}: {resp.text[:150]}"
    except Exception as http_e:
        last_err = str(http_e)

    # Route 2: Fallback to Supabase SDK client with ThreadPoolExecutor timeout guard
    if response_bytes is None:
        try:
            client = _get_supabase()
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(client.storage.from_("reports").download, file_path)
                response_bytes = future.result(timeout=timeout_seconds)
        except concurrent.futures.TimeoutError:
            if os.path.exists(local_path):
                os.remove(local_path)
            raise TimeoutError(
                f"Storage download timed out after {timeout_seconds}s for '{file_path}'. "
                "Supabase Storage was unresponsive."
            )
        except Exception as sdk_e:
            if os.path.exists(local_path):
                os.remove(local_path)
            raise RuntimeError(
                f"Failed to download report from Supabase Storage: {last_err or sdk_e}"
            ) from sdk_e

    try:
        with open(local_path, "wb") as f:
            f.write(response_bytes)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            f"[HealthLens Timing] Storage download: {elapsed_ms:.0f} ms — "
            f"'{file_path}' ({len(response_bytes)} bytes)"
        )
        return local_path
    except Exception as write_err:
        if os.path.exists(local_path):
            os.remove(local_path)
        raise RuntimeError(f"Failed to write downloaded report to disk: {write_err}")


def validate_file_signature(file_path: str) -> bool:
    t0 = time.perf_counter()
    try:
        with open(file_path, "rb") as f:
            header = f.read(8)
        result = (
            header.startswith(b"%PDF")
            or header.startswith(b"\x89PNG\r\n\x1a\n")
            or header.startswith(b"\xff\xd8\xff")
        )
        logger.info(f"[HealthLens Timing] File type detection: {(time.perf_counter()-t0)*1000:.0f} ms — valid={result}")
        return result
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Image pre-processing + Tesseract OCR
# ---------------------------------------------------------------------------

def _preprocess_image(img: Image.Image) -> Image.Image:
    """Apply fast, high-accuracy clinical-document pre-processing for OCR."""
    from PIL import ImageOps
    img = img.convert("L")

    width, height = img.size
    # Optimize dimensions: maintain crisp resolution without excessive CPU overhead
    if width < 1000:
        factor = 1400.0 / width
        img = img.resize((int(width * factor), int(height * factor)), Image.Resampling.BILINEAR)
    elif width > 2400:
        factor = 2000.0 / width
        img = img.resize((int(width * factor), int(height * factor)), Image.Resampling.BILINEAR)

    # Fast autocontrast for crisp text edges
    img = ImageOps.autocontrast(img, cutoff=1)
    return img


def _correct_orientation(img: Image.Image) -> Image.Image:
    """Fast orientation detection using a small thumbnail to prevent lag."""
    try:
        width, height = img.size
        max_dim = max(width, height)
        scale = 600.0 / max_dim
        thumb = img.resize((int(width * scale), int(height * scale)), Image.Resampling.BILINEAR)
        
        osd = pytesseract.image_to_osd(thumb)
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
    """Extract text from a single image file using optimized Tesseract OCR."""
    if not TESSERACT_AVAILABLE:
        raise RuntimeError(
            "Tesseract OCR is not installed or not found on this system.\n"
            "Windows (local dev): winget install UB-Mannheim.TesseractOCR\n"
            "  then set TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe in .env\n"
            "Linux / Docker: apt-get install -y tesseract-ocr tesseract-ocr-eng\n"
            "Native digital PDFs still work without Tesseract."
        )
    t0 = time.perf_counter()
    try:
        img = Image.open(image_path)
        img = _correct_orientation(img)
        img = _preprocess_image(img)
        custom_config = r"--oem 3 --psm 4"
        text = pytesseract.image_to_string(img, config=custom_config)
        logger.info(
            f"[HealthLens Timing] OCR: {(time.perf_counter()-t0)*1000:.0f} ms — "
            f"{len(text)} chars from '{os.path.basename(image_path)}'"
        )
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

    Stage 1 — Native digital extraction (pypdf)
        Instant for text-based PDFs. Returns immediately if >= MIN_NATIVE_TEXT_CHARS found.
        OCR is NOT triggered for normal digital PDFs.

    Stage 2 — Scanned PDF fallback (pdf2image + Tesseract OCR)
        Only activated when Stage 1 produces insufficient text.
        Requires Tesseract + Poppler. Each page has a per-page timeout.
    """
    # -------------------------------------------------------------------------
    # Stage 1: Native PDF text extraction via pypdf
    # Fast path — no external dependencies, no image conversion, no OCR.
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    native_text = ""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                native_text += page_text + "\n"

        native_elapsed_ms = (time.perf_counter() - t0) * 1000

        if len(native_text.strip()) >= MIN_NATIVE_TEXT_CHARS:
            logger.info(
                f"[HealthLens Timing] Native PDF extraction: {native_elapsed_ms:.0f} ms — "
                f"{len(reader.pages)} page(s), {len(native_text.strip())} chars. "
                f"OCR skipped (native text sufficient)."
            )
            return native_text
        else:
            logger.info(
                f"[HealthLens Timing] Native PDF extraction: {native_elapsed_ms:.0f} ms — "
                f"only {len(native_text.strip())} chars (< {MIN_NATIVE_TEXT_CHARS}). "
                f"Falling back to OCR."
            )
    except Exception as pdf_err:
        native_elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.warning(
            f"[HealthLens Timing] pypdf extraction failed in {native_elapsed_ms:.0f} ms: "
            f"{pdf_err}. Falling back to OCR."
        )

    # -------------------------------------------------------------------------
    # Stage 2: Scanned PDF fallback — pdf2image + Tesseract OCR
    # Only reached when native extraction yields insufficient text.
    # -------------------------------------------------------------------------
    if not TESSERACT_AVAILABLE:
        raise RuntimeError(
            "This PDF appears to be scanned (image-based) and contains no selectable text. "
            "Tesseract OCR is required to process scanned PDFs but is not installed.\n"
            "Windows: winget install UB-Mannheim.TesseractOCR then set TESSERACT_CMD in .env\n"
            "Linux / Docker: apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils\n"
            "Alternatively, upload the native digital version of this report."
        )

    # -------------------------------------------------------------------------
    # Stage 2A: Direct embedded image extraction via pypdf (NO Poppler required!)
    # Works on all platforms (Windows, Linux, Docker). Extracts scanned images
    # directly from the PDF pages and OCRs them without needing pdftoppm.
    # -------------------------------------------------------------------------
    t_ocr_start = time.perf_counter()
    try:
        embedded_ocr_texts = []
        if "reader" in locals():
            for page_idx, page in enumerate(reader.pages):
                if hasattr(page, "images") and page.images:
                    for img_idx, img_obj in enumerate(page.images):
                        temp_embed_path = os.path.join(
                            TEMP_DIR, f"embed_{page_idx}_{img_idx}_{os.path.basename(pdf_path)}.png"
                        )
                        try:
                            with open(temp_embed_path, "wb") as f_img:
                                f_img.write(img_obj.data)
                            extracted_slice = extract_text_from_image(temp_embed_path)
                            if extracted_slice and extracted_slice.strip():
                                embedded_ocr_texts.append(extracted_slice.strip())
                        finally:
                            if os.path.exists(temp_embed_path):
                                os.remove(temp_embed_path)

        if embedded_ocr_texts:
            combined_ocr = "\n\n--- Page Break ---\n\n".join(embedded_ocr_texts)
            ocr_elapsed_ms = (time.perf_counter() - t_ocr_start) * 1000
            logger.info(
                f"[HealthLens Timing] OCR (embedded images via pypdf): {ocr_elapsed_ms:.0f} ms — "
                f"{len(combined_ocr)} chars extracted without Poppler."
            )
            return combined_ocr
    except Exception as embed_err:
        logger.warning(f"Direct PDF image extraction failed: {embed_err}. Attempting raster fallback.")

    # -------------------------------------------------------------------------
    # Stage 2B: Full rasterisation fallback — pdf2image + Poppler
    # Only needed if PDF has non-bitmap vector scans without embedded images.
    # -------------------------------------------------------------------------
    logger.info(f"Converting scanned PDF to images for OCR: {os.path.basename(pdf_path)}")
    try:
        from pdf2image import convert_from_path
        poppler_path: Optional[str] = settings.POPPLER_PATH or None
        pages = convert_from_path(pdf_path, poppler_path=poppler_path)
        pdf_basename = os.path.basename(pdf_path)
        page_timeout = settings.OCR_PAGE_TIMEOUT
        logger.info(
            f"Rasterised {len(pages)} page(s). "
            f"Running parallel OCR with {page_timeout}s per-page timeout..."
        )

        tasks = [(i, page, pdf_basename) for i, page in enumerate(pages)]
        max_workers = min(4, max(1, len(pages)))
        page_results: list = [""] * len(tasks)

        # as_completed with timeout so a stuck page doesn't freeze the pipeline
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_idx = {executor.submit(_ocr_single_pdf_page, task): task[0] for task in tasks}
            try:
                for future in concurrent.futures.as_completed(future_to_idx, timeout=page_timeout * len(tasks)):
                    idx = future_to_idx[future]
                    try:
                        page_results[idx] = future.result(timeout=page_timeout)
                    except concurrent.futures.TimeoutError:
                        logger.warning(f"OCR timeout on page {idx} — skipping after {page_timeout}s")
                    except Exception as page_err:
                        logger.warning(f"OCR failed on page {idx}: {page_err} — skipping")
            except concurrent.futures.TimeoutError:
                logger.warning("Overall OCR timeout reached — using partial results")

        combined = "\n\n--- Page Break ---\n\n".join(r for r in page_results if r.strip())
        ocr_elapsed_ms = (time.perf_counter() - t_ocr_start) * 1000
        logger.info(
            f"[HealthLens Timing] OCR ({len(pages)} pages): {ocr_elapsed_ms:.0f} ms — "
            f"{len(combined)} chars extracted."
        )
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
      1. Download file from Supabase Storage (lazy Supabase client).
      2. Validate file signature (magic bytes).
      3. Route to correct extractor: native PDF text or OCR.
      4. Clean up temp file.

    The file is downloaded exactly ONCE and reused for all downstream processing.
    """
    t_pipeline_start = time.perf_counter()
    local_file: Optional[str] = None
    try:
        # Step 1: Download from Supabase (lazy client init on first call)
        local_file = download_storage_file(file_path)

        # Step 2: Validate magic bytes
        if not validate_file_signature(local_file):
            logger.error(f"Security validation failed for: {file_path}")
            raise ValueError(
                "File security check failed: unsupported file type or corrupt file header. "
                "Only PDF, PNG, and JPEG/JPG files are accepted."
            )

        # Step 3: Route to correct extractor
        mime_lower = mime_type.lower()
        is_pdf = "pdf" in mime_lower or local_file.lower().endswith(".pdf")
        is_image = (
            any(t in mime_lower for t in ("image/png", "image/jpeg", "image/jpg"))
            or any(local_file.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg"))
        )

        if is_pdf:
            result = extract_text_from_pdf(local_file)
        elif is_image:
            result = extract_text_from_image(local_file)
        else:
            raise ValueError(
                f"Unsupported file type '{mime_type}'. "
                "HealthLens accepts PDF, PNG, and JPEG/JPG files."
            )

        total_ms = (time.perf_counter() - t_pipeline_start) * 1000
        logger.info(f"[HealthLens Timing] Total extraction pipeline: {total_ms:.0f} ms")
        return result

    finally:
        if local_file and os.path.exists(local_file):
            os.remove(local_file)
            logger.debug(f"Cleaned up temp file: {local_file}")
