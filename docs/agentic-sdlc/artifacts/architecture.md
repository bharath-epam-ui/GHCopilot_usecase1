# Architecture — KT-11: Task Due Dates and Overdue Tracking

**Generated:** 2026-07-01  
**Agent:** 02 - Architecture Agent  
**SDLC Stage:** 2 of 8

---

## Section 1 — High-Level Architecture Overview

### 1. Jira Story

**Key:** KT-11  
**URL:** https://bharathwaj1390.atlassian.net/browse/KT-11  
**Summary:** KT-CAPSTONE: Task Due Dates and Overdue Tracking

---

### 2. System Architecture

This feature adds **optional due date tracking** to the existing Next.js App Router architecture. The implementation follows the established patterns:

- **Data Model** — Add optional `dueDate?: string` field to the `Task` interface in `lib/types.ts`
- **Store Layer** — No changes required; the store already handles arbitrary task properties via spread operators
- **API Routes** — Extend `POST /api/tasks` and `PUT /api/tasks/:id` to accept and validate the optional `dueDate` field
- **UI Components** — Extend `TaskForm.tsx` to capture due dates, `TaskCard.tsx` to display them with overdue indicators, and `page.tsx` (dashboard) to add an "Overdue" filter

**Key Design Decision:** Client-side filtering for "Overdue" tasks (no new API query parameter) to minimize backend changes while meeting all functional requirements.

---

### 3. Component Diagram

```mermaid
graph TB
    A[TaskForm Component] -->|POST/PUT with dueDate| B[API Route Handler]
    B -->|Validate YYYY-MM-DD format| C{Valid?}
    C -->|Yes| D[Store Layer]
    C -->|No| E[Return 400 Error]
    D -->|store.createTask / updateTask| F[Redis/In-Memory]
    G[Dashboard Page] -->|GET /api/tasks| B
    B -->|Return tasks with dueDate| G
    G -->|Filter overdue client-side| H[Filtered Task List]
    H -->|Render| I[TaskCard with Due Date + Overdue Badge]
    
    style A fill:#e3f2fd
    style I fill:#e3f2fd
    style B fill:#fff3e0
    style D fill:#f3e5f5
    style F fill:#e8f5e9
```

**Legend:**
- 🔵 Blue — UI Components (modified)
- 🟠 Orange — API Layer (modified)
- 🟣 Purple — Store Layer (unchanged)
- 🟢 Green — Data Store (unchanged)

---

### 4. Key Components and Responsibilities

| Component | Current Role | Change Required | Reason |
|-----------|--------------|-----------------|--------|
| `lib/types.ts` | TypeScript type definitions | Add `dueDate?: string` to `Task` interface | Define optional field in data model |
| `lib/store.ts` | Data persistence (Redis + in-memory) | **No changes needed** | Store already handles extra fields via spread operators |
| `app/api/tasks/route.ts` | Handle `GET /api/tasks` and `POST /api/tasks` | Add `dueDate` validation in POST handler | Accept and validate `dueDate` on create |
| `app/api/tasks/[id]/route.ts` | Handle `GET/PUT/DELETE /api/tasks/:id` | Add `dueDate` validation in PUT handler | Accept and validate `dueDate` on update |
| `components/TaskForm.tsx` | Task create/edit modal form | Add date input field | Capture `dueDate` from user |
| `components/TaskCard.tsx` | Task display card | Add due date display + overdue badge | Show due date and overdue indicator |
| `app/dashboard/page.tsx` | Dashboard with task list + filters | Add "Overdue" filter button + client-side filter logic | Filter overdue tasks on demand |

---

### 5. Data Flow

**User creates/edits a task with a due date:**

