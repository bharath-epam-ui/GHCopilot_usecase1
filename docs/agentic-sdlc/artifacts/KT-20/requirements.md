# Requirements — KT-20

## 1. Jira Story

**Key:** KT-20
**URL:** https://bharathwaj1390.atlassian.net/browse/KT-20
**Title:** Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Status:** To Do
**Priority:** Medium

---

## 2. Problem Statement

Users who want to advance or revert a task's status must currently open the full edit modal, change the status dropdown inside the form, and submit — even when that is the only change they intend to make. This extra navigation friction slows down routine workflow management. Users need a way to change a task's status directly from the task card, with the change taking effect immediately and reflecting in the filtered list view, so they can keep tasks moving through the pipeline without leaving the dashboard context.

---

## 3. Goals

- Expose an inline `<select>` dropdown on every task card showing the task's current status and all three options (To Do, In Progress, Done).
- Persist status changes immediately via the existing `PUT /api/tasks/:id` API endpoint.
- Apply an optimistic UI update so the status pill changes before the API round-trip completes.
- Disable the control during the in-flight request to prevent duplicate submissions.
- Roll back the optimistic change and display an inline error on the card if the API call fails; auto-dismiss the error after 3 seconds.
- Reflect the status change in the dashboard's active filter immediately (a task moved to "Done" disappears from the "In Progress" filter view without a page reload).
- Ensure keyboard users can operate the inline dropdown and screen readers announce its label and current value.

---

## 4. Non-Goals

- Bulk status changes across multiple task cards simultaneously.
- Mobile-specific gestures (swipe to change status).
- A "next status only" single-action button that enforces a one-way linear workflow — all transitions are freely selectable.
- Status transition guards or business rules that restrict certain direction changes (e.g., preventing Done → To Do). All six direction combinations are permitted.
- Any change to the task edit modal (TC-UI-012 path remains unchanged).
- Export, reporting, or analytics on status transitions.
- Adding a `statusChangedAt` or any other new field to the Task data model.
- New API routes — the existing `PUT /api/tasks/:id` endpoint is used as-is.

---

## 5. Clarifying Q&A

The following questions were presented to the user. Questions Q1–Q3 received explicit answers. Questions Q4–Q8 were not answered directly; the recorded answers are derived from the Jira acceptance criteria and the existing codebase.

**Q1. What control type should be used for the inline status change?**
User answer: A native `<select>` dropdown showing all three statuses (To Do, In Progress, Done).

**Q2. Should all status transitions be allowed in both directions?**
User answer: Yes — all transitions are freely allowed in both directions (e.g., Done → To Do, Done → In Progress, In Progress → To Do).

**Q3. How should API failure be communicated to the user?**
User answer: Inline error message on the card itself; auto-dismisses after 3 seconds.

**Q4. What is explicitly out of scope?**
Derived: Bulk operations, mobile gestures, keyboard-shortcut-only navigation, export/reporting, and any new API routes or data model fields. The edit modal path (TC-UI-012) is not modified.

**Q5. Should the inline control be visible to all users or only admins?**
Derived from story context ("As a task manager user"): Visible and operable by all authenticated users, consistent with the existing edit/delete controls which carry no role restriction.

**Q6. If new fields are needed on Task, should they be optional or required?**
Derived: No new fields are required. The existing `status: TaskStatus` field covers the transition. Per project guardrails, any future addition must be optional.

**Q7. For each acceptance criterion, what does a clear pass look like?**
Derived:
- AC1 (To Do → In Progress): Select "In Progress" in the dropdown; the status pill on the card updates immediately without a full page reload; refreshing the page shows "In Progress" persisted.
- AC2 (In Progress → Done, filter reflection): After changing to Done, clicking the "Done" filter shows the task; clicking "In Progress" filter does not show the task.
- AC3 (Done → To Do reopen): Same filter reflection as AC2 but reversed — task appears under "To Do" filter, not under "Done".
- AC4 (in-flight lock): While the network request is pending, the dropdown is visually disabled; a second interaction has no effect.
- AC5 (failure rollback): With the network request forced to fail (e.g., throttled/mocked error), the status pill reverts to its pre-change value and an inline error message appears on the card, disappearing after 3 seconds.
- AC6 (keyboard + screen reader): Tab key reaches the dropdown; arrow keys or spacebar change the selected value; a screen reader tool announces the control label and new value on change.

