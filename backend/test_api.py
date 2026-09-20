import sys
import os

# Add root folder to python path so app imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.core.config import settings

from app.core.db import init_db_pool, get_db_cursor

# Initialize DB connection pool
init_db_pool()

# Fetch an existing valid user_id from profiles or use default
try:
    with get_db_cursor() as cur:
        cur.execute("SELECT id FROM public.profiles LIMIT 1;")
        row = cur.fetchone()
        MOCK_USER_ID = str(row["id"]) if row else "03a7cbcd-fb53-4e08-8217-c6a11b48c182"
except Exception:
    MOCK_USER_ID = "03a7cbcd-fb53-4e08-8217-c6a11b48c182"

app.dependency_overrides[get_current_user] = lambda: MOCK_USER_ID

client = TestClient(app)

def run_tests():
    print("=========================================")
    print("  Running HealthLens API Automated Tests ")
    print("=========================================")
    
    # 1. Test Root Endpoint
    print("\n[Test 1] GET /")
    response = client.get("/")
    assert response.status_code == 200
    print("  Root endpoint returns OK:", response.json())
    
    # 2. Test Health Endpoint
    print("\n[Test 2] GET /api/v1/health")
    response = client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == 200
    print("  Health check endpoint returns OK:", response.json())
    
    # 3. Test Create Chat Session
    print("\n[Test 3] POST /api/v1/chat/sessions")
    session_title = "Automated Test Session"
    response = client.post(f"{settings.API_V1_STR}/chat/sessions", json={"title": session_title})
    assert response.status_code == 201
    session_data = response.json()
    session_id = session_data["id"]
    assert session_data["title"] == session_title
    print(f"  Created chat session successfully. ID: {session_id}")
    
    # 4. Test List Chat Sessions
    print("\n[Test 4] GET /api/v1/chat/sessions")
    response = client.get(f"{settings.API_V1_STR}/chat/sessions")
    assert response.status_code == 200
    sessions_list = response.json()
    assert len(sessions_list) > 0
    assert any(s["id"] == session_id for s in sessions_list)
    print(f"  Session {session_id} found in active list.")
    
    # 5. Test Send Chat Message (queries LLM / performs Hybrid RAG)
    print("\n[Test 5] POST /api/v1/chat/sessions/{session_id}/messages")
    print("Prompt: 'Why is my Vitamin D low?'")
    print("Querying LLM (this may take a few seconds)...")
    message_payload = {"content": "Why is my Vitamin D low?"}
    response = client.post(f"{settings.API_V1_STR}/chat/sessions/{session_id}/messages", json=message_payload)
    assert response.status_code == 201
    message_data = response.json()
    reply_content = message_data["content"]
    
    print("\nChatbot Response Preview:")
    print("-----------------------------------------")
    print(reply_content)
    print("-----------------------------------------")
    
    # Verify the reply has our custom footer disclaimer at the end
    assert "This is educational information and not a medical diagnosis" in reply_content
    print("  Message processed successfully.")
    print("  Verified disclaimer presence at the end of the message.")
    
    # 6. Test Get Messages
    print("\n[Test 6] GET /api/v1/chat/sessions/{session_id}/messages")
    response = client.get(f"{settings.API_V1_STR}/chat/sessions/{session_id}/messages")
    assert response.status_code == 200
    messages = response.json()
    assert len(messages) >= 2
    print(f"  Successfully retrieved {len(messages)} messages from history.")
    
    # 7. Test Delete Chat Session
    print(f"\n[Test 7] DELETE /api/v1/chat/sessions/{session_id}")
    response = client.delete(f"{settings.API_V1_STR}/chat/sessions/{session_id}")
    assert response.status_code == 204
    print("  Session deleted successfully (HTTP 204 No Content received).")
    
    # 8. Test Get Messages after Deletion (should fail/404)
    print("\n[Test 8] Verify GET messages on deleted session")
    response = client.get(f"{settings.API_V1_STR}/chat/sessions/{session_id}/messages")
    assert response.status_code == 404
    print("  Confirmed HTTP 404 returned on deleted session lookup.")
    
    print("\n[Test 9] Verify session absent from listing")
    response = client.get(f"{settings.API_V1_STR}/chat/sessions")
    assert response.status_code == 200
    updated_list = response.json()
    assert not any(s["id"] == session_id for s in updated_list)
    print("  Confirmed session is no longer in the user's active list.")
    
    # 10. Test Report Retry and Rate Limiting
    print("\n[Test 10] POST /api/v1/reports/{report_id}/retry")
    from app.core.db import get_db_cursor
    
    # Insert a mock failed report with updated_at set to 1 minute ago
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO public.reports (user_id, file_path, file_name, mime_type, status, error_message, updated_at)
            VALUES (%s, 'test_path', 'test_file.png', 'image/png', 'failed', 'Mock OCR Error', now() - interval '1 minute')
            RETURNING id
            """,
            (MOCK_USER_ID,)
        )
        report = cur.fetchone()
        report_id = report["id"]
        
    try:
        # Test successful retry (cooldown satisfied since updated_at was 1 minute ago)
        response = client.post(f"{settings.API_V1_STR}/reports/{report_id}/retry")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        print("  Retry endpoint scheduled successfully on first attempt.")
        
        # Test rate limiting (should trigger 429 because it was updated just now)
        response = client.post(f"{settings.API_V1_STR}/reports/{report_id}/retry")
        assert response.status_code == 429
        data = response.json()
        assert "Please wait" in data["detail"]
        print("  Retry rate limit correctly returned HTTP 429.")
        
    finally:
        # Clean up mock report
        with get_db_cursor(commit=True) as cur:
            cur.execute("DELETE FROM public.reports WHERE id = %s", (report_id,))
            
    print("  Report retry endpoint tests PASSED!")
    
    print("\n=========================================")
    print("  All 10 automated test checks PASSED!   ")
    print("=========================================")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print("\n[FAIL] Assert error encountered! Test failed.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {str(e)}")
        sys.exit(1)
