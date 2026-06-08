import { useRouter } from 'next/router';
import ItemForm from '@/components/ItemForm';

export default function CreateItem() {
  const router = useRouter();

  const handleSubmit = async (data) => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create item');
    }

    router.push('/items');
  };

  return (
    <div>
      <h1 className="page-title">Create Item</h1>
      <ItemForm onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}