**Q8. Are there existing test cases this story extends or replaces?**
Derived: TC-UI-012 (Edit an Existing Task) tests status change via the edit modal and remains unchanged. This story warrants a new manual test case (TC-UI-015 or similar) covering the inline status dropdown path, including the error rollback and keyboard navigation sub-cases.

---

## 6. Functional Requirements

**FR-01** — Inline status dropdown present on every task card
Each task card rendered in the dashboard task list (`data-testid="task-card"`) shall contain a native `<select>` element displaying the task's current status as the selected option, with all three options always available: "To Do" (`todo`), "In Progress" (`in-progress`), "Done" (`done`).
_Pass criterion:_ A task card is visible; the dropdown shows the correct current status as selected; all three options are present in the dropdown.

**FR-02** — Optimistic UI update on selection
When the user selects a different status from the dropdown, the status pill on the card shall update to the new value immediately, before the API response is received.
_Pass criterion:_ With network throttled to 2 s, selecting a new status causes the pill to change visually within 100 ms; the spinner/disabled state appears on the dropdown.

**FR-03** — Status persisted via PUT /api/tasks/:id
The status change shall be sent as `PUT /api/tasks/:id` with body `{ "status": "<new-value>" }` using the authenticated user's bearer token.
_Pass criterion:_ Network tab shows a single PUT request to `/api/tasks/:id` with the correct body; response is 200 with the updated task.

**FR-04** — All transitions freely permitted
No client-side or server-side rule shall block any direction of transition. All six combinations (todo↔in-progress, todo↔done, in-progress↔done) must be selectable.
_Pass criterion:_ Starting from "Done", the dropdown allows selecting "To Do"; the change persists.

**FR-05** — Dropdown disabled during in-flight request
From the moment the user makes a selection until the API response (success or failure) is received, the `<select>` element shall have its `disabled` attribute set, preventing further interactions.
_Pass criterion:_ With network throttled to 2 s, the dropdown is unclickable/unresponsive during the pending request.

**FR-06** — Error rollback with inline message
If the `PUT /api/tasks/:id` request returns any non-2xx response or a network error:
  (a) The status pill and dropdown selection shall revert to the status value that was active before the user's selection.
  (b) An inline error message shall appear on the card (e.g., "Failed to update status. Please try again.").
  (c) The error message shall auto-dismiss after 3 seconds.
_Pass criterion:_ With the API mocked to return 500, the pill reverts to its original status, an error message is visible on the card, and it disappears after ~3 seconds without user action.

**FR-07** — Filter list reflects change immediately
After a successful status change:
  (a) If the dashboard has an active status filter, any task whose new status no longer matches the filter shall be removed from the visible list immediately.
  (b) If the filter matches the new status, the task remains visible.
_Pass criterion:_ With "In Progress" filter active, changing a visible task to "Done" causes it to disappear from the list; switching to the "Done" filter shows it.

**FR-08** — Keyboard navigation and accessibility
The inline status `<select>` shall be reachable via Tab key focus order and operable using arrow keys or spacebar. It shall carry an `aria-label` (e.g., `"Change status for <task title>"`) so screen readers announce both the control purpose and the current value.
_Pass criterion:_ Tab key reaches the dropdown on a task card; a value change via keyboard triggers the same FR-03/FR-05/FR-06 flow; VoiceOver/NVDA announces the label on focus.

**FR-09** — New data-testid attributes
The inline status `<select>` element shall carry a new `data-testid` attribute (e.g., `task-status-select`). The existing `data-testid="task-status"` on the status pill must remain present and unchanged.
_Pass criterion:_ Both `[data-testid="task-status"]` and `[data-testid="task-status-select"]` are present on every rendered task card.

