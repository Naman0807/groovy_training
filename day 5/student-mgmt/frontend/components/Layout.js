import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            Student Management
          </Link>
          <nav>
            <ul className="nav-links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/students">Students</Link>
              </li>
              <li>
                <Link href="/students/create">Add Student</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </>
  );
}