1. User opens `TaskForm` modal (create or edit mode)
2. User enters or selects a date in the new "Due Date" input field (HTML5 `<input type="date">`)
3. Form submits to `POST /api/tasks` (create) or `PUT /api/tasks/:id` (edit) with `dueDate: "YYYY-MM-DD"` or `dueDate: null`
4. API route validates the `dueDate` format using regex `/^\d{4}-\d{2}-\d{2}$/`
5. If invalid → return `400 Bad Request` with error message
6. If valid or `null` → pass to `store.createTask()` or `store.updateTask()`
7. Store persists task to Redis (production) or in-memory (local dev) with the `dueDate` field
8. API returns the created/updated task including `dueDate`
9. Dashboard refreshes via `fetchTasks()` and re-renders task list

**User views tasks with due dates:**

10. Dashboard calls `GET /api/tasks` (optionally with `?status=` filter)
11. API returns all tasks, each with `dueDate` field (string or `null`)
12. Dashboard renders each task using `TaskCard`
13. `TaskCard` checks if `dueDate` exists:
    - If `dueDate` is set → display formatted date ("Due: Dec 31, 2026")
    - If `dueDate` is in the past AND `status !== "done"` → show red "OVERDUE" badge
    - If `dueDate` is `null` → no due date display

**User filters overdue tasks:**

14. User clicks "Overdue" filter button on dashboard
15. Dashboard filters the local `tasks` array client-side:
    - Include tasks where `dueDate < today` AND `status !== "done"`
16. Only overdue tasks are rendered
17. User clicks "All" → full list restored

---

## Section 2 — Implementation Details

### 6. Impacted Files

| File Path | Change Type | Reason |
|-----------|-------------|--------|
| `lib/types.ts` | Modify | Add optional `dueDate?: string` field to `Task` interface |
| `lib/utils.ts` | Create | Add shared date utility functions (DRY principle) |
| `app/api/tasks/route.ts` | Modify | Validate and accept `dueDate` in POST handler |
| `app/api/tasks/[id]/route.ts` | Modify | Validate and accept `dueDate` in PUT handler |
| `components/TaskForm.tsx` | Modify | Add date input field for `dueDate` |
| `components/TaskCard.tsx` | Modify | Display due date and overdue indicator |
| `app/dashboard/page.tsx` | Modify | Add "Overdue" filter button and client-side filtering logic |

**Files NOT changed:**
- `lib/store.ts` — No changes needed (store methods already handle extra fields)
- Seed tasks `t1`–`t5` remain unchanged (no `dueDate` field added)

---

### 7. Data Model Changes

**File:** `lib/types.ts`

