import re
import logging
from typing import List, Dict, Any, Optional

try:
    from sentence_transformers import SentenceTransformer
    _has_sentence_transformers = True
except ImportError:
    SentenceTransformer = None
    _has_sentence_transformers = False

from app.core.db import get_db_cursor

logger = logging.getLogger("healthlens.rag")

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_embedding_model: Optional["SentenceTransformer"] = None
_model_load_attempted = False


def ensure_embedding_model() -> Optional["SentenceTransformer"]:
    """
    Lazily loads the sentence-transformers embedding model.
    Keeps API startup healthy even when model download is unavailable.
    """
    global _embedding_model, _model_load_attempted

    if _embedding_model is not None:
        return _embedding_model

    if _model_load_attempted:
        return None

    _model_load_attempted = True

    if not _has_sentence_transformers:
        logger.warning("sentence-transformers not installed; RAG vector features will be skipped.")
        return None

    try:
        logger.info("Initializing SentenceTransformer embedding model: %s", MODEL_NAME)
        _embedding_model = SentenceTransformer(MODEL_NAME)
        logger.info("Embedding model initialized successfully.")
        return _embedding_model
    except Exception as exc:
        logger.warning("Embedding model unavailable; RAG vector features will be skipped: %s", exc)
        _embedding_model = None
        return None


def get_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional vector embedding for the input text.
    """
    try:
        model = ensure_embedding_model()
        if model is None:
            raise RuntimeError("Embedding model is unavailable in the current environment.")

        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Failed to generate embedding: {str(e)}")
        raise RuntimeError(f"Embedding generation failed: {str(e)}")


def split_text_into_chunks(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Splits raw report text into overlapping text chunks.
    """
    if not text:
        return []
        
    words = text.split()
    chunks = []
    
    # Standard sliding window over words
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
        
    return chunks

