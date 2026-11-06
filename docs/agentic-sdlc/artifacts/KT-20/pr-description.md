## Summary

KT-20 is a completion and correctness pass over the KT-19 inline status controls implementation. Five gaps between the KT-19 code and the KT-20 acceptance criteria were identified and closed: `data-testid` renames, an `aria-label` that includes the task title, `aria-live`/`aria-atomic` on the screen-reader span, and replacing a bare `setTimeout` in the catch block with a `useEffect`-managed timer that cleans up on unmount. All changes are confined to a single file (`components/TaskCard.tsx`).

Closes KT-20.

## Changes Made

- **`components/TaskCard.tsx`** — Renamed `data-testid="inline-status-select"` → `data-testid="task-status-select"` (FR-09)
- **`components/TaskCard.tsx`** — Updated `aria-label` from static string to template literal `` `Change status for ${task.title}` `` (FR-08)
- **`components/TaskCard.tsx`** — Added `aria-live="polite" aria-atomic="true"` to the sr-only status span so screen readers announce value changes (FR-08)
- **`components/TaskCard.tsx`** — Replaced bare `setTimeout` in the catch block with a `useEffect` keyed on `[statusError]` that returns `clearTimeout` cleanup, preventing state updates on unmounted components (NFR-05)
- **`components/TaskCard.tsx`** — Renamed `data-testid="inline-status-error"` → `data-testid="task-status-error"` (OQ-3 / FR-09)
- **`components/TaskCard.tsx`** — Corrected error fallback message to `"Failed to update status. Please try again."` to match the approved architecture copy (RV-01)

## Test Evidence

### Lint and Build

```
npm run lint  →  ✔ No ESLint warnings or errors   PASS
npm run build →  ✓ Compiled successfully            PASS
               ✓ Generating static pages (8/8)
```

### Static Code Checks (10/10 passed)

| # | Check | Result |
|---|---|---|
| SC-01 | `data-testid="task-status-select"` present | PASS |
| SC-02 | `data-testid="task-status-error"` present | PASS |
| SC-03 | `aria-live="polite"` on sr-only span | PASS |
| SC-04 | `aria-atomic="true"` on sr-only span | PASS |
| SC-05 | `aria-label={`Change status for ${task.title}`}` | PASS |
| SC-06 | `"Failed to update status. Please try again."` present | PASS |
| SC-07 | `clearTimeout` present | PASS |
| SC-08 | `inline-status-select` NOT present | PASS |
| SC-09 | `inline-status-error` NOT present | PASS |
| SC-10 | No bare `setTimeout` in catch block | PASS |

### Regression Checks (8/8 passed)

| # | Check | Result |
|---|---|---|
| R-01 | POST /api/auth/login — valid credentials | PASS |
| R-02 | POST /api/auth/login — wrong password → 401 | PASS |
| R-03 | GET /api/tasks — no auth → 401 | PASS |
| R-04 | GET /api/tasks — authenticated → 5 tasks | PASS |
| R-05 | GET /api/tasks?status=todo → 3 tasks all todo | PASS |
| R-06 | POST /api/tasks — missing title → 400 | PASS |
| R-07 | GET /api/tasks/t1 → id t1 | PASS |
| R-08 | POST /api/auth/logout → 200 | PASS |

**Manual UI sign-off (TC-UI-015) is pending human execution.**

## Known Limitations

- Bulk status changes across multiple task cards are out of scope (Non-Goal).
- Mobile-specific gestures (swipe to change status) are out of scope (Non-Goal).
- Status transition guards or business rules (e.g., preventing Done → To Do) are out of scope (Non-Goal).
- The task edit modal (TC-UI-012 path) is unchanged by design (Non-Goal).
- No `statusChangedAt` or any new Task data model field was added (Non-Goal).
- RV-02 (Low): A formal TC-UI-015 manual test case document was not created as a separate file; the acceptance criteria checklist is included in the verification report instead.

## Reviewer Checklist

- [ ] New fields are optional and backward-compatible
- [ ] Existing `data-testid` attributes unchanged
- [ ] Existing API routes and response shapes unchanged
- [ ] Seed tasks `t1`–`t5` unmodified
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Manual regression: login, logout, task CRUD, status filters all work
- [ ] New feature works end-to-end per the FRs in requirements.md

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
