# Kata Task Manager

A purpose-built web app for the **GitHub Copilot Test Automation Kata**.

Participants use GitHub Copilot to convert manual test cases into automation scripts (Playwright/Selenium + REST Assured).

---

## Live App

> Deploy to Vercel (see below) and replace this URL:
> **https://kata-taskmanager.vercel.app**

---

## Demo Credentials

| Username | Password    | Role  |
|----------|-------------|-------|
| admin    | password123 | Admin |
| user1    | test1234    | User  |

---

## API Reference

Base URL: `https://kata-taskmanager.vercel.app`

### Auth

| Method | Endpoint            | Auth Required | Description     |
|--------|---------------------|---------------|-----------------|
| POST   | /api/auth/login     | No            | Login, get token |
| POST   | /api/auth/logout    | Yes           | Invalidate token |

**Login request:**
```json
POST /api/auth/login
{ "username": "admin", "password": "password123" }
```
**Login response:**
```json
{ "data": { "token": "<bearer-token>", "username": "admin", "name": "Admin User" }, "message": "Login successful" }
```

### Tasks

All task endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | /api/tasks        | List all tasks (supports ?status= and ?assignee= filters) |
| POST   | /api/tasks        | Create a task                        |
| GET    | /api/tasks/:id    | Get task by ID                       |
| PUT    | /api/tasks/:id    | Update task                          |
| DELETE | /api/tasks/:id    | Delete task                          |

**Task object:**
```json
{
  "id": "t1",
  "title": "Design login page",
  "description": "Create wireframes and implement the login UI",
  "status": "done",
  "priority": "high",
  "assignee": "admin",
  "createdAt": "2024-01-01T09:00:00Z",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Status values:** `todo` | `in-progress` | `done`
**Priority values:** `low` | `medium` | `high`

---

### Sample Requests

> Replace `<token>` with the value returned by `/api/auth/login`.

#### GET /api/tasks — List all tasks
```
GET http://localhost:3000/api/tasks
Authorization: Bearer <token>
```
**Response `200`:**
```json
{
  "data": [
    { "id": "t1", "title": "Design login page", "status": "done", "priority": "high", "assignee": "admin", ... },
    { "id": "t2", "title": "Implement task API", "status": "in-progress", "priority": "high", "assignee": "user1", ... }
  ]
}
```

#### GET /api/tasks?status=todo — Filter by status
```
GET http://localhost:3000/api/tasks?status=todo
Authorization: Bearer <token>
```

#### GET /api/tasks?assignee=user1 — Filter by assignee
```
GET http://localhost:3000/api/tasks?assignee=user1
Authorization: Bearer <token>
```

#### GET /api/tasks/:id — Get task by ID
```
GET http://localhost:3000/api/tasks/t1
Authorization: Bearer <token>
```
**Response `200`:**
```json
{ "data": { "id": "t1", "title": "Design login page", "status": "done", ... } }
```
**Response `404` (not found):**
```json
{ "error": "Task not found" }
```

#### POST /api/tasks — Create a task
```
POST http://localhost:3000/api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Automate regression suite",
  "description": "Use Playwright to automate all regression scenarios",
  "status": "todo",
  "priority": "high",
  "assignee": "admin"
}
```
**Response `201`:**
```json
{ "data": { "id": "t1234567890", "title": "Automate regression suite", ... }, "message": "Task created" }
```
**Response `400` (missing title):**
```json
{ "error": "title is required" }
```

#### PUT /api/tasks/:id — Update a task
```
PUT http://localhost:3000/api/tasks/t3
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "done",
  "priority": "high"
}
```
> All fields are optional — only send what you want to change.

**Response `200`:**
```json
{ "data": { "id": "t3", "status": "done", "priority": "high", ... }, "message": "Task updated" }
```

#### DELETE /api/tasks/:id — Delete a task
```
DELETE http://localhost:3000/api/tasks/t3
Authorization: Bearer <token>
```
**Response `200`:**
```json
{ "message": "Task deleted" }
```
**Response `404` (not found):**
```json
{ "error": "Task not found" }
```

---

## Key UI Elements (data-testid attributes)

Use these in your Playwright/Selenium selectors:

| Element                | data-testid              |
|------------------------|--------------------------|
| Login form             | `login-form`             |
| Username input         | `username-input`         |
| Password input         | `password-input`         |
| Login button           | `login-button`           |
| Login error message    | `login-error`            |
| Logged-in username     | `logged-in-user`         |
| Logout button          | `logout-button`          |
| Status filter bar      | `status-filter`          |
| Filter button (All)    | `filter-all`             |
| Filter button (To Do)  | `filter-todo`            |
| Filter (In Progress)   | `filter-in-progress`     |
| Filter (Done)          | `filter-done`            |
| Add task button        | `add-task-button`        |
| Task modal             | `task-modal`             |
| Task form              | `task-form`              |
| Task title input       | `task-title-input`       |
| Task description input | `task-description-input` |
| Task status select     | `task-status-select`     |
| Task priority select   | `task-priority-select`   |
| Task assignee input    | `task-assignee-input`    |
| Submit task button     | `task-submit-button`     |
| Cancel task button     | `task-cancel-button`     |
| Task form error        | `task-form-error`        |
| Task list container    | `task-list`              |
| Task card              | `task-card`              |
| Task title (card)      | `task-title`             |
| Task status (card)     | `task-status`            |
| Task priority (card)   | `task-priority`          |
| Task assignee (card)   | `task-assignee`          |
| Edit task button       | `edit-task-button`       |
| Delete task button     | `delete-task-button`     |
| Task count             | `task-count`             |
| Empty state message    | `empty-state`            |
| Loading indicator      | `loading-indicator`      |

---

## Local Setup

```bash
# 1. Install dependencies
cd kata-taskmanager
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel at https://vercel.com/new for automatic deploys on push.

---

## Kata Challenge Instructions

### Time Box: 90 minutes

### What You Will Build

Using **GitHub Copilot**, convert the manual test cases in `manual-tests/test-cases.md` into automated test scripts.

### Deliverables

| Track | Tool | Test Cases to Automate |
|-------|------|------------------------|
| UI    | Playwright (TypeScript) or Selenium (Java) | TC-UI-001 to TC-UI-014 |
| API   | REST Assured (Java) or Playwright API | TC-API-001 to TC-API-015 |

### Suggested Copilot Prompts to Try

```
// Generate a Page Object for the Login page using Playwright
// Write a REST Assured test for POST /api/auth/login with valid credentials
// Generate assertions for the task list response schema
// Add a data-driven test for login with invalid credentials
// Write a Playwright test that creates a task and verifies it appears in the list
```

### Scoring Rubric

| Criteria | Points |
|----------|--------|
| Tests pass against live app | 40 |
| Page Object pattern used | 20 |
| Assertions are meaningful (not just status code) | 20 |
| Copilot used effectively (show prompts in comments) | 20 |

---

## Project Structure

```
kata-taskmanager/
├── app/
│   ├── page.tsx               # Login page
│   ├── dashboard/page.tsx     # Task dashboard
│   └── api/
│       ├── auth/login/        # POST /api/auth/login
│       ├── auth/logout/       # POST /api/auth/logout
│       └── tasks/             # GET, POST /api/tasks
│           └── [id]/          # GET, PUT, DELETE /api/tasks/:id
├── components/
│   ├── TaskCard.tsx
│   └── TaskForm.tsx
├── lib/
│   ├── store.ts               # In-memory data store
│   └── types.ts               # TypeScript types
└── manual-tests/
    └── test-cases.md          # 29 manual test cases for the Kata
```
