import os
import sqlite3
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash
from database import create_tables, create_admins, get_db_connection
from auth import generate_token, token_required, role_required

load_dotenv()
app = Flask(__name__)
origins = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if item.strip()]
CORS(app, resources={r"/api/*": {"origins": origins}})

create_tables()
create_admins()


def read_json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None
    return data


def clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def get_user(user_id, role=None):
    connection = get_db_connection()
    if role:
        user = connection.execute("SELECT id, name, login_id, role FROM users WHERE id = ? AND role = ?", (user_id, role)).fetchone()
    else:
        user = connection.execute("SELECT id, name, login_id, role FROM users WHERE id = ?", (user_id,)).fetchone()
    connection.close()
    return user


def get_student_profile(user_id):
    connection = get_db_connection()
    student = connection.execute("SELECT id, user_id, roll_number, class_name FROM students WHERE user_id = ?", (user_id,)).fetchone()
    connection.close()
    return student


def user_response(user):
    return {"id": user["id"], "name": user["name"], "login_id": user["login_id"], "role": user["role"]}


@app.get("/")
def home():
    return jsonify({"message": "Student Result Management System API is running", "status": "ok"})


# -------------------- Authentication --------------------
@app.post("/api/auth/login")
def login():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    login_id = clean_text(data.get("login_id"))
    password = data.get("password", "")
    if not login_id or not password:
        return jsonify({"message": "Login ID and password are required"}), 400

    connection = get_db_connection()
    user = connection.execute("SELECT * FROM users WHERE login_id = ?", (login_id,)).fetchone()
    connection.close()
    if user is None or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid login ID or password"}), 401

    return jsonify({"token": generate_token(user["id"]), "user": user_response(user)}), 200


@app.get("/api/auth/profile")
@token_required
def profile():
    return jsonify(g.user), 200


@app.put("/api/auth/profile")
@token_required
def update_profile():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    name = clean_text(data.get("name"))
    password = data.get("password", "")
    if not name:
        return jsonify({"message": "Name is required"}), 400
    connection = get_db_connection()
    if password:
        if len(password) < 8:
            connection.close()
            return jsonify({"message": "Password must contain at least 8 characters"}), 400
        connection.execute("UPDATE users SET name = ?, password = ? WHERE id = ?", (name, generate_password_hash(password), g.user["id"]))
    else:
        connection.execute("UPDATE users SET name = ? WHERE id = ?", (name, g.user["id"]))
    connection.commit()
    connection.close()
    return jsonify({"message": "Profile updated successfully"}), 200


# -------------------- Admin dashboard --------------------
@app.get("/api/admin/dashboard")
@token_required
@role_required("admin")
def admin_dashboard():
    connection = get_db_connection()
    teachers = connection.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'teacher'").fetchone()["total"]
    students = connection.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'student'").fetchone()["total"]
    subjects = connection.execute("SELECT COUNT(*) AS total FROM subjects").fetchone()["total"]
    marks = connection.execute("SELECT COUNT(*) AS total FROM marks").fetchone()["total"]
    connection.close()
    return jsonify({"teachers": teachers, "students": students, "subjects": subjects, "marks": marks}), 200


# -------------------- Admin: teachers --------------------
@app.get("/api/admin/teachers")
@token_required
@role_required("admin")
def get_teachers():
    connection = get_db_connection()
    rows = connection.execute("SELECT id, name, login_id, role FROM users WHERE role = 'teacher' ORDER BY name").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows]), 200


