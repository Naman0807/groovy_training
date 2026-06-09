import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentForm from '@/components/StudentForm';
import Toast from '@/components/Toast';

export default function EditStudent() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

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

  const handleSubmit = async (data) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update student');
    }

    return res.json();
  };

  const handleSuccess = () => {
    setToast({ message: 'Student updated successfully!', type: 'success' });
    setTimeout(() => {
      router.push(`/students/${id}`);
    }, 1500);
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
    <div>
      <div className="page-header">
        <h1 className="page-title">Edit Student</h1>
      </div>
      <StudentForm
        initialData={{
          name: student.name,
          email: student.email,
          roll_number: student.roll_number,
          class: student.class,
          age: student.age,
          phone: student.phone,
          address: student.address,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update"
        onSuccess={handleSuccess}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
