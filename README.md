# Code Arena — Coding Competition Platform

A full-stack live coding competition platform with:
- **Paired sessions** — S01↔S02 share Q1, S03↔S04 share Q2, etc.
- **Auto-timeout** — when one session in a pair submits successfully, the paired session is instantly closed
- **Multi-language** — JavaScript runs natively; Python/Java/C++ via Judge0
- **Admin panel** — manage questions, test cases, sessions, timer and settings
- **CodeMirror editor** — syntax highlighting for all 4 languages
- **Configurable timer** — set globally in settings, starts when participant clicks "Start Timer"

---

## Project Structure

```
code-arena/
├── backend/          # Node.js / Express API
│   ├── server.js
│   ├── data/store.js       # In-memory data store
│   ├── middleware/auth.js  # Admin auth
│   └── routes/
│       ├── questions.js
│       ├── sessions.js
│       ├── submit.js       # Code execution + Judge0
│       └── admin.js
└── frontend/         # React app
    └── src/
        ├── pages/
        │   ├── HomePage.js
        │   ├── ParticipantPage.js
        │   ├── AdminPage.js
        │   └── AdminLoginPage.js
        ├── context/AdminContext.js
        └── utils/api.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
node server.js
# → http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## Default Credentials

- **Admin password:** `arena2024`

Change it in Admin → Settings after first login.

---

## How Sessions Work

Sessions are pre-created in pairs. Every pair shares the **same question**:

| Pair | Sessions | Question |
|------|----------|----------|
| 1    | S01, S02 | Q1       |
| 2    | S03, S04 | Q2       |
| 3    | S05, S06 | Q3       |

You can reassign questions to any pair from the Admin → Sessions tab.

**Auto-timeout rule:** When a participant submits and **all test cases pass**, their paired session is immediately closed with "Session Ended".

---

## Adding Questions

1. Go to Admin → Questions → **Add Question**
2. Fill in title, description, difficulty
3. Add starter code for each language
4. Add test cases (input → expected output, use `\n` for multiple lines)

---

## Judge0 Setup (Python / Java / C++)

JavaScript runs natively in Node.js. For other languages, set up Judge0:

### Option A — Self-hosted (free, unlimited)
```bash
git clone https://github.com/judge0/judge0
cd judge0
# follow setup at https://github.com/judge0/judge0#installation
```
Then in backend `.env`:
```
JUDGE0_URL=http://localhost:2358
```

### Option B — RapidAPI (free tier: 100 req/day)
Sign up at https://rapidapi.com/judge0-official/api/judge0-ce, then:
```
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_KEY=your_key_here
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sessions/:id` | — | Get session + question for participant |
| POST | `/api/submit/:sessionId` | — | Submit/run code |
| POST | `/api/admin/login` | — | Get admin token |
| GET | `/api/admin/dashboard` | Admin | Full stats + sessions |
| GET | `/api/questions/admin/full` | Admin | All questions with test cases |
| POST | `/api/questions` | Admin | Create question |
| PUT | `/api/questions/:id` | Admin | Update question |
| DELETE | `/api/questions/:id` | Admin | Delete question |
| POST | `/api/sessions/pair` | Admin | Add session pair |
| PATCH | `/api/sessions/:id` | Admin | Reset / timeout / reassign |
| PUT | `/api/admin/config` | Admin | Update timer / password |

Admin endpoints require header: `x-admin-token: <password>`

---

## Production Notes

- **Database:** Replace `data/store.js` with MongoDB/PostgreSQL for persistence across restarts
- **Security:** Add rate limiting, HTTPS, and a proper secret management system
- **Scaling:** The in-memory store means all state is lost on restart — use a database for production