@app.post("/api/admin/teachers")
@token_required
@role_required("admin")
def create_teacher():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    name, login_id, password = clean_text(data.get("name")), clean_text(data.get("login_id")), data.get("password", "")
    if not name or not login_id or not password:
        return jsonify({"message": "Name, login ID, and password are required"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must contain at least 8 characters"}), 400
    connection = get_db_connection()
    try:
        cursor = connection.execute("INSERT INTO users (name, login_id, password, role) VALUES (?, ?, ?, 'teacher')", (name, login_id, generate_password_hash(password)))
        connection.commit()
        return jsonify({"message": "Teacher created successfully", "id": cursor.lastrowid}), 201
    except sqlite3.IntegrityError:
        connection.rollback()
        return jsonify({"message": "Login ID already exists"}), 409
    finally:
        connection.close()


@app.put("/api/admin/teachers/<int:teacher_id>")
@token_required
@role_required("admin")
def update_teacher(teacher_id):
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    name, login_id, password = clean_text(data.get("name")), clean_text(data.get("login_id")), data.get("password", "")
    if not name or not login_id:
        return jsonify({"message": "Name and login ID are required"}), 400
    if password and len(password) < 8:
        return jsonify({"message": "Password must contain at least 8 characters"}), 400
    connection = get_db_connection()
    teacher = connection.execute("SELECT id FROM users WHERE id = ? AND role = 'teacher'", (teacher_id,)).fetchone()
    if teacher is None:
        connection.close()
        return jsonify({"message": "Teacher not found"}), 404
    duplicate = connection.execute("SELECT id FROM users WHERE login_id = ? AND id != ?", (login_id, teacher_id)).fetchone()
    if duplicate:
        connection.close()
        return jsonify({"message": "Login ID already exists"}), 409
    if password:
        connection.execute("UPDATE users SET name = ?, login_id = ?, password = ? WHERE id = ?", (name, login_id, generate_password_hash(password), teacher_id))
    else:
        connection.execute("UPDATE users SET name = ?, login_id = ? WHERE id = ?", (name, login_id, teacher_id))
    connection.commit()
    connection.close()
    return jsonify({"message": "Teacher updated successfully"}), 200


@app.delete("/api/admin/teachers/<int:teacher_id>")
@token_required
@role_required("admin")
def delete_teacher(teacher_id):
    connection = get_db_connection()
    cursor = connection.execute("DELETE FROM users WHERE id = ? AND role = 'teacher'", (teacher_id,))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        return jsonify({"message": "Teacher not found"}), 404
    return jsonify({"message": "Teacher deleted successfully"}), 200


# -------------------- Admin: students --------------------
@app.get("/api/admin/students")
@token_required
@role_required("admin")
def get_students():
    connection = get_db_connection()
    rows = connection.execute("""SELECT u.id, u.name, u.login_id, u.role, s.roll_number, s.class_name
        FROM users u INNER JOIN students s ON u.id = s.user_id
        WHERE u.role = 'student' ORDER BY s.roll_number""").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows]), 200


@app.post("/api/admin/students")
@token_required
@role_required("admin")
def create_student():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    name, login_id = clean_text(data.get("name")), clean_text(data.get("login_id"))
    password = data.get("password", "")
    roll_number, class_name = clean_text(data.get("roll_number")), clean_text(data.get("class_name"))
    if not all([name, login_id, password, roll_number, class_name]):
        return jsonify({"message": "All fields are required"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must contain at least 8 characters"}), 400
    connection = get_db_connection()
    try:
        cursor = connection.execute("INSERT INTO users (name, login_id, password, role) VALUES (?, ?, ?, 'student')", (name, login_id, generate_password_hash(password)))
        connection.execute("INSERT INTO students (user_id, roll_number, class_name) VALUES (?, ?, ?)", (cursor.lastrowid, roll_number, class_name))
        connection.commit()
        return jsonify({"message": "Student created successfully", "id": cursor.lastrowid}), 201
    except sqlite3.IntegrityError as error:
        connection.rollback()
        message = "Login ID or roll number already exists" if "UNIQUE" in str(error) else "Could not create student"
        return jsonify({"message": message}), 409
    finally:
        connection.close()


@app.put("/api/admin/students/<int:student_id>")
@token_required
@role_required("admin")
def update_student(student_id):
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    name, login_id = clean_text(data.get("name")), clean_text(data.get("login_id"))
    roll_number, class_name = clean_text(data.get("roll_number")), clean_text(data.get("class_name"))
    password = data.get("password", "")
    if not all([name, login_id, roll_number, class_name]):
        return jsonify({"message": "Name, login ID, roll number, and class are required"}), 400
    if password and len(password) < 8:
        return jsonify({"message": "Password must contain at least 8 characters"}), 400
    connection = get_db_connection()
    student = connection.execute("SELECT id FROM students WHERE user_id = ?", (student_id,)).fetchone()
    if student is None:
        connection.close()
        return jsonify({"message": "Student not found"}), 404
    duplicate_login = connection.execute("SELECT id FROM users WHERE login_id = ? AND id != ?", (login_id, student_id)).fetchone()
    duplicate_roll = connection.execute("SELECT id FROM students WHERE roll_number = ? AND user_id != ?", (roll_number, student_id)).fetchone()
    if duplicate_login or duplicate_roll:
        connection.close()
        return jsonify({"message": "Login ID or roll number already exists"}), 409
    if password:
        connection.execute("UPDATE users SET name = ?, login_id = ?, password = ? WHERE id = ? AND role = 'student'", (name, login_id, generate_password_hash(password), student_id))
    else:
        connection.execute("UPDATE users SET name = ?, login_id = ? WHERE id = ? AND role = 'student'", (name, login_id, student_id))
    connection.execute("UPDATE students SET roll_number = ?, class_name = ? WHERE user_id = ?", (roll_number, class_name, student_id))
    connection.commit()
    connection.close()
    return jsonify({"message": "Student updated successfully"}), 200


@app.delete("/api/admin/students/<int:student_id>")
@token_required
@role_required("admin")
def delete_student(student_id):
    connection = get_db_connection()
    cursor = connection.execute("DELETE FROM users WHERE id = ? AND role = 'student'", (student_id,))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        return jsonify({"message": "Student not found"}), 404
    return jsonify({"message": "Student and associated academic records deleted successfully"}), 200


# -------------------- Admin: subjects --------------------
@app.get("/api/admin/subjects")
@token_required
@role_required("admin")
def admin_get_subjects():
    connection = get_db_connection()
    rows = connection.execute("SELECT id, subject_name FROM subjects ORDER BY subject_name").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows]), 200


