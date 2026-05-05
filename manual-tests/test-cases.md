# Manual Test Cases — Kata Task Manager

> These are the source test cases participants will convert into automation scripts using GitHub Copilot.
> App URL: https://kata-taskmanager.vercel.app

---

## Module 1: Authentication (UI)

### TC-UI-001: Successful Login
**Precondition:** User is on the login page
**Steps:**
1. Enter username: `admin`
2. Enter password: `password123`
3. Click **Sign In**

**Expected Result:** User is redirected to `/dashboard`. Username `Admin User` is visible in the header.

---

### TC-UI-002: Login with Invalid Credentials
**Precondition:** User is on the login page
**Steps:**
1. Enter username: `admin`
2. Enter password: `wrongpassword`
3. Click **Sign In**

**Expected Result:** Error message `Invalid credentials` is displayed. User remains on login page.

---

### TC-UI-003: Login with Empty Fields
**Precondition:** User is on the login page
**Steps:**
1. Leave username and password blank
2. Click **Sign In**

**Expected Result:** Browser validation prevents form submission. No API call is made.

---

### TC-UI-004: Successful Logout
**Precondition:** User is logged in and on the dashboard
**Steps:**
1. Click **Logout** in the header

**Expected Result:** User is redirected to login page `/`. Token is cleared from localStorage.

---

## Module 2: Task List & Filtering (UI)

### TC-UI-005: View All Tasks on Dashboard
**Precondition:** User is logged in
**Steps:**
1. Navigate to `/dashboard`

**Expected Result:** Task list is displayed. At least 5 seed tasks are visible. Task count shown at the bottom.

---

### TC-UI-006: Filter Tasks by Status — To Do
**Precondition:** User is on the dashboard
**Steps:**
1. Click the **To Do** filter button

**Expected Result:** Only tasks with status `To Do` are shown. Filter button is highlighted (blue).

---

### TC-UI-007: Filter Tasks by Status — In Progress
**Precondition:** User is on the dashboard
**Steps:**
1. Click the **In Progress** filter button

**Expected Result:** Only tasks with status `In Progress` are shown.

---

### TC-UI-008: Filter Tasks by Status — Done
**Precondition:** User is on the dashboard
**Steps:**
1. Click the **Done** filter button

**Expected Result:** Only tasks with status `Done` are shown.

---

### TC-UI-009: Reset Filter to All
**Precondition:** A status filter is active
**Steps:**
1. Click the **All** filter button

**Expected Result:** All tasks are displayed. Task count matches total seed data.

---

## Module 3: Task CRUD (UI)

### TC-UI-010: Create a New Task
**Precondition:** User is on the dashboard
**Steps:**
1. Click **+ Add Task**
2. Enter title: `Automate regression suite`
3. Enter description: `Use Playwright to automate all regression scenarios`
4. Set status: `In Progress`
5. Set priority: `High`
6. Enter assignee: `admin`
7. Click **Create Task**

**Expected Result:** Modal closes. New task `Automate regression suite` appears in the task list with correct status and priority badges.

---

### TC-UI-011: Create Task with Missing Title
**Precondition:** Task form modal is open
**Steps:**
1. Leave title empty
2. Fill all other fields
3. Click **Create Task**

**Expected Result:** Error message `Title is required` is shown. Task is not created.

---

### TC-UI-012: Edit an Existing Task
**Precondition:** At least one task exists on the dashboard
**Steps:**
1. Click **Edit** on any task card
2. Change the title to `Updated Task Title`
3. Change status to `Done`
4. Click **Update Task**

**Expected Result:** Modal closes. Task card reflects the updated title and `Done` status badge.

---

### TC-UI-013: Delete a Task
**Precondition:** At least one task exists on the dashboard
**Steps:**
1. Click **Delete** on any task card
2. Confirm the deletion in the browser dialog

**Expected Result:** Task is removed from the list. Task count decreases by 1.

---

### TC-UI-014: Cancel Task Form
**Precondition:** Task form modal is open
**Steps:**
1. Fill in the title field
2. Click **Cancel**

**Expected Result:** Modal closes. No task is created. Dashboard state is unchanged.

---

## Module 4: Authentication API

