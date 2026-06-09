import { useState } from 'react';
import { useRouter } from 'next/router';
import StudentForm from '@/components/StudentForm';
import Toast from '@/components/Toast';

export default function CreateStudent() {
  const router = useRouter();
  const [toast, setToast] = useState(null);

  const handleSubmit = async (data) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create student');
    }

    return res.json();
  };

  const handleSuccess = () => {
    setToast({ message: 'Student created successfully!', type: 'success' });
    setTimeout(() => {
      router.push('/students');
    }, 1500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add Student</h1>
      </div>
      <StudentForm onSubmit={handleSubmit} submitLabel="Create" onSuccess={handleSuccess} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
