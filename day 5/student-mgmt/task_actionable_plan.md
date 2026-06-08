# Student Management System - Actionable Implementation Plan

## System Overview
A full-stack Student Management application with a Node.js/Express backend, PostgreSQL database, and Next.js frontend. All files are created manually — no CLI init commands.

## Architecture

```
┌─────────────────┐      HTTP/JSON      ┌─────────────────┐      SQL      ┌──────────────┐
│   Next.js App   │  ◄──────────────►   │  Express API    │  ◄─────────►  │  PostgreSQL  │
│   (Pages Router)│                     │  (Node.js)      │               │              │
└─────────────────┘                     └─────────────────┘               └──────────────┘
```

## Data Model

### `students` Table
| Column      | Type                    | Constraints        |
|-------------|-------------------------|--------------------|
| id          | SERIAL                  | PRIMARY KEY        |
| name        | VARCHAR(255)            | NOT NULL           |
| email       | VARCHAR(255)            | NOT NULL, UNIQUE   |
| roll_number | VARCHAR(50)             | NOT NULL, UNIQUE   |
| class       | VARCHAR(50)             | NULLABLE           |
| age         | INTEGER                 | NULLABLE           |
| phone       | VARCHAR(20)             | NULLABLE           |
| address     | TEXT                    | NULLABLE           |
| created_at  | TIMESTAMP               | DEFAULT NOW()      |
| updated_at  | TIMESTAMP               | DEFAULT NOW()      |

## API Endpoints

| Method   | Endpoint               | Description          |
|----------|------------------------|----------------------|
| GET      | /api/students          | List all students    |
| GET      | /api/students/:id      | Get student by ID    |
| POST     | /api/students          | Create new student   |
| PUT      | /api/students/:id      | Update student       |
| DELETE   | /api/students/:id      | Delete student       |

## Project Structure

```
student-mgmt/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/students.js   # Student CRUD handlers
│   │   ├── middleware/errorHandler.js
│   │   ├── models/student.js         # Database queries + table init
│   │   ├── routes/students.js        # Express routes
│   │   └── index.js                  # Server entry point
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   └── package.json
├── frontend/
│   ├── components/
│   │   ├── Layout.js                 # Navigation + page wrapper
│   │   ├── StudentForm.js            # Reusable create/edit form
│   │   └── StudentList.js            # Student card grid component
│   ├── pages/
│   │   ├── _app.js
│   │   ├── index.js                  # Homepage
│   │   └── students/
│   │       ├── index.js              # List all students
│   │       ├── [id].js               # View single student
│   │       ├── create.js             # Add new student
│   │       └── [id]/edit.js          # Edit existing student
│   ├── styles/globals.css
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Task Breakdown

### TASK-01: Backend — Project Setup & Database Config
**Files:** `backend/package.json`, `backend/.env`, `backend/src/config/db.js`
- Create backend directory structure
- package.json with express, pg, cors, dotenv dependencies
- .env with DATABASE_URL and PORT
- db.js with pg Pool setup

### TASK-02: Backend — Model, Controller, Routes
**Files:** `backend/src/models/student.js`, `backend/src/controllers/students.js`, `backend/src/routes/students.js`, `backend/src/middleware/errorHandler.js`, `backend/src/index.js`
- Student model with SQL queries (getAll, getById, create, update, delete)
- Controller with CRUD handler functions
- Routes with Express Router
- Error handler middleware
- Main server entry point

### TASK-03: Frontend — Project Setup & Layout
**Files:** `frontend/package.json`, `frontend/next.config.js`, `frontend/pages/_app.js`, `frontend/components/Layout.js`, `frontend/styles/globals.css`
- package.json with next, react, react-dom
- Minimal next.config.js
- Custom _app.js with Layout wrapper
- Layout component with navigation

### TASK-04: Frontend — Pages & Components
**Files:** All under `frontend/pages/` and `frontend/components/`
- Index page with link to students
- Students list page (GET /api/students)
- Student detail page (GET /api/students/:id)
- Create student page with form (POST /api/students)
- Edit student page with form (PUT /api/students/:id)
- Delete button on detail page
- StudentForm reusable component
- StudentList reusable component

### TASK-05: Docker Configuration
**Files:** `docker-compose.yml`
- PostgreSQL service
- Backend service
- Frontend service
- Volume mounts for data persistence

### TASK-06: Root README
**Files:** `README.md`
- Project overview
- Setup instructions
- API documentation
- Docker usage

## Execution Order
1. TASK-01 (Backend setup)
2. TASK-02 (Backend logic) — depends on TASK-01
3. TASK-03 (Frontend setup)
4. TASK-04 (Frontend pages) — depends on TASK-03
5. TASK-05 (Docker) — can run in parallel with TASK-03/04
6. TASK-06 (README) — last
