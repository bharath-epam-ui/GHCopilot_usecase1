# Architecture — KT-20

## 1. Jira Story

**Key:** KT-20
**Title:** Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Branch:** `feature/kt-20-inline-status-transitions-on-task-cards-to-do-in-progress-done`

---

## 2. KT-19 Audit — What Exists vs What KT-20 Requires

KT-19 (commit `92c31e5`) already implemented a substantial portion of this feature. The table below audits every KT-20 acceptance criterion against the current `components/TaskCard.tsx`.

| KT-20 Requirement | KT-19 Implementation | Gap? |
|---|---|---|
| `<select>` on every task card | `<select data-testid="inline-status-select">` present (line 104) | Testid name wrong (see Gap 1) |
| Optimistic update before API response | `setOptimisticStatus(newStatus)` before `await onStatusChange(...)` (lines 43–44) | None — satisfied |
| Dropdown disabled during in-flight | `disabled={isChangingStatus}` + `setIsChangingStatus(true)` before fetch (lines 108, 44) | None — satisfied |
| Error rollback to previous status | `setOptimisticStatus(previousStatus)` in catch block (line 50) | None — satisfied |
| Inline error message auto-dismissing after 3s | `setStatusError(...)` + `setTimeout(() => setStatusError(""), 3000)` (lines 51–52) | Timer not cleaned up on unmount (Gap 4) |
| `data-testid="task-status-select"` on select | `data-testid="inline-status-select"` | Gap 1 — wrong testid |
| `data-testid="task-status"` on pill unchanged | `<span data-testid="task-status" className="sr-only">` (line 100) | None — satisfied |
| `aria-label="Change status for <task title>"` | `aria-label="Change status"` (line 107) — no task title | Gap 2 — missing task title |
| `aria-live` region for screen reader announcements | Not present anywhere in TaskCard | Gap 3 — missing entirely |
| Timer cleared on component unmount | `setTimeout` return value discarded; no cleanup | Gap 4 — NFR-05 violation |
| `data-testid="task-status-error"` on error element | `data-testid="inline-status-error"` (line 118) | Gap 5 — OQ-3 decision (see below) |
| Filter list reflects change after success | `fetchTasks(filter)` called in `handleStatusChange` in dashboard (line 125) | None — satisfied |
| No new npm dependencies | No new packages added by KT-19 | None — satisfied |
| No new API routes | Uses existing PUT /api/tasks/:id | None — satisfied |
| No new required Task fields | No types.ts changes | None — satisfied |

**Summary — 5 gaps to close, all confined to `components/TaskCard.tsx`:**

- **Gap 1:** `data-testid="inline-status-select"` must become `data-testid="task-status-select"` (FR-09)
- **Gap 2:** `aria-label` must include the task title: `aria-label={\`Change status for ${task.title}\`}` (FR-08)
- **Gap 3:** An `aria-live="polite"` region must announce status changes to screen readers (FR-08)
- **Gap 4:** The 3-second dismiss timer must be cleaned up on unmount (NFR-05)
- **Gap 5 (OQ-3 resolved):** `data-testid="inline-status-error"` must become `data-testid="task-status-error"` to align with the `task-status-*` naming convention and enable targeted automated testing of AC5

No changes are required in any other file.

**Note on "spinner" in task summary:** The user's task summary listed "spinner during in-flight" as a gap. The formal requirements (NFR-01) explicitly state: "No spinner, loader, or layout shift shall occur during the optimistic phase; the disabled state on the dropdown is sufficient in-progress feedback." The KT-19 `disabled` state already satisfies this. No visual spinner is required.

---

## 3. Impacted Files

| File Path | Change Type | Reason |
|---|---|---|
| `components/TaskCard.tsx` | Modify | Close Gaps 1–5: rename testids, fix aria-label, add aria-live, fix timer cleanup |
| `lib/types.ts` | None | No new fields; TaskStatus union already covers all three values |
| `lib/store.ts` | None | PUT handler already accepts `Partial<Omit<Task,"id"\|"createdAt">>` including `status`; no filter or create logic changes needed |
| `app/api/tasks/route.ts` | None | No new query parameters or response fields |
| `app/api/tasks/[id]/route.ts` | None | PUT route already handles partial `{ status }` body; returns full updated Task |
| `components/TaskForm.tsx` | None | Task form modal path is explicitly out of scope (Non-Goal in requirements §4) |
| `app/dashboard/page.tsx` | None | `handleStatusChange` and `fetchTasks(filter)` already implemented correctly in KT-19 |

