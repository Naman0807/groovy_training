import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentForm from '@/components/StudentForm';

export default function EditStudent() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    router.push(`/students/${id}`);
  };

  if (loading) return <div className="loading">Loading student...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!student) return <div className="empty">Student not found.</div>;

  return (
    <div>
      <h1 className="page-title">Edit Student</h1>
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
      />
    </div>
  );
}
