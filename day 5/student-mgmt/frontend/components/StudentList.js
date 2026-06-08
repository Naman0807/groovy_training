import Link from 'next/link';

export default function StudentList({ students }) {
  if (!students || students.length === 0) {
    return (
      <div className="empty">
        <p>No students found.</p>
        <Link href="/students/create" className="btn btn-primary mt-2" style={{ display: 'inline-block' }}>
          Add your first student
        </Link>
      </div>
    );
  }

  return (
    <div className="student-grid">
      {students.map((student) => (
        <div key={student.id} className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            <Link href={`/students/${student.id}`}>{student.name}</Link>
          </h2>
          <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            {student.email}
          </p>
          <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Roll: {student.roll_number}
          </p>
          {student.class && (
            <p className="text-muted" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Class: {student.class}
            </p>
          )}
          <small className="text-muted">
            Created: {new Date(student.created_at).toLocaleDateString()}
          </small>
        </div>
      ))}
    </div>
  );
}
