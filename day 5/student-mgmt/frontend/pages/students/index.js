import { useState, useEffect, useCallback } from 'react';
import StudentList from '@/components/StudentList';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = useCallback(() => {
    setLoading(true);
    setError('');

    fetch('/api/students')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
      })
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: '0.25rem' }}>Unable to load students</p>
        <p style={{ maxWidth: 360, lineHeight: 'var(--leading-normal)' }}>
          The server may be offline. Please try again.
        </p>
        <button className="btn btn-primary mt-2" onClick={fetchStudents}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Students
          <span className="count-badge">{students.length}</span>
        </h1>
      </div>
      <StudentList students={students} />
    </div>
  );
}