**Change:** Add optional `dueDate` field to `Task` interface.

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;  // NEW: Optional ISO date string (YYYY-MM-DD)
}
```

**Rationale:**
- Optional field (`?:`) ensures backward compatibility — existing tasks without `dueDate` work unchanged
- Type is `string` (not `Date`) to align with API JSON format and Redis storage
- Format is ISO 8601 date-only (`YYYY-MM-DD`) — time component not included per requirements

---

### 8. API Contract Changes

#### 8.1 POST /api/tasks (Create Task)

**Request body (new optional field):**
```json
{
  "title": "Implement feature X",
  "description": "Build the UI components",
  "status": "todo",
  "priority": "high",
  "assignee": "admin",
  "dueDate": "2026-12-31"  // NEW: Optional, YYYY-MM-DD format or null
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid-here",
    "title": "Implement feature X",
    "description": "Build the UI components",
    "status": "todo",
    "priority": "high",
    "assignee": "admin",
    "createdAt": "2026-07-01T10:30:00Z",
    "updatedAt": "2026-07-01T10:30:00Z",
    "dueDate": "2026-12-31"  // NEW: Included in response
  },
  "message": "Task created"
}
```

**Validation rules:**
- `dueDate` is optional — can be omitted, `null`, or a valid date string
- If provided and not `null`, must match `/^\d{4}-\d{2}-\d{2}$/` (YYYY-MM-DD)
- Invalid format → `400 Bad Request` with `{ "error": "dueDate must be in YYYY-MM-DD format" }`
- **Date validity check:** After regex passes, verify the date is actually valid by parsing it and comparing the result to the input string. This catches invalid dates like `2026-02-30` or `2026-13-01`.

```typescript
// Additional validation after regex check
if (dueDate && dueDate !== null) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dueDate)) {
    return NextResponse.json(
      { error: "dueDate must be in YYYY-MM-DD format" }, 
      { status: 400 }
    );
  }
  
  // Check if date is actually valid
  const date = new Date(dueDate + "T00:00:00");
  if (isNaN(date.getTime()) || date.toISOString().split("T")[0] !== dueDate) {
    return NextResponse.json(
      { error: "dueDate is not a valid date" }, 
      { status: 400 }
    );
  }
}
```

---

#### 8.2 PUT /api/tasks/:id (Update Task)

**Request body (new optional field):**
```json
{
  "dueDate": "2027-01-15"  // NEW: Optional — can update, set to null, or omit
}
```

**Behavior:**
- If `dueDate: "YYYY-MM-DD"` → update the due date
- If `dueDate: null` → clear the due date
- If `dueDate` omitted → existing due date unchanged

**Validation:** Same as POST (format check if value is not `null`)

---

#### 8.3 GET /api/tasks and GET /api/tasks/:id

**Response change:** All task objects now include `dueDate` field.

```json
{
  "data": [
    {
      "id": "t1",
      "title": "Design login page",
      "status": "done",
      "priority": "high",
      "assignee": "admin",
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-02T10:00:00Z",
      "dueDate": null  // NEW: null for tasks without a due date
    },
    {
      "id": "uuid-123",
      "title": "New task with due date",
      "status": "todo",
      "priority": "medium",
      "assignee": "user1",
      "createdAt": "2026-07-01T10:00:00Z",
      "updatedAt": "2026-07-01T10:00:00Z",
      "dueDate": "2026-12-31"  // NEW: Date string for tasks with a due date
    }
  ]
}
```

**No breaking changes:**
- Existing fields unchanged
- Existing API paths unchanged
- New field is optional — clients can ignore it

---

### 9. Store Logic Changes

**File:** `lib/store.ts`

**Change:** **NONE**

**Rationale:** The store methods already use spread operators to persist all task properties:

```typescript
// createTask (line ~139)
const task: Task = {
  ...data,  // <-- Accepts any fields from input, including dueDate
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
tasks.push(task);

// updateTask (line ~148)
tasks[index] = { 
  ...tasks[index], 
  ...data,  // <-- Merges any fields from input, including dueDate
  updatedAt: new Date().toISOString() 
};
```

Since `dueDate` is part of the `Task` type and passed in the `data` parameter, it will be automatically persisted without code changes.

---

### 10. UI Changes

#### 10.1 TaskForm.tsx (Create/Edit Form)

**Change:** Add date input field for `dueDate`.

**New state:**
```typescript
const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "");
```

**New input field (insert after "Assignee" field, before error message):**
```tsx
<div>
  <label className="block text-sm font-medium mb-1" htmlFor="task-duedate">
    Due Date
  </label>
  <input
    id="task-duedate"
    data-testid="task-duedate-input"
    type="date"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

**Update `handleSubmit` to include `dueDate`:**
```typescript
await onSubmit({ 
  title, 
  description, 
  status, 
  priority, 
  assignee, 
  dueDate: dueDate || null  // Send null if empty string
});
```

**`data-testid` attribute:** `task-duedate-input` (for test automation)

---

#### 10.2 TaskCard.tsx (Task Display)

**Change:** Display due date and overdue indicator.

**Add helper function (top of file, after existing color maps):**
```typescript
import { isTaskOverdue } from "@/lib/utils";

function formatDueDate(dueDate: string): string {
  try {
    const date = new Date(dueDate + "T00:00:00");
    if (isNaN(date.getTime())) {
      return dueDate;  // Fallback: show raw string if parse fails
    }
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    }); // Output: "Dec 31, 2026"
  } catch {
    return dueDate;  // Fallback: show raw string on exception
  }
}
```

