# Requirements — KT-11: Task Due Dates and Overdue Tracking

**Generated:** 2026-07-01  
**Agent:** 01 - Requirements Agent  
**SDLC Stage:** 1 of 8

---

## 1. Jira Story

**Key:** KT-11  
**URL:** https://bharathwaj1390.atlassian.net/browse/KT-11  
**Summary:** KT-CAPSTONE: Task Due Dates and Overdue Tracking  
**Status:** To Do  

---

## 2. Problem Statement

Currently, the kata-taskmanager application allows users to create and manage tasks with title, description, status, priority, and assignee fields. However, there is no mechanism to track when tasks are due or to identify overdue work. Users need the ability to set deadlines on tasks and receive visual indicators when tasks are past their due dates, enabling better time management and prioritization of work.

This feature must be implemented without breaking existing functionality or requiring changes to tasks that already exist in the system.

---

## 3. Goals

- Enable users to optionally set a due date (YYYY-MM-DD format) when creating or editing tasks
- Display due dates on task cards in the dashboard UI when they are set
- Provide a visual overdue indicator for tasks that are past their due date and not yet marked as "done"
- Add a dashboard filter to show only overdue tasks
- Maintain 100% backward compatibility — all existing tasks without due dates must behave identically to before

---

## 4. Non-Goals

- **Time-of-day tracking** — due dates are calendar dates only (no hours/minutes)
- **Reminders or notifications** — no email/push notifications when tasks become overdue
- **Recurring due dates** — no support for tasks that repeat on a schedule
- **Due date validation against business rules** — no enforcement of minimum lead times or approval workflows
- **Timezone handling** — overdue calculation uses server date comparison (no per-user timezone logic)
- **Sorting by due date** — current sorting behavior (by createdAt) is unchanged
- **Bulk due date operations** — no "set due date for multiple tasks" feature

---

## 5. Functional Requirements

### FR-01: API — Accept Optional Due Date on Task Creation
**Criterion:** `POST /api/tasks` accepts an optional `dueDate` field (string, format: `YYYY-MM-DD`). If provided, the value is stored with the task. If omitted or `null`, the task has no due date.

**Pass condition:**
- Request with `{ "title": "Test", "status": "todo", "priority": "low", "assignee": "admin", "dueDate": "2026-12-31" }` → response includes `"dueDate": "2026-12-31"`
- Request without `dueDate` field → response includes `"dueDate": null` or field is absent

---

### FR-02: API — Accept Optional Due Date on Task Update
**Criterion:** `PUT /api/tasks/:id` accepts an optional `dueDate` field. If provided, the due date is updated. If `null` is explicitly sent, the due date is cleared. If omitted, the existing due date is unchanged.

**Pass condition:**
- Update request with `"dueDate": "2027-01-15"` → task's `dueDate` changes to `"2027-01-15"`
- Update request with `"dueDate": null` → task's `dueDate` becomes `null`
- Update request without `dueDate` field → task's `dueDate` unchanged

---

### FR-03: API — Return Due Date in GET Responses
**Criterion:** `GET /api/tasks` and `GET /api/tasks/:id` include the `dueDate` field in each task object (either a string `YYYY-MM-DD` or `null`).

**Pass condition:**
- Response JSON for a task with a due date includes `"dueDate": "2026-08-01"`
- Response JSON for a task without a due date includes `"dueDate": null` or omits the field

---

### FR-04: API — Validate Due Date Format
**Criterion:** If a `dueDate` value is provided that is not in `YYYY-MM-DD` format (or `null`), the API returns a `400` error with a descriptive message.

**Pass condition:**
- Request with `"dueDate": "2026/12/31"` → `400 Bad Request` with error message
- Request with `"dueDate": "invalid"` → `400 Bad Request` with error message
- Request with `"dueDate": null` → accepted (no error)
- Request with `"dueDate": "2026-12-31"` → accepted (no error)

---

### FR-05: UI — Display Due Date on Task Card
**Criterion:** When a task has a `dueDate` set, the task card in the dashboard displays the due date in a human-readable format (e.g., "Due: Dec 31, 2026" or "Due: 2026-12-31").

**Pass condition:**
- Task card for a task with `dueDate: "2026-12-31"` shows a due date label with the date
- Task card for a task with `dueDate: null` does not show a due date label

---

