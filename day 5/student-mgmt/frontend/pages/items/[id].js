import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ItemDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      router.push('/items');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Loading item...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!item) return <div className="empty">Item not found.</div>;

  return (
    <div>
      <h1 className="page-title">{item.name}</h1>
      <div className="card mb-4">
        <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
          {item.description || <span className="text-muted">No description</span>}
        </p>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          <p><strong>Created:</strong> {new Date(item.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(item.updated_at).toLocaleString()}</p>
        </div>
      </div>
      <div>
        <Link href={`/items/${id}/edit`} className="btn btn-primary">
          Edit
        </Link>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