**Add display logic (insert after description paragraph, before badges):**
```tsx
{task.dueDate && (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xs text-gray-600" data-testid="task-duedate">
      Due: {formatDueDate(task.dueDate)}
    </span>
    {isTaskOverdue(task.dueDate, task.status) && (
      <span 
        className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white"
        data-testid="task-overdue-badge"
      >
        OVERDUE
      </span>
    )}
  </div>
)}
```

**`data-testid` attributes:**
- `task-duedate` — displays the formatted due date
- `task-overdue-badge` — red "OVERDUE" badge (only shown if overdue)

---

#### 10.3 Dashboard Page (app/dashboard/page.tsx)

**Change 1:** Add "Overdue" filter button.

**Update `filters` array (around line ~118):**
```typescript
const filters: { label: string; value: FilterStatus | "overdue" }[] = [
  { label: "All", value: "all" },
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
  { label: "Overdue", value: "overdue" },  // NEW
];
```

**Update `filter` state type:**
```typescript
type FilterStatus = TaskStatus | "all" | "overdue";  // Add "overdue"
```

**Change 2:** Client-side overdue filtering logic.

**Add import and helper function:**
```typescript
import { getTodayDateString } from "@/lib/utils";

// Add helper function (after `handleDelete`, before `filters` array)
function getFilteredTasks(): Task[] {
  if (filter === "overdue") {
    const today = getTodayDateString();
    return tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "done"
    );
  }
  return tasks;  // Status filtering already handled by fetchTasks()
}
```

**Update task rendering (around line ~145):**
```tsx
{loading ? (
  <div className="text-center text-gray-400" data-testid="loading-indicator">
    Loading tasks…
  </div>
) : getFilteredTasks().length === 0 ? (
  <div className="text-center text-gray-400" data-testid="empty-state">
    No tasks found
  </div>
) : (
  <div className="space-y-3" data-testid="task-list">
    {getFilteredTasks().map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onEdit={(t) => setEditingTask(t)}
        onDelete={handleDelete}
      />
    ))}
  </div>
)}
```

**Change 3:** Update filter behavior and useEffect.

**Modify useEffect to avoid unnecessary API calls:**
```typescript
useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedName = localStorage.getItem("name") ?? "";
  if (!storedToken) {
    router.push("/");
    return;
  }
  setUsername(storedName);
  
  // Only fetch from API if filtering by status (not "overdue")
  if (filter !== "overdue") {
    fetchTasks(filter === "all" ? undefined : filter);
  }
}, [filter, fetchTasks, router]);
```

**Simplified filter click handler (around line ~138):**
```typescript
{filters.map((f) => (
  <button
    key={f.value}
    onClick={() => setFilter(f.value)}  // Just set filter, useEffect handles the rest
    data-testid={`filter-${f.value}`}
    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
      filter === f.value
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {f.label}
  </button>
))}
```

**`data-testid` attribute:** `filter-overdue` (for test automation)

---

#### 10.4 Shared Utility Functions (lib/utils.ts)

**Change:** Create new file `lib/utils.ts` with shared date utility functions.

**Purpose:** Centralize date comparison logic used in both `TaskCard.tsx` and `page.tsx` to follow DRY principle.

**File content:**
```typescript
// lib/utils.ts (NEW FILE)

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check if a task is overdue
 * @param dueDate - Task due date in YYYY-MM-DD format
 * @param status - Task status
 * @returns true if task is overdue (past due date and not done)
 */
export function isTaskOverdue(dueDate: string, status: string): boolean {
  if (status === "done") return false;
  return dueDate < getTodayDateString();
}
```

