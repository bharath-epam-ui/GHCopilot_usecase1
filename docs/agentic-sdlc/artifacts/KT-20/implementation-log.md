# Implementation Log — KT-20

**Story:** KT-20 — Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Stage:** 5 — Implementation
**File changed:** `components/TaskCard.tsx`

---

## Tasks Applied

### TASK-01 | components/TaskCard.tsx | Add aria-live and aria-atomic to sr-only span

**Before:**
```tsx
<span data-testid="task-status" className="sr-only">
```

**After:**
```tsx
<span data-testid="task-status" className="sr-only" aria-live="polite" aria-atomic="true">
```

✅ TASK-01 | components/TaskCard.tsx | Added aria-live="polite" aria-atomic="true" to task-status sr-only span

---

### TASK-02 | components/TaskCard.tsx | Rename data-testid on select element

**Before:**
```tsx
data-testid="inline-status-select"
```

**After:**
```tsx
data-testid="task-status-select"
```

✅ TASK-02 | components/TaskCard.tsx | Renamed data-testid from inline-status-select to task-status-select

---

### TASK-03 | components/TaskCard.tsx | Update aria-label to template literal

**Before:**
```tsx
aria-label="Change status"
```

**After:**
```tsx
aria-label={`Change status for ${task.title}`}
```

✅ TASK-03 | components/TaskCard.tsx | Updated aria-label to include task.title as template literal

---

### TASK-04 | components/TaskCard.tsx | Replace bare setTimeout with useEffect timer cleanup

#### TASK-04a — Removed bare setTimeout from catch block

**Before (catch block):**
```tsx
} catch (err) {
  setOptimisticStatus(previousStatus);
  setStatusError(err instanceof Error ? err.message : "Failed to update status");
  setTimeout(() => setStatusError(""), 3000);
}
```

**After (catch block):**
```tsx
} catch (err) {
  setOptimisticStatus(previousStatus);
  setStatusError(err instanceof Error ? err.message : "Failed to update status");
  // No setTimeout here — useEffect manages the timer
}
```

#### TASK-04b — Added new useEffect keyed on [statusError]

**Inserted after the existing useEffect (after line 38):**
```tsx
useEffect(() => {
  if (!statusError) return;
  const timerId = setTimeout(() => setStatusError(""), 3000);
  return () => clearTimeout(timerId);
}, [statusError]);
```

✅ TASK-04 | components/TaskCard.tsx | Replaced bare setTimeout in catch with useEffect timer cleanup pattern

---

### TASK-05 | components/TaskCard.tsx | Rename data-testid on error paragraph

**Before:**
```tsx
<p data-testid="inline-status-error" className="text-red-500 text-xs mt-1">
```

**After:**
```tsx
<p data-testid="task-status-error" className="text-red-500 text-xs mt-1">
```

✅ TASK-05 | components/TaskCard.tsx | Renamed data-testid from inline-status-error to task-status-error

---

## Verification Results

### String checks (all pass)

| Check | Result |
|---|---|
| `data-testid="task-status-select"` present | PASS |
| `data-testid="task-status-error"` present | PASS |
| `aria-live="polite"` on task-status span | PASS |
| `aria-atomic="true"` on task-status span | PASS |
| `inline-status-select` does NOT appear | PASS |
| `inline-status-error` does NOT appear | PASS |
| `setTimeout` appears exactly once (inside useEffect) | PASS |
| No bare setTimeout in catch block | PASS |

### Preserved attributes (unchanged)

| Attribute | Present |
|---|---|
| `data-testid="task-card"` | PASS |
| `data-testid="task-id"` | PASS |
| `data-testid="task-title"` | PASS |
| `data-testid="edit-task-button"` | PASS |
| `data-testid="delete-task-button"` | PASS |
| `data-testid="task-description"` | PASS |
| `data-testid="task-status"` (sr-only span) | PASS |
| `data-testid="task-priority"` | PASS |
| `data-testid="task-assignee"` | PASS |
| `data-testid="inline-status-option-todo"` | PASS |
| `data-testid="inline-status-option-in-progress"` | PASS |
| `data-testid="inline-status-option-done"` | PASS |

---

## Lint and Build

--- Lint ---
✔ No ESLint warnings or errors
Result: ✅ passed

--- Build ---
▲ Next.js 14.2.35
 ✓ Compiled successfully
   Linting and checking validity of types ...
 ✓ Generating static pages (8/8)

Route (app)                              Size     First Load JS
┌ ○ /                                    1.22 kB        88.5 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ƒ /api/auth/login                      0 B                0 B
├ ƒ /api/auth/logout                     0 B                0 B
├ ƒ /api/tasks                           0 B                0 B
├ ƒ /api/tasks/[id]                      0 B                0 B
└ ○ /dashboard                           3.44 kB        90.7 kB
Result: ✅ passed

---

## Git Commit

Commit: `9519977`
Branch: `feature/kt-20-inline-status-transitions-on-task-cards-to-do-in-progress-done`
Message:
```
feat(kt-20): complete inline status controls - fix testids, aria-label, aria-live, timer cleanup

- Rename data-testid from inline-status-select to task-status-select (FR-09)
- Fix aria-label to include task title for screen reader context (FR-08)
- Add aria-live="polite" aria-atomic="true" to sr-only status span (FR-08)
- Replace bare setTimeout with useEffect timer cleanup pattern (NFR-05)
- Rename data-testid from inline-status-error to task-status-error (OQ-3)
```

Files changed: `components/TaskCard.tsx` only (1 file, 11 insertions, 5 deletions)
