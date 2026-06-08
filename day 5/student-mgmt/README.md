# Student Management System

A full-stack Student Management application built with **Next.js**, **Node.js/Express**, and **PostgreSQL**. Supports creating, viewing, updating, and deleting student records.

## Tech Stack

| Layer    | Technology            |
|----------|-----------------------|
| Frontend | Next.js 14 (Pages Router) |
| Backend  | Node.js + Express.js  |
| Database | PostgreSQL 16         |
| Container| Docker + Compose      |

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

## Getting Started

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** 16+
- **npm** or **yarn**

### Option 1: Run Locally

#### 1. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE student_db;
```

#### 2. Backend Setup
```bash
cd backend
npm install
# Edit .env if needed (default: postgresql://postgres:postgres@localhost:5432/student_db)
npm run dev
```
The API will start on **http://localhost:5000**

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The UI will be available at **http://localhost:3000**

### Option 2: Run with Docker

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

Access the app at **http://localhost:3000**

## API Reference

All endpoints are prefixed with `/api/students`.

| Method   | Endpoint              | Description            | Request Body                                                     | Response          |
|----------|-----------------------|------------------------|------------------------------------------------------------------|-------------------|
| `GET`    | `/api/students`       | List all students      | —                                                                | `Student[]`       |
| `GET`    | `/api/students/:id`   | Get student by ID      | —                                                                | `Student`         |
| `POST`   | `/api/students`       | Create a new student   | `{ "name": "...", "email": "...", "roll_number": "...", ... }`   | `Student` (201)   |
| `PUT`    | `/api/students/:id`   | Update a student       | `{ "name": "...", "email": "...", "roll_number": "...", ... }`   | `Student`         |
| `DELETE` | `/api/students/:id`   | Delete a student       | —                                                                | `204 No Content`  |

### Student Schema
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "roll_number": "S12345",
  "class": "10th Grade",
  "age": 16,
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "created_at": "2026-06-08T12:00:00.000Z",
  "updated_at": "2026-06-08T12:00:00.000Z"
}
```

## Features
- ✅ Add new students with name, email, roll number, and more
- ✅ View a list of all students
- ✅ View detailed information about a single student
- ✅ Update existing student records
- ✅ Delete student records with confirmation
- ✅ Responsive design
- ✅ Client-side form validation
- ✅ Loading, empty, and error states
- ✅ Docker containerization
- ✅ RESTful API design

## License
MIT
