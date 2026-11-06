# Implementation Plan — KT-20

**Story:** KT-20 — Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Stage:** 4 — Implementation Plan
**Input artifacts:**
- `docs/agentic-sdlc/artifacts/KT-20/requirements.md`
- `docs/agentic-sdlc/artifacts/KT-20/architecture.md`
- `docs/agentic-sdlc/artifacts/KT-20/design-review.md` (Verdict: **Go**)
**Source file audited:** `components/TaskCard.tsx` (136 lines, as of KT-19 commit `92c31e5`)

---

## Task List

All five tasks target the single file `components/TaskCard.tsx`. They are independent of each other (each touches a different location in the file) and must be applied in a single edit pass to avoid diff conflicts.

```
TASK-01 | File: components/TaskCard.tsx | S | Add aria-live="polite" and aria-atomic="true" attributes to the existing <span data-testid="task-status" className="sr-only"> element at line 100; do NOT change data-testid="task-status" or the className
TASK-02 | File: components/TaskCard.tsx | S | Rename data-testid attribute on the <select> element (line 105) from "inline-status-select" to "task-status-select"; no other attributes on this element change in this task
TASK-03 | File: components/TaskCard.tsx | S | Change aria-label on the <select> element (line 106) from the string literal "Change status" to the template literal {`Change status for ${task.title}`}; no other attributes on this element change in this task
TASK-04 | File: components/TaskCard.tsx | M | (a) Remove the bare setTimeout call from the catch block (line 52: `setTimeout(() => setStatusError(""), 3000);`), keeping only the two setOptimisticStatus and setStatusError calls in the catch block; (b) Add a new useEffect block (after the existing useEffect at line 36–38) keyed on [statusError]: `useEffect(() => { if (!statusError) return; const timerId = setTimeout(() => setStatusError(""), 3000); return () => clearTimeout(timerId); }, [statusError]);` — useState and useEffect are already imported on line 3, no import changes needed
TASK-05 | File: components/TaskCard.tsx | S | Rename data-testid attribute on the error <p> element (line 118) from "inline-status-error" to "task-status-error"; no other attributes or content on this element change
```

### Line-level reference table (current file state before edits)

| Task | Current line(s) | Current text | Replacement |
|---|---|---|---|
| TASK-01 | 100 | `<span data-testid="task-status" className="sr-only">` | `<span data-testid="task-status" className="sr-only" aria-live="polite" aria-atomic="true">` |
| TASK-02 | 105 | `data-testid="inline-status-select"` | `data-testid="task-status-select"` |
| TASK-03 | 106 | `aria-label="Change status"` | `` aria-label={`Change status for ${task.title}`} `` |
| TASK-04a | 52 | `setTimeout(() => setStatusError(""), 3000);` | _(remove this line)_ |
| TASK-04b | after line 38 | _(not present)_ | Add useEffect block (see description above) |
| TASK-05 | 118 | `data-testid="inline-status-error"` | `data-testid="task-status-error"` |

### Resulting catch block after TASK-04a

```tsx
} catch (err) {
  setOptimisticStatus(previousStatus);
  setStatusError(err instanceof Error ? err.message : "Failed to update status");
  // No setTimeout here — useEffect manages the timer
}
```

### Resulting useEffect block after TASK-04b (insert after the existing useEffect on lines 36–38)

```tsx
useEffect(() => {
  if (!statusError) return;
  const timerId = setTimeout(() => setStatusError(""), 3000);
  return () => clearTimeout(timerId);
}, [statusError]);
```

### Attributes that must NOT change

The following attributes are explicitly preserved — do not rename, remove, or modify them:

| Attribute | Element | Line |
|---|---|---|
| `data-testid="task-card"` | wrapper `<div>` | 61 |
| `data-testid="task-id"` | `<p>` | 66 |
| `data-testid="task-title"` | `<h3>` | 69 |
| `data-testid="edit-task-button"` | `<button>` | 75 |
| `data-testid="delete-task-button"` | `<button>` | 82 |
| `data-testid="task-description"` | `<p>` | 92 |
| `data-testid="task-status"` | `<span>` | 100 |
| `data-testid="task-priority"` | `<span>` | 123 |
| `data-testid="task-assignee"` | `<span>` | 129 |
| `data-testid="inline-status-option-todo"` | `<option>` | 112 |
| `data-testid="inline-status-option-in-progress"` | `<option>` | 113 |
| `data-testid="inline-status-option-done"` | `<option>` | 114 |

---

## Blocked Tasks

None. All five tasks are in `components/TaskCard.tsx` and touch separate, non-overlapping locations in the file. They have no logical dependencies on each other.

Practical constraint: because they all edit the same file, apply all five changes in a single editing pass (one write operation) to avoid intermediate states that fail TypeScript compilation.

---

## Validation Plan

```
TASK-01 — Inspect components/TaskCard.tsx: <span data-testid="task-status" className="sr-only"> has aria-live="polite" and aria-atomic="true"; data-testid="task-status" is still present and unchanged; `npm run build` passes
TASK-02 — Inspect components/TaskCard.tsx: <select> has data-testid="task-status-select"; the string "inline-status-select" does not appear anywhere in the file; `npm run build` passes
TASK-03 — Inspect components/TaskCard.tsx: <select> aria-label attribute is the template literal `Change status for ${task.title}` (backtick syntax); the string "Change status" as a plain string literal does not appear; `npm run build` passes
TASK-04 — Inspect components/TaskCard.tsx: (a) the string "setTimeout" appears exactly once (inside the new useEffect, not in the catch block); (b) a useEffect with [statusError] dependency array is present; (c) the catch block contains only setOptimisticStatus and setStatusError calls; `npm run build` passes
TASK-05 — Inspect components/TaskCard.tsx: error <p> element has data-testid="task-status-error"; the string "inline-status-error" does not appear anywhere in the file; `npm run build` passes
```

### Overall done criteria

All five conditions must be true simultaneously:

1. `components/TaskCard.tsx` contains `data-testid="task-status-select"` on the `<select>` and `data-testid="task-status-error"` on the error `<p>`.
2. `components/TaskCard.tsx` contains `aria-live="polite"` and `aria-atomic="true"` on the `<span data-testid="task-status">` element.
3. `components/TaskCard.tsx` aria-label on the `<select>` is the template literal form including `task.title`.
4. `components/TaskCard.tsx` has no bare `setTimeout` call in the catch block; the timer-cleanup `useEffect` keyed on `[statusError]` is present.
5. `npm run lint` exits 0 and `npm run build` completes without TypeScript errors.

---

## Out-of-Scope Reminder

_Copied verbatim from `docs/agentic-sdlc/artifacts/KT-20/requirements.md` §4:_

- Bulk status changes across multiple task cards simultaneously.
- Mobile-specific gestures (swipe to change status).
- A "next status only" single-action button that enforces a one-way linear workflow — all transitions are freely selectable.
- Status transition guards or business rules that restrict certain direction changes (e.g., preventing Done → To Do). All six direction combinations are permitted.
- Any change to the task edit modal (TC-UI-012 path remains unchanged).
- Export, reporting, or analytics on status transitions.
- Adding a `statusChangedAt` or any other new field to the Task data model.
- New API routes — the existing `PUT /api/tasks/:id` endpoint is used as-is.
