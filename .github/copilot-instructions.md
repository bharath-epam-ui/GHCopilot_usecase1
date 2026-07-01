# Project Context — kata-taskmanager

## What Is This Project

**kata-taskmanager** is a Next.js 14 full-stack Task Manager used as a GitHub Copilot Capstone Project target. It supports a complete **Agentic SDLC pipeline** — from reading a Jira story through requirements, architecture, design review, implementation, code review, verification, and PR — all driven by GitHub Copilot agents.

- **Live app:** `https://gh-copilot-usecase1.vercel.app`
- **GitHub Repo:** `https://github.com/bharath-epam-ui/GHCopilot_usecase1`
- **Jira Board:** `https://bharathwaj1390.atlassian.net/jira/software/projects/KT/boards/34/backlog`

---

## Agentic SDLC Pipeline

This project uses an **8-stage agent pipeline** where each agent is a `.md` file under `.github/agents/`. Agents appear in the GitHub Copilot Chat **Agents dropdown** automatically.

### How to Run

1. Open GitHub Copilot Chat in VS Code
2. Select an agent from the Agents dropdown (e.g. **01 - Requirements Agent**)
3. Provide the Jira story key when asked (e.g. `KT-11`)
4. Each agent reads its inputs, performs its task, and writes its output artifact to `docs/agentic-sdlc/artifacts/`
5. Proceed to the next agent in sequence

> Story keys are **never hardcoded** — any Jira story from the KT project works.

### Agent Stages

| # | Agent File | Input | Output Artifact |
|---|---|---|---|
| 1 | `01-requirements.md` | Jira story key (user input) | `artifacts/requirements.md` |
| 2 | `02-architecture.md` | `requirements.md` | `artifacts/architecture.md` |
| 3 | `03-design-review.md` | `architecture.md` | `artifacts/design-review.md` |
| 4 | `04-implementation-plan.md` | `architecture.md` + `design-review.md` | `artifacts/impl-plan.md` |
| 5 | `05-implementation.md` | `impl-plan.md` | Code changes + `artifacts/implementation-log.md` |
| 6 | `06-review.md` | Changed files + `requirements.md` | `artifacts/review-findings.md` |
| 7 | `07-verify.md` | `review-findings.md` | `artifacts/verification-report.md` |
| 8 | `08-pr.md` | All prior artifacts | `artifacts/pr-description.md` |

### Active Jira Stories

| Story | Key | URL | Status |
|---|---|---|---|
| Task Due Dates and Overdue Tracking | `KT-11` | https://bharathwaj1390.atlassian.net/browse/KT-11 | **Active — current sprint** |
| Task Search and Advanced Filtering | `KT-12` | https://bharathwaj1390.atlassian.net/browse/KT-12 | Backlog — future demo |

### Artifact Location

All stage outputs are written to `docs/agentic-sdlc/artifacts/`. These files are placeholders until the corresponding agent runs.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.30 |
| Language | TypeScript | 5+ |
| Runtime | Node.js | 20+ |
| UI | React | 18 |
| Styling | Tailwind CSS | 3.3 |
| Storage | Upstash Redis (production) / in-memory (local dev) | @upstash/redis 1.34.9 |
| Linting | ESLint + eslint-config-next | 8 / 14.2.0 |
| Hosting | Vercel | — |

---

## Project Structure

```text
kata-taskmanager/
├── .github/
│   ├── copilot-instructions.md      # This file — project-wide Copilot context
│   └── agents/                      # Agentic SDLC pipeline (appear in Agents dropdown)
│       ├── 01-requirements.md
│       ├── 02-architecture.md
│       ├── 03-design-review.md
│       ├── 04-implementation-plan.md
│       ├── 05-implementation.md
│       ├── 06-review.md
│       ├── 07-verify.md
│       └── 08-pr.md
├── app/                             # Next.js App Router
│   ├── page.tsx                     # Login page (route: /)
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global Tailwind styles
│   ├── dashboard/page.tsx           # Dashboard (task list + filters)
│   └── api/
│       ├── auth/login/route.ts      # POST /api/auth/login
│       ├── auth/logout/route.ts     # POST /api/auth/logout
│       └── tasks/
│           ├── route.ts             # GET /api/tasks, POST /api/tasks
│           └── [id]/route.ts        # GET/PUT/DELETE /api/tasks/:id
├── components/
│   ├── TaskCard.tsx                 # Task display card (edit/delete)
│   └── TaskForm.tsx                 # Create/edit task modal form
├── lib/
│   ├── store.ts                     # Data layer — Redis + in-memory fallback
│   └── types.ts                     # TypeScript interfaces (Task, User, ApiResponse)
├── docs/
│   ├── overview.md                  # App overview and flow descriptions
│   ├── build-howto.md               # Local setup guide
│   └── agentic-sdlc/
│       ├── README.md                # Pipeline usage guide
│       └── artifacts/               # Stage outputs (written by agents)
├── manual-tests/
│   └── test-cases.md                # 29 manual test cases (source of truth for testing)
└── specs/                           # Feature specs
```