---

## 7. Non-Functional Requirements

**NFR-01 — Performance**
The optimistic visual update (pill change) shall be perceptible within 100 ms of the user's selection. No spinner, loader, or layout shift shall occur during the optimistic phase; the disabled state on the dropdown is sufficient in-progress feedback.

**NFR-02 — Layout stability**
The inline dropdown shall not alter the height or width of the task card. It replaces or augments the static status pill within the existing card layout. No layout shift (CLS) shall be introduced.

**NFR-03 — No new dependencies**
No new npm packages shall be installed. The implementation shall use React state (`useState`), standard `fetch`, and existing Tailwind CSS utility classes.

**NFR-04 — Backward compatibility**
- Existing `data-testid` attributes (`task-card`, `task-status`, `task-title`, `task-priority`, `task-assignee`, `edit-task-button`, `delete-task-button`) must remain present and unchanged.
- API route paths (`/api/tasks`, `/api/tasks/:id`), HTTP verbs, and response shapes must not change.
- The `Task` interface in `lib/types.ts` must not gain any required fields.
- Seed tasks `t1`–`t5` in `lib/store.ts` must remain unmodified.

**NFR-05 — Error auto-dismiss timing**
The inline error message shall use a client-side timer (e.g., `setTimeout`) set to 3000 ms. The timer shall be cleared if the component unmounts before it fires, to prevent state updates on unmounted components.

---

## 8. Risks and Assumptions

**Assumption A** — The existing `PUT /api/tasks/:id` endpoint accepts a partial body `{ "status": "todo" | "in-progress" | "done" }` and returns 200 with the full updated task. No server-side changes are needed for this story.

**Assumption B** — The status control is scoped to the authenticated user's own task list. Because the API is already user-scoped (token identifies the user), no additional authorization logic is required at the component level.

**Assumption C** — All authenticated users (admin and user1) are permitted to change the status of any task visible to them. No role-based restriction applies.

**Risk R1 — Overlap with KT-19**
Commit `92c31e5` ("feat(kt-19): add inline status controls to task cards") has already been merged to the branch. KT-20 covers substantially the same feature as KT-19. The implementation stage must audit the KT-19 code against KT-20's acceptance criteria (specifically optimistic update, error rollback, accessibility) and treat KT-20 as an enhancement/completion pass rather than a net-new build, to avoid duplicate or conflicting implementations.

**Risk R2 — Race condition on rapid selections**
If the user selects a new status while a previous request is still in flight, the disabled state (FR-05) prevents the second interaction client-side. However, if the disabled state is not enforced correctly, two concurrent PUT requests could result in a stale final state. The implementation must enforce the disabled state before initiating the fetch.

**Risk R3 — Filter state management**
The dashboard currently filters tasks from local component state. After an inline status change, if the filter list is not updated in the same state update that persists the API response, a task may briefly appear under the wrong filter. The implementation must update the task list state atomically with the API success response.

**Risk R4 — Error message cleanup on unmount**
If a user navigates away (logs out, route change) while the 3-second auto-dismiss timer is running, a `setState` call on an unmounted component will occur unless the timer is properly cancelled in a `useEffect` cleanup function.

---

## 9. Open Questions

**OQ-1** — Does the inline dropdown replace the static status pill entirely (pill hidden, dropdown always shown), or does the pill remain visible alongside the dropdown? The Jira story says "status pill updates" which implies the pill is still present; the dropdown is an additional interactive element. Architecture stage should decide the exact rendering approach.

**OQ-2** — KT-19 (Inline Status Controls) is already implemented. Should the KT-20 implementation ticket be scoped as "implement from scratch" or "audit KT-19 implementation against KT-20 ACs and patch gaps"? This should be confirmed before the architecture stage begins, to avoid re-implementing existing code.

**OQ-3** — Should the inline error message on the card have a `data-testid` attribute for automated testing (e.g., `task-status-error`)? This was not specified in the Jira story but is recommended to satisfy AC5 test coverage. Confirm before implementation.
