import Link from 'next/link';

export default function StudentList({ students }) {
  if (!students || students.length === 0) {
    return (
      <div className="empty">
        <svg
          className="empty-icon"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <p>No students found.</p>
        <Link href="/students/create" className="btn btn-primary mt-2">
          Add your first student
        </Link>
      </div>
    );
  }

  return (
    <div className="student-grid" aria-label="Student list" role="list">
      {students.map((student) => (
        <div key={student.id} className="card" tabIndex="0" role="listitem">
          <h2 className="card-title">
            <Link href={`/students/${student.id}`}>{student.name}</Link>
          </h2>
          <p className="card-text">{student.email}</p>
          <p className="card-text">Roll: {student.roll_number}</p>
          {student.class && (
            <p className="card-text">Class: {student.class}</p>
          )}
          <div className="card-meta">
            Created: {new Date(student.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