---

## Build & Run

```bash
npm install           # Install dependencies
npm run dev           # Local dev (in-memory store, no Redis needed) → http://localhost:3000
npm run lint          # Run ESLint
npm run build         # Production build
npm start             # Start production server
```

---

## Environment Variables

All secrets live in `.env.local` (gitignored). Never commit real values.

```bash
# First-time setup — copy the template and fill in your values
cp .env.local .env.local
```

### Section 1 — App (Upstash Redis)

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `KV_REST_API_URL` | Production only | Vercel Dashboard → Settings → Env Vars |
| `KV_REST_API_TOKEN` | Production only | Vercel Dashboard → Settings → Env Vars |

Without these vars the app falls back to in-memory storage (local dev — data resets on restart).

### Section 2 — Jira (used by Agent 01 to fetch story details)

| Variable | Value | Description |
|----------|-------|-------------|
| `JIRA_BASE_URL` | `https://bharathwaj1390.atlassian.net` | Atlassian domain |
| `JIRA_EMAIL` | `bharathwaj1390@gmail.com` | Atlassian account email |
| `JIRA_API_TOKEN` | _(secret)_ | Generate at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_PROJECT_KEY` | `KT` | Project key from board URL |

### Section 3 — GitHub (used by Agent 08 to create the PR)

| Variable | Value | Description |
|----------|-------|-------------|
| `GITHUB_REPO_OWNER` | `bharath-epam-ui` | GitHub username or org |
| `GITHUB_REPO_NAME` | `GHCopilot_usecase1` | Repository name |
| `GITHUB_EMAIL` | _(your git email)_ | Commit author email |
| `GITHUB_TOKEN` | _(secret)_ | Generate at [github.com/settings/tokens](https://github.com/settings/tokens) — scopes: `repo`, `pull_requests` |

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Authenticate; receive Bearer token |
| POST | `/api/auth/logout` | Bearer | Invalidate token |
| GET | `/api/tasks` | Bearer | List tasks (`?status=` / `?assignee=` filters) |
| POST | `/api/tasks` | Bearer | Create a new task |
| GET | `/api/tasks/:id` | Bearer | Get single task by ID |
| PUT | `/api/tasks/:id` | Bearer | Update task fields |
| DELETE | `/api/tasks/:id` | Bearer | Delete task |

---

## Demo Credentials

| Username | Password | Name |
|----------|----------|------|
| admin | password123 | Admin User |
| user1 | test1234 | Test User |

---

## Key Conventions (Non-Negotiable for All Agents)

- **App Router only** — all pages under `app/`; client components declare `"use client"` at top
- **No breaking changes** — API routes, response shapes, and `data-testid` attributes must never change without explicit approval
- **Optional fields only** — any new field added to `Task` must be optional (`field?: type`); existing records must work without it
- **Data layer boundary** — all data operations go through `lib/store.ts`; never call Redis directly from route handlers
- **Seed task integrity** — tasks `t1`–`t5` in `lib/store.ts` must remain unchanged; they are referenced by manual test cases
- **Token auth** — Bearer tokens validated on every authenticated request via `store.validateToken()`
- **User isolation** — each user's tasks stored under `kata:tasks:<username>` in Redis
- **`data-testid` attributes** — all interactive elements carry `data-testid`; these are test automation anchors and must be preserved

---

## Task Entity (Current Schema)

```typescript
interface Task {
  id: string;           // UUID for created tasks; 't1'–'t5' for seed tasks
  title: string;        // required, non-empty
  description: string;  // optional, defaults to ''
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

---

## UI Selectors (`data-testid` Reference)

| Element | data-testid |
|---|---|
| Login form | `login-form` |
| Username input | `username-input` |
| Password input | `password-input` |
| Login button | `login-button` |
| Login error | `login-error` |
| Logged-in user | `logged-in-user` |
| Logout button | `logout-button` |
| Status filter bar | `status-filter` |
| Filter — All | `filter-all` |
| Filter — To Do | `filter-todo` |
| Filter — In Progress | `filter-in-progress` |
| Filter — Done | `filter-done` |
| Add task button | `add-task-button` |
| Task modal | `task-modal` |
| Task form | `task-form` |
| Task title input | `task-title-input` |
| Task description input | `task-description-input` |
| Task status select | `task-status-select` |
| Task priority select | `task-priority-select` |
| Task assignee input | `task-assignee-input` |
| Submit button | `task-submit-button` |
| Cancel button | `task-cancel-button` |
| Task form error | `task-form-error` |
| Task list | `task-list` |
| Task card | `task-card` |
| Task ID | `task-id` |
| Task title (card) | `task-title` |
| Task status (card) | `task-status` |
| Task priority (card) | `task-priority` |
| Task assignee (card) | `task-assignee` |
| Edit button | `edit-task-button` |
| Delete button | `delete-task-button` |
| Task count | `task-count` |
| Empty state | `empty-state` |
| Loading indicator | `loading-indicator` |