def save_report_chunks(report_id: str, user_id: str, raw_text: str):
    """
    Splits text, embeds each chunk, and saves it in public.report_chunks.
    """
    chunks = split_text_into_chunks(raw_text)
    if not chunks:
        return
        
    logger.info(f"Chunked report {report_id} into {len(chunks)} pieces. Generating embeddings...")
    
    try:
        with get_db_cursor(commit=True) as cur:
            for idx, chunk in enumerate(chunks):
                embedding = get_embedding(chunk)
                cur.execute(
                    """
                    INSERT INTO public.report_chunks (report_id, user_id, content, embedding, chunk_index)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (report_id, user_id, chunk, embedding, idx)
                )
    except Exception as e:
        logger.warning(f"Failed to save report chunks (vector search will be limited): {str(e)}")

def similarity_search_reports(query: str, user_id: str, limit: int = 4) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity search using pgvector on report chunks.
    Falls back to ILIKE keyword search when embeddings are unavailable.
    """
    try:
        model = ensure_embedding_model()
        if model is not None:
            query_vector = get_embedding(query)
            with get_db_cursor() as cur:
                cur.execute(
                    """
                    SELECT content, report_id, 1 - (embedding <=> %s::vector) AS similarity
                    FROM public.report_chunks
                    WHERE user_id = %s AND embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector ASC
                    LIMIT %s
                    """,
                    (query_vector, user_id, query_vector, limit)
                )
                results = cur.fetchall()
            return results
        else:
            # Keyword fallback
            keywords = [w for w in query.lower().split() if len(w) > 3]
            if not keywords:
                return []
            pattern = "%" + keywords[0] + "%"
            with get_db_cursor() as cur:
                cur.execute(
                    """
                    SELECT content, report_id, 0.5 AS similarity
                    FROM public.report_chunks
                    WHERE user_id = %s AND LOWER(content) LIKE %s
                    LIMIT %s
                    """,
                    (user_id, pattern, limit)
                )
                return cur.fetchall()
    except Exception as e:
        logger.error(f"Report chunks similarity search failed: {str(e)}")
        return []


# In-memory knowledge base - used when DB not yet seeded or embeddings unavailable
_BUILTIN_KNOWLEDGE = [
    {"biomarker_name": "LDL", "topic": "Understanding Low-Density Lipoprotein (LDL) Cholesterol",
     "content": "LDL is known as 'bad' cholesterol because high levels can build up in walls of arteries, forming plaque (atherosclerosis) and increasing risk of heart disease and stroke. Normal ranges are typically under 100 mg/dL. High LDL can be caused by saturated fat diets, lack of physical activity, smoking, or genetics. Improvements are achieved through aerobic exercise, eating soluble fiber, and reducing saturated fats."},
    {"biomarker_name": "HDL", "topic": "Understanding High-Density Lipoprotein (HDL) Cholesterol",
     "content": "HDL is known as 'good' cholesterol. It helps remove other forms of cholesterol from the bloodstream. Higher HDL levels are associated with lower risk of heart disease. Normal ranges are above 60 mg/dL for optimal protection. Low HDL can be caused by smoking, obesity, and inactivity."},
    {"biomarker_name": "Vitamin D", "topic": "Understanding Vitamin D Deficiencies and Health Impacts",
     "content": "Vitamin D is essential for bone health, absorbing calcium, and supporting immune system functions. Normal values range between 30 and 100 ng/mL. Levels below 30 ng/mL indicate insufficiency, and below 20 ng/mL indicate deficiency. Common causes include inadequate sunlight exposure, dark skin pigmentation, obesity, or malabsorption. Symptoms include fatigue and bone pain. Mitigations include supplementation and direct sunlight."},
    {"biomarker_name": "Hemoglobin", "topic": "Understanding Hemoglobin and Anemia Risks",
     "content": "Hemoglobin is the iron-containing protein in red blood cells that carries oxygen from your lungs to the rest of the body. Normal ranges are 13.8 to 17.2 g/dL for men and 12.1 to 15.1 g/dL for women. Low hemoglobin indicates anemia, causing fatigue, dizziness, and shortness of breath. Iron deficiency is the most common cause. High levels may indicate dehydration or erythrocytosis."},
    {"biomarker_name": "TSH", "topic": "Thyroid Stimulating Hormone (TSH) and Metabolism",
     "content": "TSH is produced by the pituitary gland to control thyroid hormone levels in blood. The standard normal range is 0.4 to 4.0 uIU/mL. High TSH indicates hypothyroidism (underactive thyroid), where the body metabolism slows down, causing weight gain and fatigue. Low TSH indicates hyperthyroidism (overactive thyroid), causing anxiety, weight loss, and rapid heart rate."},
    {"biomarker_name": "HbA1c", "topic": "HbA1c and Long-term Blood Glucose Monitoring",
     "content": "HbA1c (Glycated Hemoglobin) reflects average blood sugar levels over the past 2 to 3 months. Normal levels are below 5.7%. A range of 5.7% to 6.4% indicates prediabetes, and 6.5% or higher indicates diabetes. Lowering HbA1c is managed via low glycemic index diets, regular cardiovascular exercise, weight loss, and medication as prescribed."},
    {"biomarker_name": "Creatinine", "topic": "Creatinine and Kidney Filtration Health",
     "content": "Creatinine is a waste product from muscle breakdown, filtered out of blood by kidneys. Normal ranges are 0.6 to 1.2 mg/dL. Elevated creatinine indicates kidneys are not filtering efficiently, potentially signaling acute kidney injury or chronic kidney disease. High levels can also be caused by dehydration, high muscle mass, or heavy protein diets."},
    {"biomarker_name": "Triglycerides", "topic": "Triglycerides and Cardiovascular Risk",
     "content": "Triglycerides are fats in the blood. Normal levels are below 150 mg/dL. Borderline high is 150-199 mg/dL, high is 200-499 mg/dL. High triglycerides can increase risk of heart disease and pancreatitis. Causes include obesity, poorly controlled diabetes, hypothyroidism, and high carbohydrate diet."},
    {"biomarker_name": "WBC", "topic": "White Blood Cell Count and Immune Health",
     "content": "WBC (White Blood Cells) are immune cells that fight infections. Normal range is 4,500 to 11,000 cells/mcL. High WBC (leukocytosis) can indicate infection, inflammation, or immune disorders. Low WBC (leukopenia) may indicate bone marrow issues or viral infections."},
    {"biomarker_name": "RBC", "topic": "Red Blood Cell Count and Oxygen Transport",
     "content": "RBC (Red Blood Cells) carry oxygen via hemoglobin. Normal range is 4.5-5.9 million cells/mcL for men and 4.1-5.1 million cells/mcL for women. Low RBC indicates anemia. High RBC can indicate polycythemia, often seen in dehydration or certain lung conditions."},
    {"biomarker_name": "Platelets", "topic": "Platelet Count and Blood Clotting",
     "content": "Platelets are tiny blood cells that help form clots to stop bleeding. Normal range is 150,000 to 400,000 per microliter. Low platelets (thrombocytopenia) increase bleeding risk. High platelets (thrombocytosis) can increase clotting risk."},
]


def similarity_search_knowledge(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity search using pgvector on the medical knowledge base.
    Falls back to in-memory keyword matching when embeddings are unavailable.
    """
    try:
        model = ensure_embedding_model()
        if model is not None:
            # Vector search path
            query_vector = get_embedding(query)
            with get_db_cursor() as cur:
                cur.execute(
                    """
                    SELECT biomarker_name, topic, content, 1 - (embedding <=> %s::vector) AS similarity
                    FROM public.medical_knowledge
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector ASC
                    LIMIT %s
                    """,
                    (query_vector, query_vector, limit)
                )
                results = cur.fetchall()
            if results:
                return results

        # Keyword fallback: search in-memory builtin knowledge by biomarker name match
        query_lower = query.lower()
        matched = []
        for entry in _BUILTIN_KNOWLEDGE:
            score = 0
            if entry["biomarker_name"].lower() in query_lower:
                score = 2
            elif any(word in query_lower for word in entry["biomarker_name"].lower().split()):
                score = 1
            elif query_lower in entry["content"].lower():
                score = 0.5
            if score > 0:
                matched.append({**entry, "similarity": score})

        matched.sort(key=lambda x: x["similarity"], reverse=True)
        return matched[:limit]

    except Exception as e:
        logger.error(f"Medical knowledge similarity search failed: {str(e)}")
        # Last resort: return in-memory entries
        query_lower = query.lower()
        return [e for e in _BUILTIN_KNOWLEDGE if e["biomarker_name"].lower() in query_lower][:limit]


def seed_medical_knowledge_if_empty():
    """
    Seeds the medical knowledge base if empty.
    Works with or without embeddings - seeds content first, adds embeddings if available.
    """
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM public.medical_knowledge")
            count = cur.fetchone()["count"]

        if count > 0:
            logger.info("Medical knowledge base already seeded (%d entries).", count)
            return

        logger.info("Seeding medical knowledge base with baseline biomarker reference insights...")
        embedding_model = ensure_embedding_model()

        with get_db_cursor(commit=True) as cur:
            for seed in _BUILTIN_KNOWLEDGE:
                embedding = None
                if embedding_model is not None:
                    try:
                        embedding = get_embedding(seed["content"])
                    except Exception:
                        embedding = None
                cur.execute(
                    """
                    INSERT INTO public.medical_knowledge (biomarker_name, topic, content, embedding)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (seed["biomarker_name"], seed["topic"], seed["content"], embedding)
                )
        logger.info("Successfully seeded medical knowledge base with %d entries.", len(_BUILTIN_KNOWLEDGE))
    except Exception as e:
        logger.error(f"Failed to seed medical knowledge database: {str(e)}")

