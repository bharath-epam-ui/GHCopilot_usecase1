# GitHub Copilot Kata — Task Manager

**Use Case 1: Test Automation Script Creation (UI / API)**

Convert the manual test cases in `manual-tests/test-cases.md` into automation scripts using GitHub Copilot.

---

## Live App

**https://gh-copilot-usecase1.vercel.app**

---

## Demo Credentials

| Username | Password     |
|----------|-------------|
| admin    | password123 |
| user1    | test1234    |

> Each user has their own isolated set of tasks. Data you create, edit, or delete only affects your own session.

---

## Kata Challenge

### Objective
Using **GitHub Copilot**, convert the manual test cases in `manual-tests/test-cases.md` into automated test scripts.

### Deliverables

| Track | Recommended Tool              | Test Cases               |
|-------|-------------------------------|--------------------------|
| UI    | Playwright (TS) or Selenium (Java) | TC-UI-001 → TC-UI-014   |
| API   | REST Assured (Java) or Playwright API | TC-API-001 → TC-API-015 |

---

## API Reference

Base URL: `https://gh-copilot-usecase1.vercel.app`

All task endpoints require an `Authorization: Bearer <token>` header.
Obtain the token by calling the login endpoint first.

---

### POST /api/auth/login

**No auth required.**

**Request:**
```
POST https://gh-copilot-usecase1.vercel.app/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "data": {
    "token": "<bearer-token>",
    "username": "admin",
    "name": "Admin User"
  },
  "message": "Login successful"
}
```

**Response 400** — missing fields:
```json
{ "error": "username and password are required" }
```

**Response 401** — wrong credentials:
```json
{ "error": "Invalid credentials" }
```

---

### POST /api/auth/logout

**Request:**
```
POST https://gh-copilot-usecase1.vercel.app/api/auth/logout
Authorization: Bearer <token>
```

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### GET /api/tasks — List all tasks

**Request:**
```
GET https://gh-copilot-usecase1.vercel.app/api/tasks
Authorization: Bearer <token>
```

**With filters (optional):**
```
GET /api/tasks?status=todo
GET /api/tasks?status=in-progress
GET /api/tasks?status=done
GET /api/tasks?assignee=admin
```

**Response 200:**
```json
{
  "data": [
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
  ]
}
```

**Response 401** — missing or invalid token:
```json
{ "error": "Unauthorized" }
```

---

### GET /api/tasks/:id — Get task by ID

> Task IDs are visible on each task card in the UI (e.g. `t1`, `t2`).

**Request:**
```
GET https://gh-copilot-usecase1.vercel.app/api/tasks/t1
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": {
    "id": "t1",
    "title": "Design login page",
    "status": "done",
    "priority": "high",
    "assignee": "admin",
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-02T10:00:00Z"
  }
}
```

**Response 404:**
```json
{ "error": "Task not found" }
```

---

### POST /api/tasks — Create a task

**Request:**
```
POST https://gh-copilot-usecase1.vercel.app/api/tasks
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

> `description` and `assignee` are optional. Default status: `todo`. Default priority: `medium`.

**Response 201:**
```json
{
  "data": {
    "id": "3f2a1b4c-...",
    "title": "Automate regression suite",
    "status": "todo",
    "priority": "high",
    "assignee": "admin",
    "createdAt": "2024-01-06T10:00:00Z",
    "updatedAt": "2024-01-06T10:00:00Z"
  },
  "message": "Task created"
}
```

**Response 400** — missing title:
```json
{ "error": "title is required" }
```

---

### PUT /api/tasks/:id — Update a task

> Only include the fields you want to change.

**Request:**
```
PUT https://gh-copilot-usecase1.vercel.app/api/tasks/t3
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "done",
  "priority": "high"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "t3",
    "title": "Write unit tests",
    "status": "done",
    "priority": "high",
    "assignee": "user1",
    "createdAt": "2024-01-03T09:00:00Z",
    "updatedAt": "2024-01-06T11:00:00Z"
  },
  "message": "Task updated"
}
```

**Response 404:**
```json
{ "error": "Task not found" }
```

---

### DELETE /api/tasks/:id — Delete a task

**Request:**
```
DELETE https://gh-copilot-usecase1.vercel.app/api/tasks/t3
Authorization: Bearer <token>
```

**Response 200:**
```json
{ "message": "Task deleted" }
```

**Response 404:**
```json
{ "error": "Task not found" }
```

---

## Field Reference

**Status values:** `todo` | `in-progress` | `done`

**Priority values:** `low` | `medium` | `high`

---

## UI Selectors (`data-testid` attributes)

Use these in your Playwright / Selenium locators.

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
| Filter — All           | `filter-all`             |
| Filter — To Do         | `filter-todo`            |
| Filter — In Progress   | `filter-in-progress`     |
| Filter — Done          | `filter-done`            |
| Add task button        | `add-task-button`        |
| Task modal             | `task-modal`             |
| Task form              | `task-form`              |
| Task title input       | `task-title-input`       |
| Task description input | `task-description-input` |
| Task status select     | `task-status-select`     |
| Task priority select   | `task-priority-select`   |
| Task assignee input    | `task-assignee-input`    |
| Submit button          | `task-submit-button`     |
| Cancel button          | `task-cancel-button`     |
| Task form error        | `task-form-error`        |
| Task list container    | `task-list`              |
| Task card              | `task-card`              |
| Task ID (on card)      | `task-id`                |
| Task title (on card)   | `task-title`             |
| Task status (on card)  | `task-status`            |
| Task priority (on card)| `task-priority`          |
| Task assignee (on card)| `task-assignee`          |
| Edit button            | `edit-task-button`       |
| Delete button          | `delete-task-button`     |
| Task count             | `task-count`             |
| Empty state message    | `empty-state`            |
| Loading indicator      | `loading-indicator`      |