---

## 4. Data Model Changes

No changes to `lib/types.ts`. The existing `status: TaskStatus` field and `TaskStatus = "todo" | "in-progress" | "done"` union cover all transitions.

The requirements explicitly list adding a `statusChangedAt` field as a Non-Goal. No new fields are introduced.

**Existing fields (for reference — unchanged):**

| Field | Type | Optional? |
|---|---|---|
| id | string | no |
| title | string | no |
| description | string | no |
| status | TaskStatus | no |
| priority | TaskPriority | no |
| assignee | string | no |
| createdAt | string | no |
| updatedAt | string | no |

---

## 5. API Contract Changes

No API contract changes. The existing `PUT /api/tasks/:id` endpoint already satisfies all requirements:

**Existing PUT /api/tasks/:id (unchanged):**
- Auth: `Authorization: Bearer <token>` required
- Request body (partial): `{ status?: "todo" | "in-progress" | "done" }` — already accepted
- Response (200): `{ data: Task, message: "Task updated" }` — already returned
- Error responses: 401 (unauthenticated), 404 (task not found), unchanged

Confirm: No existing fields removed or renamed. No new routes added. Path `/api/tasks/:id` and verb `PUT` are preserved.

---

## 6. Store Logic Changes

No changes to `lib/store.ts`.

The `updateTask` function signature is:
```typescript
updateTask(username, id, data: Partial<Omit<Task, "id" | "createdAt">>)
```
This already handles `{ status: "todo" | "in-progress" | "done" }` as a valid partial update. The filter logic in `getAllTasks` (filtering by `t.status === status`) already causes re-fetched lists to exclude tasks whose status no longer matches the active filter — satisfying FR-07 without any store changes.

Seed tasks `t1`–`t5` are not modified.

---

## 7. UI Changes

### 7a. `components/TaskCard.tsx` — Primary change file

All five gaps are addressed here. No new state variables are needed beyond what KT-19 added; the changes are fixes and additions to existing code.

**Gap 1 — Rename select testid (line 106):**
Change `data-testid="inline-status-select"` to `data-testid="task-status-select"`.

Design note (DR-01 resolution — Option B): `TaskForm.tsx` already uses `data-testid="task-status-select"` on its own status dropdown (line 79 of TaskForm.tsx, inside the edit/create modal). Both elements can be simultaneously present in the DOM when the edit modal is open — `(showForm || editingTask) && <TaskModal>` renders while task cards remain mounted. The decision is to retain the same testid value on both elements (as specified in FR-09 and confirmed by the user) while formally requiring that all automated test selectors for the inline card control be scoped within `[data-testid="task-card"]`. See §8 (Decision DR-01) and §12 (Mandatory Test Scoping Constraint) for the formal record of this requirement.

**Gap 2 — Fix aria-label (line 107):**
Change `aria-label="Change status"` to `aria-label={\`Change status for ${task.title}\`}`.

This makes each dropdown's accessible name unique per card, so a screen reader user navigating with Tab across multiple cards can identify which task they are changing.

**Gap 3 — Add aria-live region:**
Add `aria-live="polite"` and `aria-atomic="true"` attributes to the existing `<span data-testid="task-status" className="sr-only">` element. This span already updates its text content to `statusLabels[optimisticStatus]` on every status change; making it a live region causes screen readers to announce the new value automatically.

The `data-testid="task-status"` attribute is preserved unchanged.

Resulting element:
```tsx
<span
  data-testid="task-status"
  className="sr-only"
  aria-live="polite"
  aria-atomic="true"
>
  {statusLabels[optimisticStatus]}
</span>
```

On optimistic update: announces immediately (e.g., "Done").
On rollback: announces the reverted value (e.g., "In Progress").

**Gap 4 — Fix timer cleanup:**
Replace the current inline `setTimeout` in the catch block with a `useEffect` that manages the timer lifecycle. The current code (line 52):
```tsx
setTimeout(() => setStatusError(""), 3000);
```
does not capture the timer ID, so it cannot be cancelled on unmount — violating NFR-05.

Replace with a `useEffect` keyed on `statusError`:
```tsx
useEffect(() => {
  if (!statusError) return;
  const timerId = setTimeout(() => setStatusError(""), 3000);
  return () => clearTimeout(timerId);
}, [statusError]);
```
Remove the `setTimeout` call from the catch block. The catch block only needs to call `setStatusError(...)`.

