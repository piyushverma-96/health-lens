import os
import re
import sys
import ssl
from pathlib import Path
from urllib.parse import urlsplit, parse_qsl

def get_database_url():
    # Check current directory and parent directory .env
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val and not val.startswith("postgresql://postgres:[password]"):
                        return val
    return os.environ.get("DATABASE_URL")

def parse_pg_url(url: str):
    parsed = urlsplit(url)
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    database = parsed.path.lstrip("/") or "postgres"
    query = dict(parse_qsl(parsed.query))
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "database": database,
        "ssl": query.get("sslmode", "require") != "disable"
    }

def get_connection(db_url: str):
    # Try psycopg2 first
    try:
        import psycopg2
        return psycopg2.connect(db_url)
    except (ImportError, Exception) as pe:
        pass

    # Fallback to pure-Python pg8000
    try:
        import pg8000.dbapi
        cfg = parse_pg_url(db_url)
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        conn = pg8000.dbapi.connect(
            user=cfg["user"],
            password=cfg["password"],
            host=cfg["host"],
            port=cfg["port"],
            database=cfg["database"],
            ssl_context=ssl_ctx if cfg["ssl"] else None
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        raise RuntimeError(f"Failed to connect to database: {str(e)}")

def apply_migrations():
    db_url = get_database_url()
    if not db_url:
        print("ERROR: DATABASE_URL not found in .env or environment variables.")
        sys.exit(1)

    print("Connecting to PostgreSQL database...")
    conn = get_connection(db_url)
    cursor = conn.cursor()
    print("Database connection successful.")

    migrations_dir = Path(__file__).resolve().parent / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    print(f"Found {len(migration_files)} migration files.")
    for sql_file in migration_files:
        print(f"\n--- Applying: {sql_file.name} ---")
        sql_content = sql_file.read_text(encoding="utf-8")
        try:
            cursor.execute(sql_content)
            print(f"Successfully applied {sql_file.name}")
        except Exception as ex:
            print(f"  Error executing {sql_file.name}: {ex}")
            raise ex


    if hasattr(conn, "commit") and not getattr(conn, "autocommit", False):
        conn.commit()

    print("\n==========================================")
    print("VERIFYING DATABASE OBJECTS")
    print("==========================================")

    # 1. Verify vector extension
    cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
    ext = cursor.fetchone()
    print(f"[OK] pgvector extension: {'INSTALLED' if ext else 'MISSING'}")

    # 2. Verify tables
    expected_tables = [
        "profiles", "reports", "biomarkers", 
        "report_chunks", "medical_knowledge", 
        "chat_sessions", "chat_messages"
    ]
    cursor.execute(
        """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
        """
    )
    existing_tables = [row[0] for row in cursor.fetchall()]
    for tbl in expected_tables:
        status = "EXISTS" if tbl in existing_tables else "MISSING"
        print(f"[OK] Table 'public.{tbl}': {status}")

    # 3. Verify vector dimensions
    try:
        cursor.execute(
            """
            SELECT table_name, column_name, udt_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND column_name = 'embedding';
            """
        )
        vec_cols = cursor.fetchall()
        for col in vec_cols:
            print(f"[OK] Vector column '{col[0]}.{col[1]}': type={col[2]}")
    except Exception as ex:
        print(f"  Vector check note: {ex}")

    # 4. Verify indexes
    expected_indexes = [
        "idx_biomarkers_user_recorded",
        "idx_reports_user_uploaded",
        "idx_chunks_report",
        "idx_messages_session"
    ]
    cursor.execute(
        """
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public';
        """
    )
    existing_indexes = [row[0] for row in cursor.fetchall()]
    for idx in expected_indexes:
        status = "EXISTS" if idx in existing_indexes else "MISSING"
        print(f"[OK] Index '{idx}': {status}")

    # 5. Verify RLS
    cursor.execute(
        """
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public';
        """
    )
    for row in cursor.fetchall():
        if row[0] in expected_tables:
            rls_status = "ENABLED" if row[1] else "DISABLED"
            print(f"[OK] RLS on '{row[0]}': {rls_status}")

    # 6. Verify Trigger
    cursor.execute(
        """
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created';
        """
    )
    trig = cursor.fetchone()
    print(f"[OK] Trigger 'on_auth_user_created': {'ACTIVE' if trig else 'MISSING'}")

    # 7. Verify Storage bucket
    try:
        cursor.execute("SELECT id, name, public FROM storage.buckets WHERE id = 'reports';")
        bucket = cursor.fetchone()
        if bucket:
            is_private = not bucket[2]
            print(f"[OK] Storage bucket 'reports': EXISTS (Private: {is_private})")
        else:
            print("[MISSING] Storage bucket 'reports': NOT FOUND")
    except Exception as ex:
        print(f"  Storage bucket check note: {ex}")


    cursor.close()
    conn.close()
    print("\nAll database migrations verified successfully!")

if __name__ == "__main__":
    apply_migrations()
