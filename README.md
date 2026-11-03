# Student Result Management System

A full-stack academic result management application built with **React, Flask, SQLite, JWT, and role-based access control (RBAC)**.

## Roles and features

### Admin
- Dashboard counts for teachers, students, subjects, and published marks.
- Create, view, update, and delete teacher accounts.
- Create, view, update, and delete student accounts and academic profiles.
- Create, view, rename, and delete subjects.
- View all entered marks and update marks when required.

### Teacher
- View and update their own profile/password.
- View student directory and available subjects.
- Enter or update marks (0–100) for a student and subject.
- View only marks entered by their own account.

### Student
- View their own profile and academic result only.
- See subject-wise marks, total, percentage, grade, and pass/fail status.

## Important project rules
- The database is initialized with **exactly two configured Admin accounts**.
- No teacher or student demo accounts are inserted. Admins create them through the application.
- Admin accounts cannot be created or deleted through the UI/API. The two initial admin credentials are supplied through environment variables.
- Students can only retrieve their own results; the backend derives identity from the JWT rather than accepting a student ID from the browser.
- A subject is considered passed at 35/100. Overall result is Pass only when every configured subject has a mark and every mark is at least 35. If one or more subjects have no mark, the result is Pending.

## 1. Requirements
- Python 3.10+
- Node.js 20+
- npm

## 2. Configure the backend

Open a terminal in `backend`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env`. Change the secret and both admin passwords before running. The two admin login IDs and passwords are read from this file.

```env
SECRET_KEY=replace-with-a-long-random-secret
JWT_EXPIRY_HOURS=2
DATABASE_PATH=../data/srms.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN1_NAME=Primary Admin
ADMIN1_LOGIN_ID=admin1
ADMIN1_PASSWORD=ChangeThisAdmin1!2026
ADMIN2_NAME=Secondary Admin
ADMIN2_LOGIN_ID=admin2
ADMIN2_PASSWORD=ChangeThisAdmin2!2026
```

Run Flask:

```powershell
python app.py
```

Backend: `http://127.0.0.1:5000`

Health endpoint: `http://127.0.0.1:5000/`

## 3. Configure the frontend

Open a second terminal in `frontend`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

Set `VITE_API_URL` in `frontend/.env` if your backend is not running at `http://127.0.0.1:5000/api`.

## 4. Deployment

This repository includes a `render.yaml` blueprint for the Flask API with a persistent disk and `netlify.toml` for the React frontend.

### Backend on Render
1. Push this project to a GitHub repository. Do not commit `.env`, `srms.db`, or virtual environments.
2. In Render, create a Blueprint from the repository and review `render.yaml`.
3. Set the secret values for `SECRET_KEY`, both admin passwords, and the two login IDs/names in the Render environment settings. Use strong unique passwords.
4. Keep the persistent disk mounted at `/var/data`; the blueprint sets `DATABASE_PATH=/var/data/srms.db`.
5. After deployment, copy the backend service URL.

### Frontend on Netlify
1. Create a new Netlify site from the same GitHub repository.
2. Set the base directory to `frontend` and build command to `npm run build` (publish directory `dist`).
3. Set `VITE_API_URL` to `https://YOUR-BACKEND.onrender.com/api`.
4. Deploy the site and copy its URL.
5. Add the frontend URL to the backend's `CORS_ORIGINS` environment variable, comma-separated if there is more than one origin. Redeploy the backend after changing it.

### Deployment notes
- SQLite is suitable for a small portfolio/demo deployment when the backend has a persistent disk and only one backend instance. Do not scale this SQLite deployment to multiple instances. For larger production use, migrate to PostgreSQL.
- Use HTTPS, strong secrets, unique admin passwords, backups, and restricted CORS origins.
- The application uses bearer JWTs stored in browser localStorage to keep the portfolio setup straightforward. For a high-security production institution, prefer secure HttpOnly cookies with CSRF protection, audit logging, account recovery, and formal data-retention controls.

## 5. API overview

All protected routes require `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Authentication | `POST /api/auth/login`, `GET /api/auth/profile`, `PUT /api/auth/profile` |
| Admin dashboard | `GET /api/admin/dashboard` |
| Teachers | `GET/POST /api/admin/teachers`, `PUT/DELETE /api/admin/teachers/<user_id>` |
| Students | `GET/POST /api/admin/students`, `PUT/DELETE /api/admin/students/<user_id>` |
| Subjects | `GET/POST /api/admin/subjects`, `PUT/DELETE /api/admin/subjects/<subject_id>` |
| Admin marks | `GET /api/admin/marks`, `POST /api/admin/marks`, `PUT /api/admin/marks/<mark_id>` |
| Teacher | `GET /api/teacher/students`, `GET /api/teacher/subjects`, `GET /api/teacher/marks`, `POST /api/teacher/marks`, `PUT /api/teacher/marks/<mark_id>` |
| Student | `GET /api/student/results` |

## 6. Resume description

**Student Result Management System | React, Flask, SQLite, REST APIs, JWT**
- Built a full-stack role-based application for managing student records, subjects, and academic results across Admin, Teacher, and Student roles.
- Developed REST APIs with Flask and SQLite for user management, subject administration, and marks entry, with JWT authentication and server-side role authorization.
- Implemented React dashboards for administrative CRUD operations, teacher marks management, and student-specific result summaries with totals, percentages, grades, and pass/fail status.

Only add deployment URLs and claim successful deployment after you have deployed and verified the live application yourself.