This approach:
- Fires only when `statusError` transitions from empty to non-empty
- Automatically cancels the timer if the component unmounts (React calls the cleanup function)
- Cancels the timer if `statusError` is cleared by any other path before 3 seconds

**Gap 5 — Rename error testid (line 118):**
Change `data-testid="inline-status-error"` to `data-testid="task-status-error"`.

**DR-02 — `<option>` element testids disposition:**
The three `<option>` elements in `TaskCard.tsx` carry `data-testid="inline-status-option-todo"`, `"inline-status-option-in-progress"`, and `"inline-status-option-done"`. FR-09 does not require option-level testids. These are out of scope for KT-20 and may be addressed under a future story if option-level test selectors are needed. They are not renamed as part of this story.

**Summary of line-level changes in TaskCard.tsx:**

| Location | Current | Change |
|---|---|---|
| `<select>` element | `data-testid="inline-status-select"` | `data-testid="task-status-select"` |
| `<select>` element | `aria-label="Change status"` | `aria-label={\`Change status for ${task.title}\`}` |
| `<span data-testid="task-status">` | No aria attributes | Add `aria-live="polite" aria-atomic="true"` |
| `useEffect` imports | `useState, useEffect` already imported | No change to imports |
| catch block (line ~52) | `setTimeout(() => setStatusError(""), 3000)` | Remove this line |
| New `useEffect` | Not present | Add timer-cleanup useEffect (keyed on `statusError`) |
| Error paragraph | `data-testid="inline-status-error"` | `data-testid="task-status-error"` |

### 7b. `components/TaskForm.tsx` — No changes

The task edit modal path is explicitly out of scope. The `data-testid="task-status-select"` on the form's status dropdown is preserved.

### 7c. `app/dashboard/page.tsx` — No changes

The `handleStatusChange` callback (lines 111–128) correctly:
- Issues `PUT /api/tasks/:id` with `{ status: newStatus }`
- Throws on non-2xx (bubble up to TaskCard catch block)
- Calls `fetchTasks(filter)` on success, which re-fetches with the active filter and removes tasks that no longer match (FR-07)

The `filter` state, `fetchTasks`, and filter button UI are all unchanged.

**DR-03 note:** `fetchTasks` calls `setLoading(true)` on every invocation, including after a successful status change. This produces a brief "Loading tasks…" indicator between the optimistic update and the final filtered list render. This is accepted pre-existing KT-19 behaviour and is outside the scope of KT-20; no dashboard changes are made to address it.

---

## 8. Component-Level Design Decisions

### OQ-1 Resolution: Dropdown vs pill rendering

KT-19 already established the pattern: the `<select>` is styled identically to a pill (using `statusColors` class, `rounded-full`, `px-2 py-0.5`) and is the sole visible status element. The `<span data-testid="task-status">` is `sr-only` (visually hidden, screen-reader accessible).

**Decision:** Keep this approach. The select IS the pill. No separate visible pill element is needed. This satisfies NFR-02 (no layout shift — the card dimensions do not change) and is already implemented by KT-19. The only change is adding `aria-live` to the sr-only span.

### OQ-3 Resolution: Error element testid

**Decision:** Use `data-testid="task-status-error"`. Rationale: The `task-status-*` naming prefix is more consistent with FR-09's specification convention (`task-status-select`), making it easier for test authors to find all status-related testids by prefix. Renaming from `inline-status-error` is acceptable at this stage because the KT-19 testids are part of an in-flight feature (no external test suite has taken a dependency on `inline-status-error`).

### DR-01 Resolution: Shared `task-status-select` testid on TaskCard and TaskForm

**Decision (Option B):** The inline select in `TaskCard.tsx` uses `data-testid="task-status-select"` as specified in FR-09. `TaskForm.tsx` already uses the same value and is not modified. Because both elements can be simultaneously present in the DOM (when the edit modal is open while task cards are rendered), all automated test selectors targeting the inline card control **must** scope within `[data-testid="task-card"]`. See §12 for the mandatory scoping constraint. The option to use a distinct testid (e.g., `task-card-status-select`) was considered but rejected in favour of honouring the explicit FR-09 and user-specified testid name. This decision is formally recorded here and in §12 so no implementer encounters the multi-match issue unexpectedly.

---

## 9. Data Flow

