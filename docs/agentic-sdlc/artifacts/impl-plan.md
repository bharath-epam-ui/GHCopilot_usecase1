# Implementation Plan — KT-11: Task Due Dates and Overdue Tracking

**Generated:** 2026-07-01  
**Agent:** 04 - Implementation Plan Agent  
**SDLC Stage:** 4 of 8

---

## Prerequisite Check

✅ **Design Review Status:** GO (from [`design-review.md`](design-review.md))

All findings from Stage 3 have been addressed in the updated architecture. Ready to proceed with implementation.

---

## 1. Prioritized, Dependency-Ordered Task List

| Task ID | File | Effort | Priority | Description |
|---------|------|--------|----------|-------------|
| TASK-01 | `lib/types.ts` | S | HIGH | Add optional `dueDate?: string` field to Task interface |
| TASK-02 | `lib/utils.ts` | S | HIGH | Create new file with date utility functions (`getTodayDateString`, `isTaskOverdue`) |
| TASK-03 | `app/api/tasks/route.ts` | M | HIGH | Add `dueDate` validation (format + validity) in POST handler |
| TASK-04 | `app/api/tasks/[id]/route.ts` | M | HIGH | Add `dueDate` validation (format + validity) in PUT handler |
| TASK-05 | `components/TaskForm.tsx` | M | MED | Add date input field and state for `dueDate` |
| TASK-06 | `components/TaskCard.tsx` | M | MED | Add due date display and overdue badge with `formatDueDate` helper |
| TASK-07 | `app/dashboard/page.tsx` | L | MED | Add "Overdue" filter button, client-side filtering logic, and update useEffect |

**Legend:**
- **Effort:** S (Small, <30 min), M (Medium, 30-60 min), L (Large, 1-2 hours)
- **Priority:** HIGH (critical path, blocks other work), MED (important but not blocking), LOW (nice-to-have)

---

## 2. Blocked Tasks

**Dependency Chain:**

```
TASK-01 (types.ts) 
  ├─ TASK-02 (utils.ts) — needs Task type for function signatures
  ├─ TASK-03 (POST API) — needs Task type to know what fields to validate
  ├─ TASK-04 (PUT API) — needs Task type to know what fields to validate
  └─ TASK-05 (TaskForm) — needs Task type to know what state to add

TASK-02 (utils.ts)
  ├─ TASK-06 (TaskCard) — imports isTaskOverdue()
  └─ TASK-07 (Dashboard) — imports getTodayDateString()

TASK-03 (POST API) + TASK-04 (PUT API)
  └─ TASK-05 (TaskForm) — form submits to these endpoints, should be ready first

TASK-05 (TaskForm) [no blocking dependencies after API ready]

TASK-06 (TaskCard) [blocked by TASK-02]

TASK-07 (Dashboard) [blocked by TASK-02]
```

**Explicit Blocks:**

- **TASK-02 is blocked by TASK-01** — utils.ts functions use `Task` type from types.ts
- **TASK-03 is blocked by TASK-01** — API validation needs `Task` interface updated
- **TASK-04 is blocked by TASK-01** — API validation needs `Task` interface updated
- **TASK-05 is blocked by TASK-01, TASK-03, TASK-04** — Form needs type definition and working API endpoints
- **TASK-06 is blocked by TASK-02** — TaskCard imports `isTaskOverdue()` from utils.ts
- **TASK-07 is blocked by TASK-02** — Dashboard imports `getTodayDateString()` from utils.ts

**Recommended Execution Order:**

1. TASK-01 (types) — **Must be first** — everything depends on this
2. TASK-02 (utils) — **Should be second** — used by multiple components
3. TASK-03, TASK-04 (API) — **Can be done in parallel** after TASK-01/02 complete
4. TASK-05 (form) — After API tasks complete
5. TASK-06, TASK-07 (UI) — **Can be done in parallel** after TASK-02 completes

---

## 3. Validation Plan

For each task, specify the check that confirms completion:

### TASK-01: lib/types.ts
**Completion Criteria:**
- ✅ `Task` interface includes `dueDate?: string` field
- ✅ TypeScript compiles without errors (`npm run build`)
- ✅ No breaking changes to existing code (all files that import `Task` still compile)

**Manual Check:**
```bash
# Should show dueDate in Task interface
grep -A 10 "interface Task" lib/types.ts
```

---

### TASK-02: lib/utils.ts
**Completion Criteria:**
- ✅ File `lib/utils.ts` created
- ✅ `getTodayDateString()` function returns today's date in YYYY-MM-DD format
- ✅ `isTaskOverdue()` function returns `true` for past due dates (status ≠ "done"), `false` otherwise
- ✅ TypeScript compiles without errors