### TC-API-001: POST /api/auth/login — Valid Credentials
**Method:** `POST /api/auth/login`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{ "username": "admin", "password": "password123" }
```
**Expected Response:**
- Status: `200 OK`
- Body contains `data.token` (non-empty string)
- Body contains `data.username: "admin"`
- Body contains `message: "Login successful"`

---

### TC-API-002: POST /api/auth/login — Invalid Password
**Method:** `POST /api/auth/login`
**Body:**
```json
{ "username": "admin", "password": "wrongpass" }
```
**Expected Response:**
- Status: `401 Unauthorized`
- Body contains `error: "Invalid credentials"`

---

### TC-API-003: POST /api/auth/login — Missing Fields
**Method:** `POST /api/auth/login`
**Body:**
```json
{ "username": "admin" }
```
**Expected Response:**
- Status: `400 Bad Request`
- Body contains `error: "username and password are required"`

---

### TC-API-004: POST /api/auth/logout
**Method:** `POST /api/auth/logout`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- Body contains `message: "Logged out successfully"`

---

## Module 5: Tasks API

### TC-API-005: GET /api/tasks — Authenticated
**Method:** `GET /api/tasks`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- Body contains `data` array with at least 5 tasks
- Each task has: `id`, `title`, `description`, `status`, `priority`, `assignee`, `createdAt`, `updatedAt`

---

### TC-API-006: GET /api/tasks — Unauthenticated
**Method:** `GET /api/tasks`
**Headers:** _(no Authorization header)_
**Expected Response:**
- Status: `401 Unauthorized`
- Body contains `error: "Unauthorized"`

---

### TC-API-007: GET /api/tasks?status=todo
**Method:** `GET /api/tasks?status=todo`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- All tasks in `data` array have `status: "todo"`

---

### TC-API-008: GET /api/tasks?assignee=user1
**Method:** `GET /api/tasks?assignee=user1`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- All tasks in `data` array have `assignee: "user1"`

---

### TC-API-009: POST /api/tasks — Create Task
**Method:** `POST /api/tasks`
**Headers:** `Authorization: Bearer <valid-token>`, `Content-Type: application/json`
**Body:**
```json
{
  "title": "API test task",
  "description": "Created via REST Assured",
  "status": "todo",
  "priority": "high",
  "assignee": "admin"
}
```
**Expected Response:**
- Status: `201 Created`
- `data.id` is a non-empty string
- `data.title` equals `"API test task"`
- `data.status` equals `"todo"`
- `data.priority` equals `"high"`
- `message` equals `"Task created"`

---

### TC-API-010: POST /api/tasks — Missing Title
**Method:** `POST /api/tasks`
**Body:** `{ "description": "No title here" }`
**Expected Response:**
- Status: `400 Bad Request`
- Body contains `error: "title is required"`

---

### TC-API-011: GET /api/tasks/:id — Existing Task
**Method:** `GET /api/tasks/t1`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- `data.id` equals `"t1"`
- `data.title` is non-empty

---

### TC-API-012: GET /api/tasks/:id — Not Found
**Method:** `GET /api/tasks/nonexistent`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `404 Not Found`
- Body contains `error: "Task not found"`

---

### TC-API-013: PUT /api/tasks/:id — Update Task
**Method:** `PUT /api/tasks/t3`
**Headers:** `Authorization: Bearer <valid-token>`, `Content-Type: application/json`
**Body:**
```json
{ "status": "in-progress", "priority": "high" }
```
**Expected Response:**
- Status: `200 OK`
- `data.status` equals `"in-progress"`
- `data.priority` equals `"high"`
- `data.updatedAt` is more recent than original `createdAt`
- `message` equals `"Task updated"`

---

### TC-API-014: DELETE /api/tasks/:id — Delete Task
**Precondition:** Create a new task first, capture its `id`
**Method:** `DELETE /api/tasks/<id>`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `200 OK`
- Body contains `message: "Task deleted"`

**Verify:** `GET /api/tasks/<id>` returns `404` after deletion.

---

### TC-API-015: DELETE /api/tasks/:id — Not Found
**Method:** `DELETE /api/tasks/nonexistent`
**Headers:** `Authorization: Bearer <valid-token>`
**Expected Response:**
- Status: `404 Not Found`
- Body contains `error: "Task not found"`

---

## Summary Table

| ID | Module | Type | Priority |
|----|--------|------|----------|
| TC-UI-001 | Auth | UI | P1 |
| TC-UI-002 | Auth | UI | P1 |
| TC-UI-003 | Auth | UI | P2 |
| TC-UI-004 | Auth | UI | P1 |
| TC-UI-005 | Task List | UI | P1 |
| TC-UI-006 | Filter | UI | P1 |
| TC-UI-007 | Filter | UI | P2 |
| TC-UI-008 | Filter | UI | P2 |
| TC-UI-009 | Filter | UI | P2 |
| TC-UI-010 | Task CRUD | UI | P1 |
| TC-UI-011 | Task CRUD | UI | P1 |
| TC-UI-012 | Task CRUD | UI | P1 |
| TC-UI-013 | Task CRUD | UI | P1 |
| TC-UI-014 | Task CRUD | UI | P2 |
| TC-API-001 | Auth API | API | P1 |
| TC-API-002 | Auth API | API | P1 |
| TC-API-003 | Auth API | API | P2 |
| TC-API-004 | Auth API | API | P2 |
| TC-API-005 | Tasks API | API | P1 |
| TC-API-006 | Tasks API | API | P1 |
| TC-API-007 | Tasks API | API | P2 |
| TC-API-008 | Tasks API | API | P2 |
| TC-API-009 | Tasks API | API | P1 |
| TC-API-010 | Tasks API | API | P1 |
| TC-API-011 | Tasks API | API | P1 |
| TC-API-012 | Tasks API | API | P2 |
| TC-API-013 | Tasks API | API | P1 |
| TC-API-014 | Tasks API | API | P1 |
| TC-API-015 | Tasks API | API | P2 |

**Total: 29 test cases** | 14 UI | 15 API
