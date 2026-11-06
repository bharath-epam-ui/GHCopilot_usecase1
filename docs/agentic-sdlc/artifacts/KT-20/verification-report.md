# Verification Report — KT-20

**Story:** KT-20 — Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Stage:** 7 — Verify
**Date:** 2026-11-06
**Verified against:** localhost:3001 (local build, `feature/kt-20-inline-status-transitions-on-task-cards-to-do-in-progress-done`)
**File changed:** `components/TaskCard.tsx` only

---

## Section 1 — Lint and Build

### npm run lint

```
npm notice run kata-taskmanager@1.0.0 lint
npm notice run next lint
✔ No ESLint warnings or errors
```

**Result: lint — passed**

### npm run build

```
npm notice run kata-taskmanager@1.0.0 build
npm notice run next build
  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/8) ...
   Generating static pages (2/8) 
   Generating static pages (4/8) 
   Generating static pages (6/8) 
 ✓ Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    1.22 kB        88.5 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ƒ /api/auth/login                      0 B                0 B
├ ƒ /api/auth/logout                     0 B                0 B
├ ƒ /api/tasks                           0 B                0 B
├ ƒ /api/tasks/[id]                      0 B                0 B
└ ○ /dashboard                           3.46 kB        90.7 kB
+ First Load JS shared by all            87.3 kB
```

**Result: build — passed**

---

## Section 2 — API Verification (Local)

Verified against localhost:3001 (local build). Note: port 3001 was used because a pre-existing Pages Router app occupied port 3000; the KT-20 dev server started on the next available port.

### Feature Checks (F-XX)

KT-20 adds no new field to the Task data model and no new API route. The feature is a pure UI component change to `components/TaskCard.tsx`. Standard new-field API tests (F-01 through F-05) are not applicable; feature verification is covered by static code checks (SC-01 through SC-10) in the section below.

**Feature checks: N/A (UI-only change — no new API fields)**

### Static Code Checks on `components/TaskCard.tsx`

Strings that MUST be present:

| # | String | Line | Result |
|---|---|---|---|
| SC-01 | `data-testid="task-status-select"` | 111 | PASS |
| SC-02 | `data-testid="task-status-error"` | 124 | PASS |
| SC-03 | `aria-live="polite"` | 106 | PASS |
| SC-04 | `aria-atomic="true"` | 106 | PASS |
| SC-05 | `` aria-label={`Change status for ${task.title}`} `` (template literal) | 112 | PASS |
| SC-06 | `"Failed to update status. Please try again."` | 57 | PASS |
| SC-07 | `clearTimeout` | 43 | PASS |

Strings that MUST NOT be present:

| # | String | Result |
|---|---|---|
| SC-08 | `inline-status-select` | NOT FOUND — PASS |
| SC-09 | `inline-status-error` | NOT FOUND — PASS |
| SC-10 | `setTimeout` in catch block | NOT IN CATCH — PASS (setTimeout appears only on line 42 inside `useEffect`, not in the catch block on lines 55–61) |

**Static code checks: 10/10 passed**

### Regression Checks

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| R-01 | POST /api/auth/login — valid creds | 200, `data.token` non-empty | `{"data":{"token":"YWRtaW4...","name":"Admin User","username":"admin"},"message":"Login successful"}` | PASS |
| R-02 | POST /api/auth/login — wrong password | 401, `error: "Invalid credentials"` | `{"error":"Invalid credentials"}` HTTP 401 | PASS |
| R-03 | GET /api/tasks — no auth | 401, `error: "Unauthorized"` | `{"error":"Unauthorized"}` HTTP 401 | PASS |
| R-04 | GET /api/tasks — authenticated | 200, at least 5 tasks in `data` | 200, array with 5 tasks (t1–t5) | PASS |
| R-05 | GET /api/tasks?status=todo | 200, all items `status: "todo"` | 200, 3 tasks all with `status:"todo"` (t3, t4, t5) | PASS |
| R-06 | POST /api/tasks — missing title | 400, `error: "title is required"` | `{"error":"title is required"}` HTTP 400 | PASS |
| R-07 | GET /api/tasks/t1 | 200, `data.id === "t1"` | `{"data":{"id":"t1","title":"Design login page",...}}` | PASS |
| R-08 | POST /api/auth/logout | 200, `message: "Logged out successfully"` | `{"message":"Logged out successfully"}` | PASS |

**Regression checks: 8/8 passed**

---

## Section 3 — Manual UI Smoke Checklist

### Manual UI Smoke Checklist — TC-UI-015
App: http://localhost:3000
Tester: _______________   Date: _______________

**Authentication**
- [ ] Login with admin / password123 → redirects to /dashboard, header shows "Admin User"
- [ ] Logout → redirects to login page

**Task Card — Inline Status Dropdown Present (FR-01)**
- [ ] Dashboard renders task cards; each card has a `<select>` dropdown showing the task's current status
- [ ] All three options are present in every dropdown: "To Do", "In Progress", "Done"

**AC1 — To Do → In Progress (FR-02, FR-03)**
- [ ] Find a task with status "To Do"; select "In Progress" from its inline dropdown
- [ ] Status pill on the card updates immediately (before API round-trip) — no page reload required
- [ ] Refresh the page → task still shows "In Progress" (persisted via PUT /api/tasks/:id)

**AC2 — In Progress → Done + filter reflection (FR-07)**
- [ ] With "In Progress" filter active, change a visible task to "Done"
- [ ] Task disappears from the "In Progress" filter view immediately
- [ ] Switch filter to "Done" → the task appears there

**AC3 — Done → To Do reopen (FR-04, FR-07)**
- [ ] Change a "Done" task to "To Do" via the inline dropdown
- [ ] Task appears under "To Do" filter; does not appear under "Done" filter

**AC4 — In-flight lock (FR-05)**
- [ ] Throttle network to 2 s (browser DevTools > Network > Slow 3G)
- [ ] Select a new status; while the request is pending the dropdown is disabled (unclickable/greyed)
- [ ] A second interaction on the same dropdown has no effect during the pending request

**AC5 — Failure rollback + inline error (FR-06)**
- [ ] Mock API to return 500 (DevTools > Network request blocking or service worker)
- [ ] Select a new status; the status pill reverts to the original value
- [ ] `[data-testid="task-status-error"]` appears on the card with text "Failed to update status. Please try again."
- [ ] Error message auto-dismisses after ~3 seconds without user action

**AC6 — Keyboard + screen reader accessibility (FR-08)**
- [ ] Tab key reaches the inline status `<select>` on a task card
- [ ] Arrow keys change the selected value; the change triggers the same optimistic update + API call
- [ ] VoiceOver (macOS) or NVDA (Windows) announces "Change status for [task title]" on focus
- [ ] Screen reader announces `aria-live` region update when status changes

**Regression**
- [ ] "To Do" / "In Progress" / "Done" / "All" filters work correctly
- [ ] Edit existing task via Edit button → modal pre-fills current values, update saves
- [ ] Delete task → card removed, count decreases by 1
- [ ] `[data-testid="task-status"]` sr-only span is present on every card (backward compatibility)
- [ ] `[data-testid="task-status-select"]` and `[data-testid="task-status"]` both present on every card

---

## Section 4 — Summary

```
Lint:               passed
Build:              passed
Static code checks: 10/10 passed
Regression checks:  8/8 passed
Feature checks:     N/A (UI-only change, no new API fields)
Manual UI:          Pending human sign-off (TC-UI-015, 6 ACs above)

Final verdict: All automated checks passed — awaiting manual UI sign-off
```
