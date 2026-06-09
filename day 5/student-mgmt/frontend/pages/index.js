import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-hero">
      <h1 className="page-title">Student Management System</h1>
      <p className="page-subtitle">
        A full-stack student management application built with Next.js, Node.js,
        and PostgreSQL. Add, edit, view, and manage student records.
      </p>
      <Link href="/students" className="btn btn-primary">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
        Manage Students
      </Link>

      <div className="home-features">
        <div className="home-feature">
          <svg
            className="home-feature-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <h3 className="home-feature-title">Student Records</h3>
          <p className="home-feature-desc">
            Maintain a complete directory of all students with key details
            including contact information, class, and roll numbers.
          </p>
        </div>

        <div className="home-feature">
          <svg
            className="home-feature-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <h3 className="home-feature-title">Easy Management</h3>
          <p className="home-feature-desc">
            Add new students, update existing records, or remove entries with a
            clean and intuitive interface.
          </p>
        </div>

        <div className="home-feature">
          <svg
            className="home-feature-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <h3 className="home-feature-title">Data Overview</h3>
          <p className="home-feature-desc">
            Quickly browse through all students at a glance, with creation dates
            and key information visible from the list view.
          </p>
        </div>
      </div>
    </div>
  );
}