@app.post("/api/admin/subjects")
@token_required
@role_required("admin")
def create_subject():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    subject_name = clean_text(data.get("subject_name"))
    if not subject_name:
        return jsonify({"message": "Subject name is required"}), 400
    connection = get_db_connection()
    try:
        cursor = connection.execute("INSERT INTO subjects (subject_name) VALUES (?)", (subject_name,))
        connection.commit()
        return jsonify({"message": "Subject created successfully", "id": cursor.lastrowid}), 201
    except sqlite3.IntegrityError:
        connection.rollback()
        return jsonify({"message": "Subject already exists"}), 409
    finally:
        connection.close()


@app.put("/api/admin/subjects/<int:subject_id>")
@token_required
@role_required("admin")
def update_subject(subject_id):
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    subject_name = clean_text(data.get("subject_name"))
    if not subject_name:
        return jsonify({"message": "Subject name is required"}), 400
    connection = get_db_connection()
    try:
        cursor = connection.execute("UPDATE subjects SET subject_name = ? WHERE id = ?", (subject_name, subject_id))
        connection.commit()
        if cursor.rowcount == 0:
            return jsonify({"message": "Subject not found"}), 404
        return jsonify({"message": "Subject updated successfully"}), 200
    except sqlite3.IntegrityError:
        connection.rollback()
        return jsonify({"message": "Subject already exists"}), 409
    finally:
        connection.close()


@app.delete("/api/admin/subjects/<int:subject_id>")
@token_required
@role_required("admin")
def delete_subject(subject_id):
    connection = get_db_connection()
    cursor = connection.execute("DELETE FROM subjects WHERE id = ?", (subject_id,))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        return jsonify({"message": "Subject not found"}), 404
    return jsonify({"message": "Subject and its marks deleted successfully"}), 200


# -------------------- Marks: admin --------------------
def marks_query(where_clause="", parameters=()):
    connection = get_db_connection()
    rows = connection.execute("""SELECT m.id, m.student_id, m.subject_id, m.marks, m.teacher_id,
        u.name AS student_name, s.roll_number, s.class_name, sub.subject_name,
        t.name AS teacher_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN subjects sub ON m.subject_id = sub.id
        LEFT JOIN users t ON m.teacher_id = t.id """ + where_clause + " ORDER BY u.name, sub.subject_name", parameters).fetchall()
    connection.close()
    return [dict(row) for row in rows]


@app.get("/api/admin/marks")
@token_required
@role_required("admin")
def admin_get_marks():
    return jsonify(marks_query()), 200


def save_mark(student_id, subject_id, mark_value, teacher_id):
    connection = get_db_connection()
    student = connection.execute("SELECT id FROM students WHERE id = ?", (student_id,)).fetchone()
    subject = connection.execute("SELECT id FROM subjects WHERE id = ?", (subject_id,)).fetchone()
    if student is None or subject is None:
        connection.close()
        return False, "Student or subject not found"
    connection.execute("""INSERT INTO marks (student_id, subject_id, marks, teacher_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(student_id, subject_id) DO UPDATE SET
        marks = excluded.marks, teacher_id = excluded.teacher_id, updated_at = CURRENT_TIMESTAMP""",
        (student_id, subject_id, mark_value, teacher_id))
    connection.commit()
    connection.close()
    return True, "Marks saved successfully"


@app.post("/api/admin/marks")
@token_required
@role_required("admin")
def admin_save_mark():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    try:
        student_id, subject_id, mark_value = int(data.get("student_id")), int(data.get("subject_id")), float(data.get("marks"))
    except (TypeError, ValueError):
        return jsonify({"message": "Student, subject, and numeric marks are required"}), 400
    if not 0 <= mark_value <= 100:
        return jsonify({"message": "Marks must be between 0 and 100"}), 400
    success, message = save_mark(student_id, subject_id, mark_value, g.user["id"])
    return (jsonify({"message": message}), 200) if success else (jsonify({"message": message}), 404)


