# Implementation Plan — KT-12: Task Search and Advanced Filtering

**Generated:** 2026-08-03  
**Agent:** 04 - Implementation Plan Agent  
**SDLC Stage:** 4 of 8  
**Source:** [architecture.md](architecture.md) | [design-review.md](design-review.md)

---

## Summary

This plan implements keyword search (`?search=`) and priority filtering (`?priority=`) for the Task Manager. The feature extends the existing `GET /api/tasks` API route with two new optional query parameters, adds filtering logic to the store layer, and introduces search input + priority filter UI controls on the dashboard.

**Files to Modify:** 3  
**Files to Create:** 3 (test files)  
**Total Tasks:** 12 (6 feature tasks + 6 test tasks)  
**Estimated Effort:** 2-3 days (Medium complexity)

---

## Section 1: Prioritized, Dependency-Ordered Task List

### Layer 1: Store Layer (Data Persistence)

**TASK-01** | File: `lib/store.ts` | **S** | Priority: **HIGH** | Extend `getAllTasks` signature with `search` and `priority` optional parameters  
**Description:** Add two new optional parameters (`search?: string`, `priority?: string`) to the `getAllTasks` function signature. Update the function body to apply filtering logic:
- If `priority` is provided, filter tasks by exact match: `tasks.filter(t => t.priority === priority)`
- If `search` is provided, filter tasks by case-insensitive substring match on title OR description: `tasks.filter(t => t.title.toLowerCase().includes(searchLower) || t.description.toLowerCase().includes(searchLower))`
- Apply new filters AFTER existing status and assignee filters (sequential filtering)

**TASK-02** | File: `lib/store.test.ts` | **M** | Priority: **HIGH** | Unit tests for store filtering logic  
**Description:** Test the extended `getAllTasks` function with the following test cases:
1. **Priority filter:** getAllTasks with `priority="high"` returns only high-priority tasks
2. **Priority filter:** getAllTasks with `priority="low"` returns only low-priority tasks
3. **Priority filter:** getAllTasks with `priority="medium"` returns only medium-priority tasks
4. **Priority filter:** getAllTasks with `priority=undefined` returns all tasks (no filter applied)
5. **Search filter:** getAllTasks with `search="login"` returns tasks with "login" in title
6. **Search filter:** getAllTasks with `search="api"` returns tasks with "api" in description
7. **Search filter:** getAllTasks with `search="xyz"` returns empty array (no matches)
8. **Search filter:** getAllTasks with `search=undefined` returns all tasks (no filter applied)
9. **Search case-insensitive:** getAllTasks with `search="LOGIN"` matches tasks with "login" in any case
10. **Combined filters:** getAllTasks with `status="todo"`, `priority="high"`, `search="api"` returns only tasks matching ALL three conditions
11. **Combined filters:** getAllTasks with `priority="high"`, `assignee="admin"` returns only high-priority tasks for admin
12. **Empty result:** Combined filters return empty array when no tasks match

**Mocks:** Mock `kvGetTasks` and `memUserTasks` to return known task arrays  
**Coverage Target:** 95% (all branches, including no-filter paths)  
**Validation:** `npm test -- store.test`

---

### Layer 2: API Layer (Route Handlers)

**TASK-03** | File: `app/api/tasks/route.ts` | **M** | Priority: **HIGH** | Add `search` and `priority` query parameter extraction and validation to GET handler  
**Description:** In the `GET` function:
1. Extract `search` query param: `const search = searchParams.get("search") ?? undefined;`
2. Validate search length (NFR-03): If `search && search.length > 200`, return `400` with error `"Search term too long. Maximum 200 characters allowed"`
3. Extract `priority` query param: `const priority = searchParams.get("priority") ?? undefined;`
4. Validate priority value: If `priority && !["low", "medium", "high"].includes(priority)`, return `400` with error `"Invalid priority value. Must be low, medium, or high"`
5. Pass validated `search` and `priority` to `store.getAllTasks(username, status, assignee, search, priority)`

**TASK-04** | File: `app/api/tasks/route.test.ts` | **M** | Priority: **HIGH** | Integration tests for API route with new query params  
**Description:** Test the GET handler with the following test cases:
1. **Search filter:** `GET /api/tasks?search=login` returns 200 with tasks containing "login"
2. **Search filter:** `GET /api/tasks?search=xyz` returns 200 with empty data array
3. **Search case-insensitive:** `GET /api/tasks?search=LOGIN` returns same results as lowercase
4. **Search validation:** `GET /api/tasks?search={201 chars}` returns 400 with error message
5. **Priority filter:** `GET /api/tasks?priority=high` returns 200 with only high-priority tasks
6. **Priority filter:** `GET /api/tasks?priority=low` returns 200 with only low-priority tasks
7. **Priority validation:** `GET /api/tasks?priority=invalid` returns 400 with error message
8. **Combined filters:** `GET /api/tasks?status=todo&priority=high&search=api` returns 200 with tasks matching all filters
9. **Auth check:** `GET /api/tasks?search=login` without Bearer token returns 401
10. **Backward compatibility:** `GET /api/tasks` (no new params) returns all tasks (existing behavior)

