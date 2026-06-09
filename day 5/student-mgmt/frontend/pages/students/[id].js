import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

export default function StudentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchStudent = () => {
    if (!id) return;
    setLoading(true);
    setError('');

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
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      setToast({ message: 'Student deleted successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/students');
      }, 1500);
    } catch (err) {
      setToast({ message: 'Failed to delete student. Please try again.', type: 'error' });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading student...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Error: {error}</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="empty">
        <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>Student not found.</p>
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <div className="breadcrumb">
        <Link href="/students">Back to Students</Link>
        <svg className="breadcrumb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>{student.name}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{student.name}</h1>
      </div>

      <div className="card mb-4">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Email</span>
            <span className="detail-value">{student.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Roll Number</span>
            <span className="detail-value">{student.roll_number}</span>
          </div>
          {student.class && (
            <div className="detail-field">
              <span className="detail-label">Class</span>
              <span className="detail-value">{student.class}</span>
            </div>
          )}
          {student.age && (
            <div className="detail-field">
              <span className="detail-label">Age</span>
              <span className="detail-value">{student.age}</span>
            </div>
          )}
          {student.phone && (
            <div className="detail-field">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{student.phone}</span>
            </div>
          )}
          {student.address && (
            <div className="detail-field detail-field-full">
              <span className="detail-label">Address</span>
              <span className="detail-value address">{student.address}</span>
            </div>
          )}
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span className="detail-meta-label">Created</span>
              <span className="detail-meta-value">
                {new Date(student.created_at).toLocaleString()}
              </span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">Updated</span>
              <span className="detail-meta-value">
                {new Date(student.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <Link href={`/students/${id}/edit`} className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </Link>
        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
