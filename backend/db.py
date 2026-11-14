import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv('DATABASE_PATH', str(ROOT / 'xogame.db')))
MEDIA_PATH = Path(os.getenv('MEDIA_PATH', str(ROOT / 'media')))

def now():
    return datetime.now(timezone.utc).isoformat()

def uid():
    return str(uuid4())

@contextmanager
def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=20)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

def audit(c, action, target, metadata=None):
    c.execute('INSERT INTO audit VALUES(?,?,?,?,?,?)', (uid(), 'open-workspace', action, target, now(), json.dumps(metadata or {})))

def migrate():
    MEDIA_PATH.mkdir(parents=True, exist_ok=True)
    with connect() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, data TEXT NOT NULL, suspended INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS organisations(id TEXT PRIMARY KEY, data TEXT NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, organisation_id TEXT REFERENCES organisations(id), filename TEXT, path TEXT, created_at TEXT);
        CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES organisations(id), data TEXT NOT NULL, status TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS videos(id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES profiles(id), filename TEXT NOT NULL, path TEXT NOT NULL, status TEXT NOT NULL, consent INTEGER NOT NULL, duration REAL, error TEXT, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS applications(id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES profiles(id), job_id TEXT NOT NULL REFERENCES jobs(id), organisation_id TEXT NOT NULL REFERENCES organisations(id), video_id TEXT NOT NULL REFERENCES videos(id), profile_snapshot TEXT NOT NULL, status TEXT NOT NULL, submitted_at TEXT NOT NULL, idempotency_key TEXT UNIQUE, UNIQUE(candidate_id,job_id));
        CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id), status TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id), body TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id), message TEXT NOT NULL, created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, actor TEXT, action TEXT, target TEXT, created_at TEXT, metadata TEXT);
        CREATE INDEX IF NOT EXISTS jobs_org ON jobs(organisation_id,status);
        CREATE INDEX IF NOT EXISTS applications_org ON applications(organisation_id,job_id,status);
        CREATE INDEX IF NOT EXISTS videos_candidate ON videos(candidate_id,status);
        CREATE INDEX IF NOT EXISTS events_application ON events(application_id,created_at);
        INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));
        ''')