**Mocks:** Mock `store.getAllTasks` to return controlled task arrays; mock `store.validateToken` for auth  
**Coverage Target:** 90% (cover validation, auth, error paths)  
**Validation:** `npm test -- route.test`

---

### Layer 3: UI Layer (Dashboard Components)

**TASK-05** | File: `app/dashboard/page.tsx` | **L** | Priority: **MED** | Add search input, priority filter chips, and update fetchTasks logic  
**Description:** UI changes:
1. Add state variables: `const [searchTerm, setSearchTerm] = useState("");` and `const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");`
2. Add search input component above task list with `data-testid="search-input"`, placeholder "Search tasks...", bound to `searchTerm` state
3. Add priority filter chip group with buttons for "All", "Low", "Medium", "High" (similar to status filter chips), each with `data-testid="filter-priority-{value}"`, bound to `priorityFilter` state
4. Update `fetchTasks` function to build query string with new params:
   - If `priorityFilter !== "all"`, add `params.set("priority", priorityFilter)`
   - If `searchTerm.trim()`, add `params.set("search", searchTerm.trim())`
5. Implement debounce for search input using two separate `useEffect` hooks:
   - Hook 1: Debounce `searchTerm` changes (300ms delay) → `fetchTasks()`
   - Hook 2: Immediate `fetchTasks()` on `priorityFilter` or `filter` changes (no debounce)
6. Update empty state message to check if filters are active: show "No tasks match the selected filters. Try adjusting your search or filters." if `searchTerm || priorityFilter !== "all" || filter !== "all"`, else show default "No tasks yet. Click 'Add Task' to create one."

**TASK-06** | File: `app/dashboard/page.test.tsx` | **L** | Priority: **MED** | Component tests for dashboard search and priority filter UI  
**Description:** Test the dashboard UI with the following test cases:
1. **Search input present:** renders search input with correct data-testid
2. **Priority filter present:** renders priority filter chip group with All/Low/Medium/High buttons
3. **Search interaction:** typing in search input updates state and triggers debounced fetch
4. **Priority interaction:** clicking priority filter chip updates state and triggers immediate fetch
5. **Combined filters:** selecting status + priority + search builds correct query string
6. **Empty state (with filters):** displays filter-specific empty message when no tasks match
7. **Empty state (no filters):** displays default empty message when no filters active
8. **Debounce timing:** search input does not trigger fetch immediately (300ms delay verified)
9. **Clear search:** clearing search input resets to all tasks
10. **Filter reset:** clicking "All" on priority filter removes priority param from query

**Mocks:** Mock `fetch` to return controlled task arrays; mock `localStorage` for token; mock `useRouter` for navigation  
**Coverage Target:** 75% (focus on user interactions and conditional rendering)  
**Validation:** `npm test -- page.test`

---

## Section 2: Blocked Tasks

| Task | Blocked By | Reason |
|------|------------|--------|
| **TASK-02** | TASK-01 | Unit tests require `getAllTasks` signature to be updated with new params |
| **TASK-03** | TASK-01 | API route must call updated `store.getAllTasks` with new params |
| **TASK-04** | TASK-03 | Integration tests require API route to accept and validate new query params |
| **TASK-05** | TASK-03 | UI must call updated API endpoint with new query params |
| **TASK-06** | TASK-05 | Component tests require UI components to be implemented |

**Execution Order:** TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06

**Parallel Work Opportunities:**  
- TASK-02 can start as soon as TASK-01 is committed (dev can work on tests while another dev reviews TASK-01)
- TASK-04 can start as soon as TASK-03 is committed
- TASK-06 can start as soon as TASK-05 is committed

---

## Section 3: Validation Plan

### Task-Specific Validation Checks

| Task | Validation Criteria | Pass Condition |
|------|---------------------|----------------|
| **TASK-01** | TypeScript compiles; `getAllTasks` accepts 5 parameters (username, status?, assignee?, search?, priority?) | `npm run build` succeeds; no type errors |
| **TASK-02** | All unit tests pass; coverage meets 95% target | `npm test -- store.test` exits 0; coverage report shows 95%+ |
| **TASK-03** | API route extracts and validates new query params; returns 400 for invalid inputs | Manual test: `GET /api/tasks?priority=invalid` → 400; `GET /api/tasks?search={201 chars}` → 400 |
| **TASK-04** | All integration tests pass; coverage meets 90% target | `npm test -- route.test` exits 0; coverage report shows 90%+ |
| **TASK-05** | Search input and priority filter chips render; fetchTasks builds query string correctly | Manual test: type "api" → debounce → fetch called with `?search=api`; click "High" → immediate fetch with `?priority=high` |
| **TASK-06** | All component tests pass; coverage meets 75% target | `npm test -- page.test` exits 0; coverage report shows 75%+ |

