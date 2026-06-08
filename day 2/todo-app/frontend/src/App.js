import React, { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:3001";

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`${API}/todos`)
      .then((res) => res.json())
      .then(setTodos)
      .catch(console.error);
  }, []);

  function addTodo(e) {
    e.preventDefault();
    if (!title.trim()) return;
    fetch(`${API}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((todo) => {
        setTodos([...todos, todo]);
        setTitle("");
      })
      .catch(console.error);
  }

  function toggleTodo(id, completed) {
    fetch(`${API}/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    })
      .then((res) => res.json())
      .then((updated) =>
        setTodos(todos.map((t) => (t.id === updated.id ? updated : t)))
      )
      .catch(console.error);
  }

  function deleteTodo(id) {
    fetch(`${API}/todos/${id}`, { method: "DELETE" }).then(() =>
      setTodos(todos.filter((t) => t.id !== id))
    ).catch(console.error);
  }

  return (
    <div className="app">
      <h1>📋 TODO App</h1>
      <p className="subtitle">Built with AI prompts — Day 2</p>
      <form className="add-form" onSubmit={addTodo}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>
      <ul className="todo-list">
        {todos.length === 0 && (
          <li className="empty">No todos yet. Add one above!</li>
        )}
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "done" : ""}>
            <span onClick={() => toggleTodo(todo.id, todo.completed)}>
              {todo.completed ? "✅" : "◻️"} {todo.title}
            </span>
            <button className="delete" onClick={() => deleteTodo(todo.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
