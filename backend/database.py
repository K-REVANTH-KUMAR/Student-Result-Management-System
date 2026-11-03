import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE = BASE_DIR.parent / "data" / "srms.db"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DATABASE))).expanduser()
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = (BASE_DIR / DATABASE_PATH).resolve()


def get_db_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def create_tables():
    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            login_id TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            roll_number TEXT NOT NULL UNIQUE,
            class_name TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_name TEXT NOT NULL UNIQUE
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS marks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            marks REAL NOT NULL CHECK(marks >= 0 AND marks <= 100),
            teacher_id INTEGER,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, subject_id),
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    connection.commit()
    connection.close()


def create_admins():
    """Create the two configured initial admins; never seed demo teachers/students."""
    admins = [
        (os.getenv("ADMIN1_NAME", "Primary Admin"), os.getenv("ADMIN1_LOGIN_ID", "admin1"), os.getenv("ADMIN1_PASSWORD", "")),
        (os.getenv("ADMIN2_NAME", "Secondary Admin"), os.getenv("ADMIN2_LOGIN_ID", "admin2"), os.getenv("ADMIN2_PASSWORD", "")),
    ]

    if not admins[0][2] or not admins[1][2]:
        raise RuntimeError("Set ADMIN1_PASSWORD and ADMIN2_PASSWORD in backend/.env before starting the server.")
    if admins[0][1].strip().lower() == admins[1][1].strip().lower():
        raise RuntimeError("ADMIN1_LOGIN_ID and ADMIN2_LOGIN_ID must be different.")

    connection = get_db_connection()
    for name, login_id, password in admins:
        exists = connection.execute("SELECT id FROM users WHERE login_id = ?", (login_id.strip(),)).fetchone()
        if exists is None:
            connection.execute(
                "INSERT INTO users (name, login_id, password, role) VALUES (?, ?, ?, 'admin')",
                (name.strip(), login_id.strip(), generate_password_hash(password))
            )
    connection.commit()
    connection.close()
