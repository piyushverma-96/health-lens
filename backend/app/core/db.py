import logging
import socket
import ssl
from contextlib import contextmanager
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from app.core.config import settings

logger = logging.getLogger("healthlens.db")

# Global connection pool instance
db_pool = None
last_db_error: str | None = None
_db_driver: str = "psycopg2"

try:
    import psycopg2
    from psycopg2.pool import ThreadedConnectionPool
    from psycopg2 import OperationalError
    from psycopg2.extras import RealDictCursor
    _has_psycopg2 = True
except ImportError:
    _has_psycopg2 = False
    _db_driver = "pg8000"


class Pg8000DictCursor:
    """Wrapper around pg8000 cursor to mimic RealDictCursor."""
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        if params is not None:
            # Handle list params (e.g. ANY(%s))
            formatted_params = []
            for p in params:
                if isinstance(p, (list, tuple)):
                    formatted_params.append(p)
                else:
                    formatted_params.append(p)
            return self._cursor.execute(query, formatted_params)
        return self._cursor.execute(query)

    def _convert_val(self, val):
        import uuid
        from decimal import Decimal
        if isinstance(val, uuid.UUID):
            return str(val)
        if isinstance(val, Decimal):
            return float(val)
        return val

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        columns = [col[0] for col in self._cursor.description]
        return {col: self._convert_val(val) for col, val in zip(columns, row)}

    def fetchall(self):
        rows = self._cursor.fetchall()
        if not rows:
            return []
        columns = [col[0] for col in self._cursor.description]
        return [{col: self._convert_val(val) for col, val in zip(columns, row)} for row in rows]

    def close(self):
        self._cursor.close()

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def description(self):
        return self._cursor.description


class Pg8000SimplePool:
    """Simple thread-safe connection pool for pg8000."""
    def __init__(self, dsn: str, maxconn: int = 15):
        import pg8000.dbapi
        self.dbapi = pg8000.dbapi
        self.parsed = urlsplit(dsn)
        self.user = self.parsed.username
        self.password = self.parsed.password
        self.host = self.parsed.hostname
        self.port = self.parsed.port or 5432
        self.database = self.parsed.path.lstrip("/") or "postgres"
        query = dict(parse_qsl(self.parsed.query))
        self.use_ssl = query.get("sslmode", "require") != "disable"
        self._connections = []
        self._maxconn = maxconn

    def _create_conn(self):
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        conn = self.dbapi.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            database=self.database,
            ssl_context=ssl_ctx if self.use_ssl else None
        )
        return conn

    def getconn(self):
        if self._connections:
            return self._connections.pop()
        return self._create_conn()

    def putconn(self, conn):
        if len(self._connections) < self._maxconn:
            self._connections.append(conn)
        else:
            try:
                conn.close()
            except Exception:
                pass

    def closeall(self):
        for conn in self._connections:
            try:
                conn.close()
            except Exception:
                pass
        self._connections.clear()


def _inject_hostaddr_ipv4(dsn: str) -> str | None:
    """
    Resolves the database hostname to IPv4 and injects hostaddr into the DSN.
    This avoids Windows/ISP environments where IPv6 routing is unavailable.
    """
    try:
        parsed = urlsplit(dsn)
        hostname = parsed.hostname
        if not hostname:
            return None

        query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
        if any(key == "hostaddr" for key, _ in query_pairs):
            return dsn

        ipv4_info = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET, socket.SOCK_STREAM)
        if not ipv4_info:
            return None

        ipv4_address = ipv4_info[0][4][0]
        query_pairs.append(("hostaddr", ipv4_address))

        resolved_dsn = urlunsplit((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            urlencode(query_pairs),
            parsed.fragment,
        ))
        logger.info("Resolved database host %s to IPv4 %s for connection fallback.", hostname, ipv4_address)
        return resolved_dsn
    except Exception as exc:
        logger.warning("Unable to resolve IPv4 database fallback: %s", exc)
        return None

def init_db_pool():
    """
    Initializes database pool using settings.DATABASE_URL.
    Uses psycopg2 if available, or pg8000 fallback on Windows ARM64.
    """
    global db_pool, last_db_error, _db_driver
    if db_pool is None:
        if _has_psycopg2:
            try:
                logger.info("Initializing psycopg2 ThreadedConnectionPool...")
                db_pool = ThreadedConnectionPool(
                    minconn=5,
                    maxconn=20,
                    dsn=settings.DATABASE_URL
                )
                last_db_error = None
                _db_driver = "psycopg2"
                logger.info("Database connection pool initialized successfully via psycopg2.")
                return
            except OperationalError as e:
                logger.warning("Primary database pool initialization failed: %s", e)
                fallback_dsn = _inject_hostaddr_ipv4(settings.DATABASE_URL)
                if fallback_dsn:
                    try:
                        logger.info("Retrying psycopg2 pool initialization with IPv4 fallback...")
                        db_pool = ThreadedConnectionPool(
                            minconn=5,
                            maxconn=20,
                            dsn=fallback_dsn
                        )
                        last_db_error = None
                        _db_driver = "psycopg2"
                        logger.info("Database connection pool initialized successfully using IPv4 fallback.")
                        return
                    except Exception as retry_error:
                        logger.warning("psycopg2 IPv4 retry failed: %s", retry_error)
        
        # pg8000 fallback
        try:
            logger.info("Initializing pg8000 database connection pool...")
            db_pool = Pg8000SimplePool(dsn=settings.DATABASE_URL, maxconn=15)
            # Test a connection
            test_conn = db_pool.getconn()
            db_pool.putconn(test_conn)
            last_db_error = None
            _db_driver = "pg8000"
            logger.info("Database connection pool initialized successfully via pg8000.")
        except Exception as e:
            last_db_error = str(e)
            logger.error("Failed to initialize database connection pool: %s", str(e))
            raise e

def close_db_pool():
    """Gracefully closes all connections in the pool."""
    global db_pool
    if db_pool is not None:
        try:
            logger.info("Closing all pooled database connections...")
            db_pool.closeall()
            db_pool = None
            logger.info("Database connection pool closed successfully.")
        except Exception as e:
            logger.error(f"Error while closing database connection pool: {str(e)}")

def is_db_available() -> bool:
    return db_pool is not None

@contextmanager
def get_db_connection():
    """Context manager to borrow a database connection from the pool."""
    global db_pool
    if db_pool is None:
        init_db_pool()
        
    conn = db_pool.getconn()
    try:
        yield conn
    finally:
        db_pool.putconn(conn)

@contextmanager
def get_db_cursor(commit=False):
    """
    Context manager to fetch a database cursor from a pooled connection.
    Returns query results as dictionaries.
    Automatically handles commits and rollbacks on errors.
    """
    with get_db_connection() as conn:
        if _db_driver == "psycopg2":
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                try:
                    yield cur
                    if commit:
                        conn.commit()
                except Exception as e:
                    conn.rollback()
                    raise e
        else:
            raw_cur = conn.cursor()
            cur = Pg8000DictCursor(raw_cur)
            try:
                yield cur
                if commit:
                    conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                cur.close()

