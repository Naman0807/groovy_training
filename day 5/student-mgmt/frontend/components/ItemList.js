import Link from 'next/link';

export default function ItemList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty">
        <p>No items found.</p>
        <Link href="/items/create" className="btn btn-primary mt-2" style={{ display: 'inline-block' }}>
          Create your first item
        </Link>
      </div>
    );
  }

  return (
    <div className="item-grid">
      {items.map((item) => (
        <div key={item.id} className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            <Link href={`/items/${item.id}`}>{item.name}</Link>
          </h2>
          <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
            {item.description
              ? item.description.length > 120
                ? item.description.substring(0, 120) + '...'
                : item.description
              : 'No description'}
          </p>
          <small className="text-muted">
            Created: {new Date(item.created_at).toLocaleDateString()}
          </small>
        </div>
      ))}
    </div>
  );
}