```
User selects new value in <select data-testid="task-status-select">
  │
  ├── [IMMEDIATE — synchronous]
  │     setOptimisticStatus(newStatus)
  │       → <span aria-live="polite"> updates to statusLabels[newStatus]
  │       → Screen reader announces new status label
  │       → Select styled with new statusColors[newStatus]
  │     previousStatus captured (local variable in handler)
  │     setIsChangingStatus(true)
  │       → disabled={isChangingStatus} disables the select
  │
  ├── [ASYNC — await onStatusChange(task.id, newStatus)]
  │     │
  │     │   PUT /api/tasks/:id  { status: newStatus }
  │     │   Authorization: Bearer <token>
  │     │
  │     ├── [SUCCESS 200]
  │     │     fetchTasks(filter) in dashboard
  │     │       → API returns tasks matching current filter
  │     │       → If task.status no longer matches filter, task removed from list
  │     │       → task prop updates → useEffect sets optimisticStatus = task.status
  │     │     [FINALLY] setIsChangingStatus(false) → select re-enabled
  │     │
  │     └── [FAILURE — non-2xx or network error]
  │           onStatusChange throws Error
  │           catch block:
  │             setOptimisticStatus(previousStatus)
  │               → <span aria-live="polite"> announces rollback status
  │               → Select reverts to previous style
  │             setStatusError("Failed to update status. Please try again.")
  │               → useEffect (keyed on statusError) fires:
  │                   timerId = setTimeout(() => setStatusError(""), 3000)
  │                   returns clearTimeout(timerId) as cleanup
  │               → <p data-testid="task-status-error"> appears on card
  │           [FINALLY] setIsChangingStatus(false) → select re-enabled
  │
  └── [AFTER 3000ms — if component still mounted]
        setStatusError("")
          → <p data-testid="task-status-error"> removed from DOM
```

---

## 10. Accessibility Design

**Keyboard navigation (already working via KT-19):**
The native `<select>` element is natively keyboard-accessible. Tab reaches it; arrow keys change the selected option; Enter/Space confirm. The `disabled` attribute during in-flight prevents key events from firing.

**aria-label (Gap 2 fix):**
```
aria-label={`Change status for ${task.title}`}
```
Pattern example for a task titled "Design login page":
`"Change status for Design login page"`

When a screen reader user tabs through the task list, each select announces its full purpose and the associated task. This satisfies FR-08's requirement that the screen reader "announces the control purpose."

**aria-live region (Gap 3 fix):**
The `<span data-testid="task-status" className="sr-only" aria-live="polite" aria-atomic="true">` element holds `statusLabels[optimisticStatus]`. Changes:

| Event | Span text changes to | Screen reader announces |
|---|---|---|
| User selects "Done" | "Done" | "Done" |
| Rollback on error | "In Progress" (previous) | "In Progress" |
| fetchTasks updates prop | (same value, no re-announce) | silence |

`aria-atomic="true"` ensures the full text is announced (not just the changed character). `aria-live="polite"` waits for a natural pause before speaking, avoiding interrupting other announcements.

Placement: The span sits above the select in the DOM (lines 100–103 in current code), so the live region fires on the optimistic update, before the `disabled` state is visually processed.

---

## 11. Error Handling Design

**Current KT-19 implementation (has a bug):**
```tsx
// In catch block:
setTimeout(() => setStatusError(""), 3000); // timer ID discarded
```
If the user navigates away (logout, route change) before 3 seconds, React will call `setStatusError("")` on an unmounted component, producing a React warning.

**KT-20 fix — useEffect timer pattern:**
```tsx
useEffect(() => {
  if (!statusError) return;
  const timerId = setTimeout(() => setStatusError(""), 3000);
  return () => clearTimeout(timerId);
}, [statusError]);
```

**Catch block becomes:**
```tsx
catch (err) {
  setOptimisticStatus(previousStatus);
  setStatusError(err instanceof Error ? err.message : "Failed to update status. Please try again.");
  // No setTimeout here — useEffect handles it
}
```

**Timer lifecycle:**
- Timer starts when `statusError` transitions from `""` to a non-empty string
- Timer is cancelled if component unmounts (cleanup function)
- Timer is cancelled and restarted if `statusError` changes before 3 seconds (e.g., rapid double-failure scenario — the 3s window resets)
- On success path: `statusError` is never set, so the useEffect does not fire

**Error message copy:** The error element displays `statusError` verbatim. The handler sets it to `err.message` (for API errors that return a descriptive message) or the fallback string `"Failed to update status. Please try again."` This is consistent with FR-06(b).

---