**Manual Check:**
```bash
# Should show both exported functions
grep "export function" lib/utils.ts
```

**Test in Node.js REPL:**
```javascript
const { getTodayDateString, isTaskOverdue } = require('./lib/utils.ts');
console.log(getTodayDateString()); // Should output: "2026-07-01"
console.log(isTaskOverdue("2026-06-30", "todo")); // Should output: true
console.log(isTaskOverdue("2026-06-30", "done")); // Should output: false
console.log(isTaskOverdue("2026-12-31", "todo")); // Should output: false
```

---

### TASK-03: app/api/tasks/route.ts (POST)
**Completion Criteria:**
- ✅ POST handler accepts optional `dueDate` field from request body
- ✅ Regex validation `/^\d{4}-\d{2}-\d{2}$/` enforced
- ✅ Date validity check enforced (rejects "2026-02-30", "2026-13-01", etc.)
- ✅ Invalid format returns `400` with `{ "error": "dueDate must be in YYYY-MM-DD format" }`
- ✅ Invalid date returns `400` with `{ "error": "dueDate is not a valid date" }`
- ✅ Valid `dueDate` or `null` is passed to `store.createTask()`
- ✅ Response includes `dueDate` field

**Test via cURL:**
```bash
# Should succeed
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","status":"todo","priority":"low","assignee":"admin","dueDate":"2026-12-31"}'
# Response should include "dueDate": "2026-12-31"

# Should return 400 (invalid format)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","status":"todo","priority":"low","assignee":"admin","dueDate":"12/31/2026"}'
# Response should include "error": "dueDate must be in YYYY-MM-DD format"

# Should return 400 (invalid date)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","status":"todo","priority":"low","assignee":"admin","dueDate":"2026-02-30"}'
# Response should include "error": "dueDate is not a valid date"

# Should succeed (null dueDate)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","status":"todo","priority":"low","assignee":"admin","dueDate":null}'
# Response should include "dueDate": null
```

---

### TASK-04: app/api/tasks/[id]/route.ts (PUT)
**Completion Criteria:**
- ✅ PUT handler accepts optional `dueDate` field from request body
- ✅ Same validation as POST (regex + validity check)
- ✅ If `dueDate` omitted → existing due date unchanged
- ✅ If `dueDate: null` → due date cleared
- ✅ If `dueDate: "YYYY-MM-DD"` → due date updated

**Test via cURL:**
```bash
# Should succeed (update due date)
curl -X PUT http://localhost:3000/api/tasks/t1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dueDate":"2026-08-15"}'
# Response should include "dueDate": "2026-08-15"

# Should succeed (clear due date)
curl -X PUT http://localhost:3000/api/tasks/t1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dueDate":null}'
# Response should include "dueDate": null

# Should succeed (omit dueDate, no change)
curl -X PUT http://localhost:3000/api/tasks/t1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
# Response should have same dueDate as before
```

---

### TASK-05: components/TaskForm.tsx
**Completion Criteria:**
- ✅ New state: `const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "")`
- ✅ New input field added with `<input type="date">` and `data-testid="task-duedate-input"`
- ✅ `handleSubmit` includes `dueDate: dueDate || null` in payload
- ✅ Form displays correctly in both create and edit modes
- ✅ Clearing the date field sends `null` to API

**Manual Check:**
```bash
# Should show the new state and input field
grep -A 2 "dueDate" components/TaskForm.tsx
```

**UI Test:**
1. Open app, click "Add Task"
2. Verify "Due Date" field appears after "Assignee"
3. Select a date → submit → verify task created with `dueDate` in response
4. Edit a task → clear date field → submit → verify `dueDate: null` in response

---

### TASK-06: components/TaskCard.tsx
**Completion Criteria:**
- ✅ Import `isTaskOverdue` from `@/lib/utils`
- ✅ `formatDueDate()` helper function added with try-catch error handling
- ✅ Due date display added with `data-testid="task-duedate"`
- ✅ Overdue badge conditionally rendered with `data-testid="task-overdue-badge"`
- ✅ Tasks without `dueDate` show no due date label
- ✅ Tasks with past due date (status ≠ "done") show red "OVERDUE" badge

**Manual Check:**
```bash
# Should show import and new functions
grep -E "(import.*isTaskOverdue|formatDueDate|task-duedate)" components/TaskCard.tsx
```

**UI Test:**
1. Create a task with `dueDate: "2026-12-31"` → verify "Due: Dec 31, 2026" displays
2. Create a task with `dueDate: "2026-06-30"` (past) and `status: "todo"` → verify red "OVERDUE" badge shows
3. Create a task with `dueDate: "2026-06-30"` (past) and `status: "done"` → verify NO overdue badge
4. Create a task without `dueDate` → verify no due date label or badge

