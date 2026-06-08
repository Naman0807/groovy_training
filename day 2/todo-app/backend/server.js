const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let todos = [];
let nextId = 1;

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const todo = { id: nextId++, title: title.trim(), completed: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  if (req.body.title !== undefined) {
    if (!req.body.title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    todo.title = req.body.title.trim();
  }
  if (req.body.completed !== undefined) {
    todo.completed = req.body.completed;
  }
  res.json(todo);
});

app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  todos.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`TODO API running on http://localhost:${PORT}`);
});