## 12. Test Coverage Impact

**New `data-testid` attributes to add (KT-20 additions):**

| Testid | Element | Condition | Notes |
|---|---|---|---|
| `task-status-select` | `<select>` | Always present | Replaces KT-19's `inline-status-select`; also present in TaskForm — see mandatory scoping constraint below |
| `task-status-error` | `<p>` | Only when `statusError !== ""` | Replaces KT-19's `inline-status-error` |

**Mandatory Test Scoping Constraint (DR-01):**
`data-testid="task-status-select"` appears on two elements that can be simultaneously present in the DOM: (1) the inline select on each task card (`TaskCard.tsx`) and (2) the status dropdown inside the edit/create modal (`TaskForm.tsx`). To avoid multi-match failures in automated tests, all selectors targeting the inline card control **must** be scoped within the containing task card element. Use one of these patterns:

- React Testing Library: `within(screen.getAllByTestId('task-card')[0]).getByTestId('task-status-select')`
- CSS selector: `[data-testid="task-card"] [data-testid="task-status-select"]`
- Playwright/Cypress: `page.locator('[data-testid="task-card"]').first().locator('[data-testid="task-status-select"]')`

Unscoped `getByTestId('task-status-select')` will throw on multi-match when the edit modal is open alongside rendered task cards.

**Existing `data-testid` attributes preserved (must not break):**

| Testid | Element | Test coverage concern |
|---|---|---|
| `task-status` | `<span className="sr-only">` | Now has `aria-live` added — not a breaking change for DOM queries |
| `task-card` | wrapper `<div>` | Unchanged |
| `task-title` | `<h3>` | Unchanged |
| `task-priority` | `<span>` | Unchanged |
| `task-assignee` | `<span>` | Unchanged |
| `edit-task-button` | `<button>` | Unchanged |
| `delete-task-button` | `<button>` | Unchanged |
| `task-description` | `<p>` | Unchanged |

**New manual test case warranted:** TC-UI-015 (per requirements §5 Q8), covering:
- AC1: To Do → In Progress optimistic update + persistence
- AC2: In Progress → Done + filter reflection
- AC3: Done → To Do + filter reflection
- AC4: In-flight lock (dropdown disabled during network request)
- AC5: Failure rollback via `[data-testid="task-status-error"]` + 3s auto-dismiss
- AC6: Keyboard Tab/arrow navigation + screen reader aria-label announcement

---

## 13. Backward Compatibility Statement

| File | Statement |
|---|---|
| `components/TaskCard.tsx` | All existing `data-testid` attributes (`task-card`, `task-id`, `task-title`, `edit-task-button`, `delete-task-button`, `task-description`, `task-status`, `task-priority`, `task-assignee`) remain present and unchanged; the KT-19 testids `inline-status-select` and `inline-status-error` are renamed as part of the KT-20 completion pass (these were not yet part of any released test contract) |
| `lib/types.ts` | Not modified; no fields added, removed, or made required |
| `lib/store.ts` | Not modified; seed tasks t1–t5 are untouched |
| `app/api/tasks/route.ts` | Not modified; GET and POST routes preserve all existing behaviour |
| `app/api/tasks/[id]/route.ts` | Not modified; GET, PUT, DELETE routes preserve all existing behaviour |
| `components/TaskForm.tsx` | Not modified; `data-testid="task-status-select"` on the form's status dropdown is preserved |
| `app/dashboard/page.tsx` | Not modified; all filter controls, state variables, and event handlers are preserved |

---

## 14. Rollback Strategy

Because all changes are confined to a single file (`components/TaskCard.tsx`) and are purely additive or renaming in nature, rollback is straightforward:

1. **Revert `components/TaskCard.tsx`** to the KT-19 state (commit `92c31e5`):
   ```
   git checkout 92c31e5 -- components/TaskCard.tsx
   ```
   This restores `inline-status-select`, `inline-status-error`, the original `aria-label`, and removes the `aria-live` attribute and the `useEffect` timer fix.

2. **No database or API migrations to undo** — no schema changes were made.

3. **No dependency changes to undo** — no new packages were added.

4. **Test suites** — any tests written against `task-status-select` or `task-status-error` would need to be reverted to `inline-status-select` / `inline-status-error` if rolling back. Document this in the test change log.

The rollback leaves the app in a fully functional KT-19 state. The only functional regression would be the NFR-05 timer-cleanup bug (which existed in KT-19) — acceptable for a rollback scenario.