---

### TASK-07: app/dashboard/page.tsx
**Completion Criteria:**
- ✅ Import `getTodayDateString` from `@/lib/utils`
- ✅ `FilterStatus` type includes `"overdue"`
- ✅ `filters` array includes `{ label: "Overdue", value: "overdue" }`
- ✅ `getFilteredTasks()` function filters overdue tasks client-side
- ✅ `useEffect` modified to skip API call when `filter === "overdue"`
- ✅ Filter button has `data-testid="filter-overdue"`
- ✅ Clicking "Overdue" shows only overdue tasks (past due, not done)
- ✅ Task rendering uses `getFilteredTasks()` instead of `tasks`

**Manual Check:**
```bash
# Should show import, new filter, and getFilteredTasks function
grep -E "(import.*getTodayDateString|filter-overdue|getFilteredTasks)" app/dashboard/page.tsx
```

**UI Test:**
1. Create 3 tasks:
   - Task A: `dueDate: "2026-06-30"`, `status: "todo"` (overdue)
   - Task B: `dueDate: "2026-12-31"`, `status: "todo"` (not overdue)
   - Task C: `dueDate: "2026-06-30"`, `status: "done"` (past but done)
2. Click "All" → verify all 3 tasks shown
3. Click "Overdue" → verify only Task A shown
4. Click "All" again → verify all 3 tasks shown again

---

## 4. Out-of-Scope Reminder

The following items are **explicitly excluded** from this implementation (per [`requirements.md`](requirements.md) Section 4):

- ❌ Time-of-day tracking (only date, no hours/minutes)
- ❌ Reminders or notifications (no email/push when overdue)
- ❌ Recurring due dates (no repeat schedules)
- ❌ Business rule validation (no minimum lead times)
- ❌ Timezone handling (server date comparison only)
- ❌ Sorting by due date (existing createdAt sorting unchanged)
- ❌ Bulk due date operations (no "set due date for multiple tasks")
- ❌ Server-side `?overdue=true` query parameter (client-side filtering only)

If any of these features are requested during implementation, **stop and confirm with the user** before proceeding.

---

## 5. Risk Mitigation

### High Priority Tasks (Critical Path)

**TASK-01, TASK-02** — Foundation tasks. If these fail or are incorrect, all subsequent tasks are blocked.

**Mitigation:**
- Complete these first
- Run TypeScript compiler immediately after changes (`npm run build`)
- Verify exports are correct before moving to next task

### Medium Priority Tasks (Feature Delivery)

**TASK-03, TASK-04** — API validation. Incorrect validation allows bad data into the system.

**Mitigation:**
- Test all 4 validation scenarios (valid date, null, invalid format, invalid date)
- Use cURL tests from validation plan above
- Check Redis/in-memory storage to confirm data is correct

**TASK-05, TASK-06, TASK-07** — UI changes. Bugs here affect user experience but don't corrupt data.

**Mitigation:**
- Test in browser after each task
- Verify all `data-testid` attributes are present (for test automation)
- Check responsive layout on mobile screen sizes

### Rollback Plan (If Issues Discovered Mid-Implementation)

If a task fails and cannot be fixed immediately:

1. **Revert the failing task's changes** via Git
2. **Comment out broken imports** in dependent files (to allow compilation)
3. **Mark the task as "blocked"** in implementation log
4. **Escalate to design review** if the issue requires architectural changes
5. **Continue with independent tasks** (e.g., if TASK-03 fails, TASK-04 can still proceed)

---

## Summary

This implementation plan breaks KT-11 into **7 tasks** across **7 files**:

- **2 HIGH priority foundation tasks** (TASK-01, TASK-02) — must complete first
- **2 HIGH priority API tasks** (TASK-03, TASK-04) — can be done in parallel after foundation
- **3 MED priority UI tasks** (TASK-05, TASK-06, TASK-07) — can be done in parallel after foundation and API

**Estimated Total Effort:** 4-6 hours (including testing and validation)

**Recommended Implementation Order:**
1. TASK-01 → TASK-02 (foundation, ~1 hour)
2. TASK-03, TASK-04 in parallel (API, ~1.5 hours)
3. TASK-05 (form, ~45 min)
4. TASK-06, TASK-07 in parallel (UI display, ~1.5 hours)
5. End-to-end testing (~30 min)

**Next Steps:**
1. Proceed to Stage 5 (Implementation Agent) to execute tasks
2. Log completions in `implementation-log.md` as each task finishes
3. Run validation checks after each task

**Ready for Implementation:** ✅