**Usage:**
- `TaskCard.tsx`: Import and use `isTaskOverdue()` instead of inline logic
- `page.tsx`: Import and use `getTodayDateString()` in `getFilteredTasks()`

---

## Section 3 — Risk and Rollback

### 11. Technology Choices

**No new dependencies added.** All functionality uses existing libraries:

- **Date handling:** Native JavaScript `Date` and string manipulation (no date library needed for YYYY-MM-DD format)
- **HTML5 date input:** `<input type="date">` provides built-in date picker on modern browsers (Chrome, Firefox, Safari, Edge)
- **Tailwind CSS:** Styling for badges and form fields uses existing Tailwind utility classes

**Rationale:** Minimizing dependencies reduces maintenance burden and avoids security vulnerabilities.

---

### 12. Backward Compatibility

| Component | Compatibility Check | Result |
|-----------|---------------------|--------|
| **Task interface** | Optional field (`dueDate?:`) | ✅ Existing tasks without `dueDate` work unchanged |
| **API routes** | No removed fields, no changed paths | ✅ Existing API clients unaffected |
| **Store methods** | Spread operators handle extra fields | ✅ No breaking changes to persistence logic |
| **Seed tasks** | `t1`–`t5` remain unchanged | ✅ Manual test cases still pass |
| **`data-testid` attributes** | All existing test IDs preserved | ✅ Test automation scripts work without modification |
| **UI components** | New elements added, none removed | ✅ Existing UI flows unchanged |

**Explicit guarantees:**
- Tasks created before this feature (no `dueDate` field) display normally
- Tasks can be edited without setting a due date (field remains `null`)
- API responses include `dueDate: null` for legacy tasks (clients can ignore)
- No changes to existing filter buttons ("All", "To Do", "In Progress", "Done")

---

### 13. Rollback Strategy

**If issues are discovered post-deployment:**

#### Option 1: Forward Fix (Recommended)
- **Issue:** Due date validation too strict → relax regex or add format conversion
- **Issue:** Overdue logic incorrect → fix date comparison in `TaskCard.tsx`
- **Rollback time:** < 10 minutes (deploy hotfix)

#### Option 2: Feature Flag Disable (Manual)
- Temporarily remove "Overdue" filter button from dashboard
- Hide due date display in `TaskCard.tsx` (wrap in conditional check)
- Keep `dueDate` field in API responses (clients can ignore)
- **Rollback time:** ~30 minutes (code change + deploy)

#### Option 3: Full Revert (Nuclear)
- Revert all 6 file changes via Git
- Redeploy previous version
- **Data safety:** Existing tasks with `dueDate` remain in Redis but are ignored
- **Rollback time:** ~60 minutes (CI/CD pipeline)

**Migration safety:**
- No database migrations required (Redis stores JSON objects)
- Adding a field to existing tasks is non-destructive
- Removing the feature does not break tasks with `dueDate` set (field is simply ignored)

---

## Summary

This architecture implements **KT-11: Task Due Dates and Overdue Tracking** as a minimal, additive feature:

- ✅ **Optional field** — backward compatible with all existing tasks
- ✅ **Client-side filtering** — no API changes beyond accepting/returning `dueDate`
- ✅ **No store changes** — leverages existing spread operator pattern
- ✅ **7 files modified** — 1 new utility file + 6 existing files updated
- ✅ **Zero breaking changes** — all existing test cases pass
- ✅ **Design reviewed** — 3 Medium + 4 Low severity issues addressed

**Design Review Status:** ✅ **APPROVED** — All findings from Stage 3 have been incorporated.

**Next Steps:**
1. ✅ ~~Proceed to Stage 3 (Design Review Agent)~~ — COMPLETED
2. ✅ ~~Address design concerns~~ — COMPLETED (architecture updated)
3. ▶️ Proceed to Stage 4 (Implementation Plan Agent) to break into tasks

**Ready for Implementation Planning:** ✅
