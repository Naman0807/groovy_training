import { useRouter } from 'next/router';
import StudentForm from '@/components/StudentForm';

export default function CreateStudent() {
  const router = useRouter();

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

    router.push('/students');
  };

  return (
    <div>
      <h1 className="page-title">Add Student</h1>
      <StudentForm onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}
