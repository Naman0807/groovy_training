import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ItemForm from '@/components/ItemForm';

export default function EditItem() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/items/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch item');
        return res.json();
      })
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (data) => {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update item');
    }

    router.push(`/items/${id}`);
  };

  if (loading) return <div className="loading">Loading item...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!item) return <div className="empty">Item not found.</div>;

  return (
    <div>
      <h1 className="page-title">Edit Item</h1>
      <ItemForm
        initialData={{ name: item.name, description: item.description }}
        onSubmit={handleSubmit}
        submitLabel="Update"
      />
    </div>
  );
}
