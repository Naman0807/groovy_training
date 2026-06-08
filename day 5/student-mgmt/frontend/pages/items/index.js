import { useState, useEffect } from 'react';
import ItemList from '@/components/ItemList';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/items')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch items');
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h1 className="page-title">Items</h1>
      <ItemList items={items} />
    </div>
  );
}
