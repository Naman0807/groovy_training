import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
      <h1 className="page-title">Student Management System</h1>
      <p className="text-muted mb-4" style={{ fontSize: '1.125rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        A full-stack student management application built with Next.js, Node.js, and PostgreSQL.
      </p>
      <Link href="/students" className="btn btn-primary">
        Manage Students
      </Link>
    </div>
  );
}
