import Link from 'next/link';
import { useRouter } from 'next/router';

function NavLink({ href, children }) {
  const router = useRouter();
  const isActive =
    href === '/'
      ? router.pathname === '/'
      : router.pathname.startsWith(href);

  return (
    <li>
      <Link href={href} className={`nav-link${isActive ? ' active' : ''}`}>
        {children}
      </Link>
    </li>
  );
}

export default function Layout({ children }) {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <svg
              className="nav-brand-icon"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 19.5V4.5C4 3.67157 4.67157 3 5.5 3H18.5C19.3284 3 20 3.67157 20 4.5V19.5C20 20.3284 19.3284 21 18.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 7H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 11H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 15H12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Student Management
          </Link>
          <nav>
            <ul className="nav-links">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/students">Students</NavLink>
              <NavLink href="/students/create">Add Student</NavLink>
            </ul>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {children}
      </main>
    </>
  );
}
