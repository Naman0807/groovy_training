import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function StudentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/students/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch student');
        return res.json();
      })
      .then((data) => {
        setStudent(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      router.push('/students');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Loading student...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!student) return <div className="empty">Student not found.</div>;

  return (
    <div>
      <h1 className="page-title">{student.name}</h1>
      <div className="card mb-4">
        <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {student.email}</p>
        <p style={{ marginBottom: '0.5rem' }}><strong>Roll Number:</strong> {student.roll_number}</p>
        {student.class && <p style={{ marginBottom: '0.5rem' }}><strong>Class:</strong> {student.class}</p>}
        {student.age && <p style={{ marginBottom: '0.5rem' }}><strong>Age:</strong> {student.age}</p>}
        {student.phone && <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {student.phone}</p>}
        {student.address && (
          <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}><strong>Address:</strong> {student.address}</p>
        )}
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          <p><strong>Created:</strong> {new Date(student.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(student.updated_at).toLocaleString()}</p>
        </div>
      </div>
      <div>
        <Link href={`/students/${id}/edit`} className="btn btn-primary">
          Edit
        </Link>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