@app.put("/api/admin/marks/<int:mark_id>")
@token_required
@role_required("admin")
def admin_update_mark(mark_id):
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    try:
        mark_value = float(data.get("marks"))
    except (TypeError, ValueError):
        return jsonify({"message": "A numeric marks value is required"}), 400
    if not 0 <= mark_value <= 100:
        return jsonify({"message": "Marks must be between 0 and 100"}), 400
    connection = get_db_connection()
    cursor = connection.execute("UPDATE marks SET marks = ?, teacher_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (mark_value, g.user["id"], mark_id))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        return jsonify({"message": "Mark record not found"}), 404
    return jsonify({"message": "Marks updated successfully"}), 200


# -------------------- Teacher APIs --------------------
@app.get("/api/teacher/students")
@token_required
@role_required("teacher")
def teacher_students():
    connection = get_db_connection()
    rows = connection.execute("""SELECT u.id, u.name, u.login_id, s.id AS student_id,
        s.roll_number, s.class_name FROM users u JOIN students s ON u.id = s.user_id
        WHERE u.role = 'student' ORDER BY s.roll_number""").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows]), 200


@app.get("/api/teacher/subjects")
@token_required
@role_required("teacher")
def teacher_subjects():
    connection = get_db_connection()
    rows = connection.execute("SELECT id, subject_name FROM subjects ORDER BY subject_name").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows]), 200


@app.get("/api/teacher/marks")
@token_required
@role_required("teacher")
def teacher_marks():
    return jsonify(marks_query("WHERE m.teacher_id = ?", (g.user["id"],))), 200


@app.post("/api/teacher/marks")
@token_required
@role_required("teacher")
def teacher_save_mark():
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    try:
        student_id, subject_id, mark_value = int(data.get("student_id")), int(data.get("subject_id")), float(data.get("marks"))
    except (TypeError, ValueError):
        return jsonify({"message": "Student, subject, and numeric marks are required"}), 400
    if not 0 <= mark_value <= 100:
        return jsonify({"message": "Marks must be between 0 and 100"}), 400
    connection = get_db_connection()
    existing_mark = connection.execute(
        "SELECT teacher_id FROM marks WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id)
    ).fetchone()
    connection.close()
    if existing_mark is not None and existing_mark["teacher_id"] != g.user["id"]:
        return jsonify({"message": "You can only update marks that you entered"}), 403
    success, message = save_mark(student_id, subject_id, mark_value, g.user["id"])
    return (jsonify({"message": message}), 200) if success else (jsonify({"message": message}), 404)


@app.put("/api/teacher/marks/<int:mark_id>")
@token_required
@role_required("teacher")
def teacher_update_mark(mark_id):
    data = read_json()
    if data is None:
        return jsonify({"message": "A JSON request body is required"}), 400
    try:
        mark_value = float(data.get("marks"))
    except (TypeError, ValueError):
        return jsonify({"message": "A numeric marks value is required"}), 400
    if not 0 <= mark_value <= 100:
        return jsonify({"message": "Marks must be between 0 and 100"}), 400
    connection = get_db_connection()
    cursor = connection.execute("UPDATE marks SET marks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND teacher_id = ?", (mark_value, mark_id, g.user["id"]))
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        return jsonify({"message": "Mark not found or you did not enter this mark"}), 404
    return jsonify({"message": "Marks updated successfully"}), 200


# -------------------- Student APIs --------------------
@app.get("/api/student/results")
@token_required
@role_required("student")
def student_results():
    connection = get_db_connection()
    student = connection.execute("""SELECT s.id, s.roll_number, s.class_name, u.name
        FROM students s JOIN users u ON s.user_id = u.id WHERE s.user_id = ?""", (g.user["id"],)).fetchone()
    if student is None:
        connection.close()
        return jsonify({"message": "Student profile not found"}), 404
    subjects = connection.execute("""SELECT sub.id AS subject_id, sub.subject_name,
        m.marks FROM subjects sub LEFT JOIN marks m
        ON sub.id = m.subject_id AND m.student_id = ? ORDER BY sub.subject_name""", (student["id"],)).fetchall()
    connection.close()

    entered = [row["marks"] for row in subjects if row["marks"] is not None]
    total = round(sum(entered), 2)
    maximum = len(subjects) * 100
    percentage = round((total / maximum) * 100, 2) if maximum else 0
    complete = len(subjects) > 0 and len(entered) == len(subjects)
    passed = complete and all(value >= 35 for value in entered)
    if not complete:
        status, grade = "Pending", "—"
    else:
        status = "Pass" if passed else "Fail"
        if percentage >= 90: grade = "A+"
        elif percentage >= 80: grade = "A"
        elif percentage >= 70: grade = "B"
        elif percentage >= 60: grade = "C"
        elif percentage >= 50: grade = "D"
        elif passed: grade = "E"
        else: grade = "F"

    return jsonify({
        "student": {"id": student["id"], "name": student["name"], "roll_number": student["roll_number"], "class_name": student["class_name"]},
        "subjects": [dict(row) for row in subjects],
        "total": total, "maximum": maximum, "percentage": percentage,
        "status": status, "grade": grade, "completed_subjects": len(entered), "total_subjects": len(subjects)
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
