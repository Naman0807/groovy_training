import React, { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:3001";

// ---- Inline SVG Icon Components ----

function ClipboardIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function CheckboxUnchecked() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
    </svg>
  );
}

function CheckboxChecked() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        ry="4"
        fill="#10b981"
        fillOpacity="0.12"
      />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function TrashIcon() {
  return (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" />
    </svg>
  );
}

function RetryIcon() {
  return (
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
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="20"
        y="8"
        width="40"
        height="50"
        rx="6"
        stroke="#a5b4fc"
        strokeWidth="2.5"
        fill="#eef2ff"
      />
      <rect x="28" y="18" width="24" height="3" rx="1.5" fill="#c7d2fe" />
      <rect x="28" y="26" width="24" height="3" rx="1.5" fill="#c7d2fe" />
      <rect x="28" y="34" width="16" height="3" rx="1.5" fill="#c7d2fe" />
      <path
        d="M32 44l4 4 8-8"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="60" r="14" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="2" />
      <path
        d="M54 60l4 4 8-8"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- App Component ----

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    fetchTodos();
  }, []);

  // ---------- Data fetching ----------

  function fetchTodos() {
    setLoading(true);
    setError(null);
    fetch(`${API}/todos`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch todos");
        return res.json();
      })
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch(() => {
        setError(
          "Could not connect to the server. Please ensure the backend is running."
        );
        setLoading(false);
      });
  }

  function addTodo(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    fetch(`${API}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add todo");
        return res.json();
      })
      .then((todo) => {
        setTodos((prev) => [...prev, todo]);
        setTitle("");
        setSubmitting(false);
      })
      .catch(() => {
        setError("Failed to add todo. Please try again.");
        setSubmitting(false);
      });
  }

  function toggleTodo(id, completed) {
    setError(null);
    fetch(`${API}/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update todo");
        return res.json();
      })
      .then((updated) =>
        setTodos((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        )
      )
      .catch(() => {
        setError("Failed to update todo. Please try again.");
      });
  }

  function handleDelete(id) {
    setDeletingIds((prev) => new Set([...prev, id]));
    fetch(`${API}/todos/${id}`, { method: "DELETE" })
      .then(() => {
        // Wait for fade-out animation before removing from DOM
        setTimeout(() => {
          setTodos((prev) => prev.filter((t) => t.id !== id));
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 300);
      })
      .catch(() => {
        setError("Failed to delete todo. Please try again.");
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }

  // ---------- Render ----------

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-icon">
          <ClipboardIcon />
        </div>
        <h1>TODO App</h1>
        <p className="subtitle">Day 2 &mdash; React &amp; Express</p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="retry-btn" onClick={fetchTodos}>
            <RetryIcon /> Retry
          </button>
        </div>
      )}

      {/* Add form */}
      <form className="add-form" onSubmit={addTodo}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !title.trim()}>
          {submitting && <SpinnerIcon />}
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="skeleton-list" aria-label="Loading todos">
          {[1, 2, 3].map((i) => (
            <div className="skeleton-item" key={i}>
              <div className="skeleton-checkbox" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && todos.length === 0 && (
        <div className="empty-state">
          <EmptyStateIcon />
          <p>No todos yet. Add one above!</p>
        </div>
      )}

      {/* Todo list */}
      {!loading && todos.length > 0 && (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={
                "todo-item" +
                (todo.completed ? " done" : "") +
                (deletingIds.has(todo.id) ? " deleting" : "")
              }
            >
              <span
                className="todo-checkbox"
                onClick={() => toggleTodo(todo.id, todo.completed)}
                role="checkbox"
                aria-checked={todo.completed}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTodo(todo.id, todo.completed);
                  }
                }}
              >
                {todo.completed ? <CheckboxChecked /> : <CheckboxUnchecked />}
              </span>
              <span
                className="todo-text"
                onClick={() => toggleTodo(todo.id, todo.completed)}
              >
                {todo.title}
              </span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(todo.id)}
                title="Delete todo"
                aria-label={`Delete "${todo.title}"`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="app-footer">
        <p>Day 2 Project &mdash; Built with React &amp; Express</p>
      </footer>
    </div>
  );
}

export default App;
