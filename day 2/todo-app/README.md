# 📋 TODO App — Day 2: AI-IDE Deep Dive

**Trainee:** Naman  
**Date:** Tuesday, June 9, 2026  
**Theme:** Building a full-stack app entirely through AI prompting

> [!NOTE]
> This entire project was generated using Continue.dev + Claude 3.5 Sonnet.
> Zero lines of code were manually typed. Every file was produced by writing a prompt,
> reviewing the output, and applying it to the project.

---

## Screenshot

<!-- TODO: Insert screenshot here -->
<!-- ![App Screenshot](./screenshot.png) -->
<!-- Screenshot should show: running backend terminal (left), browser with TODO UI (right), 
     and Continue.dev panel in VS Code with the last prompt visible (bottom-left) -->

---

## Project Structure

```
todo-app/
├── backend/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.css
│       ├── App.js
│       └── index.js
└── README.md
```

---

## How to Run

### Backend

```bash
cd backend
npm install
npm start
# Server starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm start
# App opens on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint       | Description        |
| :----- | :------------- | :----------------- |
| GET    | `/todos`       | List all todos     |
| POST   | `/todos`       | Create a todo      |
| PUT    | `/todos/:id`   | Update a todo      |
| DELETE | `/todos/:id`   | Delete a todo      |

---

## Prompts Used

Below is every prompt I used to build this project, in chronological order.

| #  | Target File(s)         | Prompt                                                                                                                                                                                                                                                                                                 |
| :- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | `backend/package.json` | "Generate a package.json for a Node.js Express backend with CORS, dotenv, and a start script. API will run on port 3001."                                                                                                                                                                                |
| 2  | `backend/server.js`    | "Write a REST API server for a TODO app using Express. It should use CORS, read PORT from .env (default 3001). CRUD: GET /todos returns array, POST /todos accepts {title}, PUT /todos/:id toggles completed or updates title, DELETE /todos/:id removes. Use in-memory array with auto-increment id." |
| 3  | `backend/.env`         | "Create a .env file with PORT=3001 for the backend."                                                                                                                                                                                                                                                    |
| 4  | `frontend/package.json`| "Generate a React app package.json with proxy set to http://localhost:3001."                                                                                                                                                                                                                             |
| 5  | `frontend/public/index.html` | "Write a minimal public/index.html for a React TODO app. Title should be 'TODO App — Day 2 Project'."                                                                                                                                                                                            |
| 6  | `frontend/src/index.js` | "Write a standard React 18 entry point (index.js) that renders App inside StrictMode."                                                                                                                                                                                                                  |
| 7  | `frontend/src/App.js`  | "Write a React component that: fetches todos from GET /todos on mount, renders an add form with POST, toggles completion with PUT, and deletes with DELETE. Use fetch() calls to http://localhost:3001. Add loading and empty states."                                                                  |
| 8  | `frontend/src/App.css` | "Style the TODO app with a clean modern look. Card layout centered on page, purple accent color (#4f46e5), line-through for completed items, hover effects on delete button, responsive max-width 500px."                                                                                                |
| 9  | `README.md`            | "Create a README with project structure, setup instructions, API table, and a prompts table documenting all prompts used to build this app. Add a screenshot placeholder comment."                                                                                                                       |

---

## Git History

```bash
git init
git add .
git commit -m "Day 2: TODO app built entirely through AI prompts (Continue.dev + Claude 3.5 Sonnet)"

git remote add origin git@github.com:naman-groovy/day-2-todo-app.git
git push -u origin main
```

**Repo URL:** `https://github.com/naman-groovy/day-2-todo-app`  
**Shared on Slack:** `#day-2-submissions`

---

## Code Review Notes

**Reviewer:** Krunal (Senior Backend Dev)

### ✅ What AI did well

> "The validation on the POST endpoint — checking for empty/whitespace-only titles before insertion — was handled correctly without being prompted. The AI anticipated a real edge case that many junior devs miss on their first CRUD API."

### ❌ What AI failed at

> "The `proxy` field in `frontend/package.json` is set but the frontend still uses a hardcoded `http://localhost:3001` URL in `App.js`. This means the proxy isn't actually being used. In development, you should either remove the hardcoded URL and rely on the proxy, or remove the proxy config. This is a common inconsistency that AI tools generate — it works, but it's not clean."

---

## Daily Reflection

> [!TIP]
> **Biggest takeaway:** Prompting is like pair programming with a very fast, very literal junior dev. You have to be explicit about architecture decisions (proxy vs. hardcoded URLs) because the AI will happily generate "working" code with hidden inconsistencies. Reviewing AI output is now my most important skill — not writing the code.

### Stats

| Metric | Value |
| :----- | :---- |
| Lines of code written manually | 0 |
| Lines of code generated by AI | ~180 |
| Prompts written | 9 |
| Models tested | 1 (Claude 3.5 Sonnet) |
| Files created | 9 |
| Bugs caught in code review | 1 (proxy config inconsistency) |
| Time spent prompting + reviewing | ~45 min |
| Key takeaway | Review AI output like you'd review a junior's PR |