### FR-06: UI — Overdue Indicator for Past-Due Tasks
**Criterion:** If a task's `dueDate` is in the past (before today's date) **and** the task's status is **not** `"done"`, the task card displays a visual overdue indicator (e.g., red badge, icon, or text such as "OVERDUE").

**Pass condition:**
- Task with `dueDate: "2026-06-30"` and `status: "todo"` on 2026-07-01 → overdue indicator visible
- Task with `dueDate: "2026-06-30"` and `status: "done"` on 2026-07-01 → no overdue indicator
- Task with `dueDate: "2026-12-31"` and `status: "todo"` on 2026-07-01 → no overdue indicator
- Task with `dueDate: null` → no overdue indicator

---

### FR-07: UI — Due Date Input in Task Form
**Criterion:** The task creation and edit modal form includes an optional date input field labeled "Due Date" (or similar). The field accepts a date in `YYYY-MM-DD` format (or uses a date picker). Leaving it blank or clearing it results in `dueDate: null`.

**Pass condition:**
- User can select or type a date → form sends `"dueDate": "YYYY-MM-DD"` to API
- User leaves field blank → form sends `"dueDate": null` or omits the field
- User clears a previously set date → form sends `"dueDate": null`

---

### FR-08: UI — Overdue Filter on Dashboard
**Criterion:** The dashboard filter bar includes an "Overdue" filter button (or similar UI control). When clicked, only tasks that are overdue (past due date and status ≠ "done") are displayed.

**Pass condition:**
- Clicking "Overdue" filter → `GET /api/tasks?overdue=true` is called, or client-side filtering shows only overdue tasks
- Response or filtered list includes only tasks where `dueDate < today` and `status !== "done"`
- Clicking "All" filter again → all tasks are shown

---

### FR-09: Backward Compatibility — Existing Tasks Unaffected
**Criterion:** All existing tasks (created before this feature is deployed) that do not have a `dueDate` field behave identically to before. They are displayed in the dashboard, can be edited, deleted, and filtered by status/assignee without errors.

**Pass condition:**
- Task with no `dueDate` field appears in dashboard with no due date label
- Editing such a task does not force a due date to be set
- Filtering by status or assignee includes tasks without due dates
- No errors or visual anomalies for tasks missing the `dueDate` field

---

### FR-10: Data Integrity — Optional Field in Data Model
**Criterion:** The `dueDate` field is optional in the `Task` TypeScript interface and in the Redis data store. The application does not crash or return errors if the field is missing from a stored task object.

**Pass condition:**
- TypeScript interface declares `dueDate?: string | null`
- Tasks stored in Redis without a `dueDate` key are loaded without errors
- API routes handle missing `dueDate` fields gracefully (treat as `null`)

---

## 6. Non-Functional Requirements

### NFR-01: Performance
**Criterion:** Adding the `dueDate` field must not degrade API response times by more than 5%. Overdue filtering (if server-side) should complete within the same performance budget as existing status filters.

**Rationale:** The app currently responds in ~100-200ms for task list requests. Adding due date logic should not introduce noticeable latency.

---

### NFR-02: Backward Compatibility
**Criterion:** Zero breaking changes to existing API routes, response shapes, or `data-testid` attributes. Existing manual test cases (TC-01 through TC-29) must continue to pass without modification.

**Rationale:** This is a kata training platform with manual test cases as the source of truth. Breaking changes invalidate training materials and require test rewrite.

---

### NFR-03: Security
**Criterion:** The `dueDate` field is subject to the same authentication and authorization rules as other task fields. Users can only set/view due dates on tasks they are authorized to access (their own tasks, per current data isolation model).

**Rationale:** No new security surface is introduced by this feature.

---

### NFR-04: Data Validation
**Criterion:** Invalid `dueDate` values (malformed dates, SQL injection attempts, overly long strings) are rejected with a `400` error before being stored.

**Rationale:** Prevents data corruption and ensures consistent date format for client-side processing.

---

### NFR-05: UI Responsiveness
**Criterion:** The due date display and overdue indicator adapt to mobile screen sizes without layout breakage. Task cards remain readable and interactive on screens ≥320px wide.

**Rationale:** The app uses Tailwind CSS responsive utilities. New UI elements must follow the same pattern.
 — ✅ ALL CONFIRMED

