import re
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import get_current_user
from app.core.db import get_db_cursor
from app.models.chat import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse
from app.services.rag import similarity_search_reports, similarity_search_knowledge
from app.services.parser import groq_client
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger("healthlens.chat")

# Common biomarkers to match keyword filters
BIOMARKER_KEYWORDS = [
    "LDL", "HDL", "Triglycerides", "Cholesterol", "Vitamin D", "Vit D", 
    "Hemoglobin", "TSH", "Creatinine", "HbA1c", "RBC", "WBC", "Platelets"
]

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_data: ChatSessionCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Creates a new chat session.
    """
    try:
        title = session_data.title or "New Chat"
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO public.chat_sessions (user_id, title)
                VALUES (%s, %s)
                RETURNING id, user_id, title, created_at, updated_at
                """,
                (user_id, title)
            )
            session = cur.fetchone()
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}"
        )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_chat_sessions(user_id: str = Depends(get_current_user)):
    """
    Lists all chat sessions for the user, sorted by update date.
    """
    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, title, created_at, updated_at
                FROM public.chat_sessions
                WHERE user_id = %s
                ORDER BY updated_at DESC
                """,
                (user_id,)
            )
            sessions = cur.fetchall()
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list chat sessions: {str(e)}"
        )

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    session_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Retrieves message history for a chat session.
    """
    try:
        # Check session ownership
        with get_db_cursor() as cur:
            cur.execute("SELECT user_id FROM public.chat_sessions WHERE id = %s", (session_id,))
            session = cur.fetchone()
            
        if not session or session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied."
            )
            
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT id, session_id, sender, content, sources, created_at
                FROM public.chat_messages
                WHERE session_id = %s
                ORDER BY created_at ASC
                """,
                (session_id,)
            )
            messages = cur.fetchall()
            
        # Parse JSON sources field
        for msg in messages:
            if isinstance(msg["sources"], str):
                msg["sources"] = json.loads(msg["sources"])
                
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    session_id: str,
    message_data: ChatMessageCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Receives a user question, performs Hybrid RAG, queries Groq LLM, and returns the response.
    """
    user_query = message_data.content
    
    try:
        # 1. Verify session ownership
        with get_db_cursor() as cur:
            cur.execute("SELECT user_id, title FROM public.chat_sessions WHERE id = %s", (session_id,))
            session = cur.fetchone()
            
        if not session or session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied."
            )

        # 1.5 Fetch User Profile (demographics for personalized prompt context)
        user_profile = {}
        try:
            with get_db_cursor() as cur:
                cur.execute(
                    "SELECT first_name, date_of_birth, gender, height, blood_group, intake_responses FROM public.profiles WHERE id = %s",
                    (user_id,)
                )
                profile = cur.fetchone()
                if profile:
                    import datetime
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
                        "blood_group": profile.get("blood_group"),
                        "intake_responses": profile.get("intake_responses") or {}
                    }
        except Exception as profile_err:
            logger.error(f"Failed to fetch profile during chat session: {str(profile_err)}")

        # 2. Hybrid RAG: Retrieve report vector chunks & medical facts
        report_chunks = similarity_search_reports(user_query, user_id, limit=3)
        medical_facts = similarity_search_knowledge(user_query, limit=2)
        
        # 3. Fetch all historical biomarker measurements (up to 150 records) for the chronological timeline
        historical_biomarkers = []
        try:
            with get_db_cursor() as cur:
                cur.execute(
                    """
                    SELECT name, value, unit, reference_range, status, recorded_at
                    FROM public.biomarkers
                    WHERE user_id = %s
                    ORDER BY recorded_at DESC
                    LIMIT 150
                    """,
                    (user_id,)
                )
                raw_bios = cur.fetchall()
                # Sort in python to group by name and sort each group chronologically
                historical_biomarkers = sorted(raw_bios, key=lambda x: (x["name"], x["recorded_at"]))
        except Exception as e:
            logger.error(f"Failed to fetch historical biomarkers for chatbot context: {str(e)}")

        # Fetch all unique patient names from reports for context sanitization
        mismatched_names = []
        try:
            with get_db_cursor() as cur:
                cur.execute(
                    "SELECT DISTINCT patient_name FROM public.reports WHERE user_id = %s AND patient_name IS NOT NULL",
                    (user_id,)
                )
                mismatched_names = [r["patient_name"] for r in cur.fetchall() if r["patient_name"]]
        except Exception as e:
            logger.error(f"Failed to fetch patient names for sanitization: {str(e)}")

        user_first_name = (user_profile.get("first_name") or "User").strip()

        def sanitize_context_text(text: str, user_name: str, names: List[str]) -> str:
            if not text or not user_name:
                return text
            sanitized = text
            for name in names:
                if not name or len(name.strip()) < 3:
                    continue
                if user_name.lower() in name.lower() or name.lower() in user_name.lower():
                    continue
                # Case insensitive replace of full name
                pattern = re.compile(re.escape(name), re.IGNORECASE)
                sanitized = pattern.sub(user_name, sanitized)
                # Also replace individual names if they are part of a full name (e.g. Jane, Smith)
                parts = [p.strip() for p in re.split(r'\s+', name) if len(p.strip()) > 2]
                for part in parts:
                    if part.lower() not in user_name.lower() and part.lower() != "patient":
                        part_pattern = re.compile(r'\b' + re.escape(part) + r'\b', re.IGNORECASE)
                        sanitized = part_pattern.sub(user_name, sanitized)
            return sanitized

        # 4. Fetch recent chat history for conversational context (last 6 messages)
        with get_db_cursor() as cur:
            cur.execute(
                """
                SELECT sender, content
                FROM public.chat_messages
                WHERE session_id = %s
                ORDER BY created_at DESC
                LIMIT 6
                """,
                (session_id,)
            )
            raw_history = cur.fetchall()
            
        chat_history = []
        for msg in reversed(raw_history):
            chat_history.append({"role": "user" if msg["sender"] == "user" else "assistant", "content": msg["content"]})

        # 5. Assemble Context prompt strings
        context_str = ""
        if report_chunks:
            context_str += "\nRelevant excerpts from uploaded medical reports:\n"
            for chunk in report_chunks:
                sanitized_content = sanitize_context_text(chunk['content'].strip(), user_first_name, mismatched_names)
                context_str += f"- \"{sanitized_content}\"\n"
                
        if medical_facts:
            context_str += "\nReference Clinical Knowledge Base Facts:\n"
            for fact in medical_facts:
                context_str += f"- Topic: {fact['topic']}: {fact['content']}\n"
                
        if historical_biomarkers:
            context_str += "\nUser's Historical Biomarker Measurements (Timeline/Trends):\n"
            # Deduplicate by name + date
            seen = set()
            for bio in historical_biomarkers:
                bio_key = (bio['name'], str(bio['recorded_at']))
                if bio_key not in seen:
                    seen.add(bio_key)
                    context_str += f"- {bio['name']}: {bio['value']} {bio['unit']} (Status: {bio['status']}, Normal Range: {bio['reference_range']}) recorded on {bio['recorded_at']}\n"

        # 6. Formulate LLM payload
        system_instructions = (
            "You are the HealthLens AI Personal Health Coach, a highly professional, dedicated clinical chatbot designed "
            "to track and review the patient's health record over time. "
            "Your tone is supportive, intelligent, and highly personalized. "
            "You act like a professional, custom fine-tuned clinical assistant. "
            "If the user has not uploaded any reports or records yet (the context is empty), greet them warmly, "
            "proactively ask them about their current health goals, what metrics they'd like to monitor, "
            "or what symptoms they are experiencing, and explain how you can help them track and analyze their metrics. "
            "If they do have records, analyze their historical trends, compare report metrics chronologically, "
            "and suggest proactive health actions. "
            "CRITICAL: All records in the database belong to the user, even if they originally had a different name. "
            "The user has explicitly approved and merged this data into their health memory. "
            "You MUST treat all data and reports in the context as the user's own. "
            "Do NOT refuse to answer, do NOT warn the user about name mismatches, and do NOT say that the report belongs to someone else. "
            "Refer to the retrieved data as the user's own history (using 'you' or their first name). "
            "Do NOT start your message with preachy statements, warnings, or 'As an AI...'. "
            "You must dynamically tailor lifestyle recommendations and wellness suggestions to match the user's "
            "primary health goals, diet type, and activity level. Ground your suggestions in their family risk factors, "
            "and ensure you do not make recommendations that conflict with their lifestyle baselines (e.g., never suggest "
            "animal protein diets to vegans, or intense high-impact sports to sedentary users without appropriate warnings). "
            "CRITICAL: At the very end of your message, you must include a single separate line with the exact text: "
            "\"This is educational information and not a medical diagnosis.\""
        )

        profile_context = ""
        if user_profile:
            profile_context = "\nPatient Profile Demographics (highly personalized context for your response):\n"
            if user_profile.get("first_name"):
                profile_context += f"- First Name: {user_profile['first_name']}\n"
            if user_profile.get("age") is not None:
                profile_context += f"- Age: {user_profile['age']} years old\n"
            if user_profile.get("gender"):
                profile_context += f"- Biological Sex: {user_profile['gender']}\n"
            if user_profile.get("height"):
                profile_context += f"- Height: {user_profile['height']} cm\n"
            if user_profile.get("blood_group"):
                profile_context += f"- Blood Group: {user_profile['blood_group']}\n"
            
            # Format intake responses
            intake = user_profile.get("intake_responses") or {}
            if intake:
                profile_context += "\nPatient Lifestyle & Clinical Intake Baselines:\n"
                if intake.get("primary_goals"):
                    profile_context += f"- Primary Health Goals: {', '.join(intake['primary_goals'])}\n"
                if intake.get("diet"):
                    profile_context += f"- Diet Type: {intake['diet'].capitalize()}\n"
                if intake.get("activity_level"):
                    profile_context += f"- Physical Activity Level: {intake['activity_level'].replace('_', ' ').title()}\n"
                if intake.get("sleep_hours"):
                    profile_context += f"- Sleep Average: {intake['sleep_hours'].replace('_', ' ')} hours/night\n"
                if intake.get("tobacco_alcohol"):
                    profile_context += f"- Tobacco/Alcohol Use: {intake['tobacco_alcohol'].replace('_', ' ').capitalize()}\n"
                if intake.get("family_history"):
                    profile_context += f"- Family Medical History Risk Factors: {', '.join(intake['family_history'])}\n"

        messages_payload = [
            {"role": "system", "content": system_instructions}
        ]
        
        if profile_context:
            messages_payload.append({
                "role": "system",
                "content": profile_context
            })
        
        # Append retrieved context
        if context_str:
            messages_payload.append({
                "role": "system",
                "content": f"Here is the retrieved patient context to help answer the user's question:\n{context_str}"
            })
            
        # Append chat history
        messages_payload.extend(chat_history)
        
        # Append user query
        messages_payload.append({"role": "user", "content": user_query})

        # 7. Call Groq model
        logger.info(f"Submitting query to Groq model ({settings.GROQ_MODEL}) for session {session_id}...")
        response = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages_payload,
            temperature=0.3
        )
        assistant_reply = response.choices[0].message.content

        # 8. Record sources list to return to client
        sources = []
        for rc in report_chunks:
            sources.append({
                "type": "report_excerpt",
                "snippet": rc["content"],
                "report_id": str(rc["report_id"])
            })
        for mf in medical_facts:
            sources.append({
                "type": "medical_fact",
                "topic": mf["topic"],
                "content": mf["content"]
            })
        if historical_biomarkers:
            sources.append({
                "type": "biomarker_history",
                "biomarkers": list(set([b["name"] for b in historical_biomarkers]))
            })

        # 9. Save user message and assistant reply to DB
        with get_db_cursor(commit=True) as cur:
            # Save User Message
            cur.execute(
                """
                INSERT INTO public.chat_messages (session_id, sender, content, sources)
                VALUES (%s, 'user', %s, '[]'::jsonb)
                """,
                (session_id, user_query)
            )
            # Save Assistant Reply
            cur.execute(
                """
                INSERT INTO public.chat_messages (session_id, sender, content, sources)
                VALUES (%s, 'assistant', %s, %s)
                RETURNING id, session_id, sender, content, sources, created_at
                """,
                (session_id, assistant_reply, json.dumps(sources))
            )
            saved_reply = cur.fetchone()

            # Update session's updated_at timestamp
            cur.execute(
                "UPDATE public.chat_sessions SET updated_at = now() WHERE id = %s",
                (session_id,)
            )

        # 10. Update session title if it is a default placeholder title
        placeholder_titles = ["New Chat", "New Consultation", "Health Tracking", "Deep Dive Analysis"]
        if session["title"] in placeholder_titles:
            words = user_query.strip().split()
            if len(words) <= 5:
                new_title = user_query.strip()
            else:
                new_title = " ".join(words[:4]) + "..."
            if len(new_title) > 35:
                new_title = new_title[:32] + "..."

            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE public.chat_sessions SET title = %s WHERE id = %s",
                    (new_title, session_id)
                )

        # Format sources as list
        saved_reply["sources"] = sources
        return saved_reply
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat execution failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat execution failed: {str(e)}"
        )

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    session_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Deletes a chat session and its message history.
    """
    try:
        # Check ownership first
        with get_db_cursor() as cur:
            cur.execute("SELECT user_id FROM public.chat_sessions WHERE id = %s", (session_id,))
            session = cur.fetchone()
            
        if not session or session["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied."
            )
            
        with get_db_cursor(commit=True) as cur:
            # Delete messages first
            cur.execute("DELETE FROM public.chat_messages WHERE session_id = %s", (session_id,))
            # Delete the session itself
            cur.execute("DELETE FROM public.chat_sessions WHERE id = %s", (session_id,))
            
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}"
        )