### Feature-Level Validation (End-to-End)

**After all tasks complete, verify:**

1. **Search functionality:**
   - Type "login" in search input → only tasks with "login" in title/description shown
   - Type "xyz" → empty state message "No tasks match the selected filters"
   - Clear search → all tasks shown

2. **Priority filter functionality:**
   - Click "High" priority chip → only high-priority tasks shown
   - Click "Low" priority chip → only low-priority tasks shown
   - Click "All" → all tasks shown

3. **Combined filters:**
   - Select Status="To Do" + Priority="High" + Search="api" → only tasks matching ALL three conditions shown
   - Empty state shown if no matches

4. **Backward compatibility:**
   - Existing manual test cases TC-01 to TC-29 pass without modification
   - API clients not using new params receive identical responses

5. **Performance:**
   - Search response time < 500ms for 100 tasks (per NFR-01)
   - Search debounce delay feels responsive (300ms)

---

## Section 4: Out-of-Scope Reminder

The following features are **explicitly excluded** from this implementation (per `requirements.md` Section 4: Non-Goals):

### ❌ Out of Scope

1. **Advanced search operators** (AND/OR, wildcards, regex) — Use simple substring matching only
2. **Saved search presets** or user-defined filters — No persistence of filter state
3. **Faceted filtering UI** (multi-select checkboxes) — Single priority selection only (chip buttons)
4. **Search performance optimization** (indexing, caching) — In-memory filtering is sufficient for current task volumes
5. **Search result highlighting** — Do not highlight matched terms in task cards
6. **Backend pagination** — Client receives all filtered tasks in one response

### Why These Are Excluded

- **Complexity vs. value:** The simple search/filter meets 90% of user needs with 10% of the complexity
- **Task volume assumption:** Users have < 100 tasks — advanced optimizations not needed yet
- **Consistent with existing patterns:** Status and assignee filters use the same simple approach

### Scope Creep Prevention

If any of the above features are requested during implementation:
1. ✋ **Stop work** — Do not implement
2. 📝 **Document request** — Add to backlog as a separate story
3. 🔄 **Return to this plan** — Continue with approved scope only

---

## Risk Management

### Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Debounce race condition** | Low | Medium | Use separate useEffect hooks for search (debounced) vs. filters (immediate) per architecture update |
| **Test coverage gaps** | Medium | High | Each feature task followed immediately by test task; use coverage reports to verify targets |
| **Breaking existing tests** | Low | High | Run full test suite after each task; existing manual tests TC-01 to TC-29 must pass |
| **Performance regression** | Low | Medium | Test with 100+ tasks manually; verify < 500ms response time |

### Rollback Plan

If deployment fails or critical bug found:
1. Revert 3 commits (one per file: store.ts, route.ts, page.tsx)
2. Verify existing tests pass
3. Redeploy previous version
4. Estimated rollback time: < 10 minutes

---

## Definition of Done

A task is considered **complete** when:

✅ Code changes implemented as specified  
✅ Corresponding test task completed (if applicable)  
✅ All tests pass (`npm test`)  
✅ TypeScript compiles without errors (`npm run build`)  
✅ ESLint shows no new warnings (`npm run lint`)  
✅ Manual validation criteria met (see Section 3)  
✅ Code reviewed by peer (Stage 6)  
✅ Backward compatibility verified (existing tests pass)

**The feature is done when all 12 tasks meet the above criteria.**

---

## Next Steps

This implementation plan is ready for **Stage 5 (Implementation Agent)**. The agent will:
1. Execute tasks in order (TASK-01 through TASK-06)
2. Write code changes to the specified files
3. Write tests immediately after each feature task
4. Validate each task using the criteria in Section 3
5. Document all changes in `implementation-log.md`

**Prerequisites for Stage 5:**
- ✅ Architecture approved (Stage 2 complete)
- ✅ Design review passed with GO (Stage 3 complete)
- ✅ Implementation plan generated (Stage 4 complete)
- ✅ Test strategy consulted (test tasks included)

**Approval to Proceed:** ✅ **Ready for Implementation (Stage 5)**

---

**Plan Generated:** 2026-08-03  
**Total Tasks:** 12 (6 feature + 6 test)  
**Estimated Duration:** 2-3 days  
**Files Modified:** 3 | **Files Created:** 3 (tests)  
**Test Coverage Target:** Store 95% | API 90% | UI 75%

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