### Q1: Should the "Overdue" filter be a separate button or a checkbox?
**Context:** The current status filter uses exclusive buttons (All / To Do / In Progress / Done). Adding a fifth button ("Overdue") may make the UI crowded. Alternatively, "Overdue" could be a checkbox that filters within the selected status (e.g., "Show only overdue To Do tasks").

**✅ CONFIRMED DECISION:** Add "Overdue" as a fifth exclusive filter button. Users can click "Overdue" to see all overdue tasks across all statuses (except "Done"). This aligns with the existing filter pattern and requires minimal UI changes.

---

### Q2: What is the visual design for the overdue indicator?
**Context:** AC3 requires an overdue indicator, but the Jira story does not specify the design (color, icon, badge, etc.).

**✅ CONFIRMED DECISION:** Use a red badge with white text reading "OVERDUE" placed near the due date label on the task card. The badge should use Tailwind classes (e.g., `bg-red-600 text-white text-xs px-2 py-0.5 rounded`).

---

### Q3: Should the API support an `?overdue=true` query parameter, or is client-side filtering sufficient?
**Context:** FR-08 describes an "Overdue" filter. This could be implemented as:
- **Server-side:** `GET /api/tasks?overdue=true` returns only overdue tasks
- **Client-side:** `GET /api/tasks` returns all tasks, and the React component filters them by checking `dueDate` and `status`

**✅ CONFIRMED DECISION:** Implement client-side filtering first (simpler, no API changes beyond adding `dueDate` to responses). If performance becomes an issue (e.g., users with 1000+ tasks), add the `?overdue=true` query param in a future iteration.

---

### Q4: Should the due date input field have a minimum date (e.g., cannot set due date in the past)?
**Context:** Users may accidentally set a due date in the past when creating a task.

**✅ CONFIRMED DECISION:** No minimum date validation. Users may intentionally create tasks with past due dates to log overdue work. The overdue indicator will immediately show if the date is in the past.

---

### Q5: How should the due date be displayed on the task card? (exact format)
**Context:** FR-05 requires displaying the due date "in a human-readable format."

**Options:**
- ISO format: "Due: 2026-12-31"
- Long format: "Due: December 31, 2026"
- Short format: "Due: Dec 31, 2026"
- Relative format: "Due in 5 days" / "Overdue by 2 days"

**✅ CONFIRMED DECISION:** Use short format ("Due: Dec 31, 2026") for readability. Avoid relative dates (e.g., "in 5 days") because they require client-side date math and can be confusing if the page is cachedhe past when creating a task.

**Proposed Answer:** No minimum date validation. Users may intentionally create tasks with past due dates to log overdue work. The overdue indicator will immediately show if the date is in the past.

**Decision Required:** User or Product Owner to confirm.

---

### Q5: How should the due date be displayed on the task card? (exact format)
**Context:** FR-05 requires displaying the due date "in a human-readable format."

**Options:**
- ISO format: "Due: 2026-12-31"
- Long format: "Due: December 31, 2026"
- Short format: "Due: Dec 31, 2026"
- Relative format: "Due in 5 days" / "Overdue by 2 days"

**Proposed Answer:** Use short format ("Due: Dec 31, 2026") for readability. Avoid relative dates (e.g., "in 5 days") because they require client-side date math and can be confusing if the page is cached.

**Decision Required:** User or Product Owner to confirm.

---

## Summary

This requirements document captures the scope, constraints, and success criteria for adding **due dates and overdue tracking** to the kata-taskmanager application. The feature is designed to be additive (no breaking changes), backward-compatible (existing tasks unaffected), and aligned with the existing UI/API patterns.

**Next Steps:**
1. Resolve open questions Q1-Q5 with the Product Owner or user
2. Proceed to Stage 2 (Architecture Agent) to design the technical implementation
3. Review the architecture in Stage 3 (Design Review Agent) before coding begins

**Approval Required:** ✅ User confirmation that all open questions are answered and requirements are complete.
✅ ~~Resolve open questions Q1-Q5 with the Product Owner or user~~ — COMPLETED
2. ▶️ Proceed to Stage 2 (Architecture Agent) to design the technical implementation
3. Review the architecture in Stage 3 (Design Review Agent) before coding begins

**Status:** ✅ **APPROVED** — All open questions confirmed. Ready for Stage 2 (Architecture)