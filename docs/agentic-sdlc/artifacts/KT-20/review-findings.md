# Review Findings — KT-20

**Story:** KT-20 — Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Stage:** 6 — Code Review
**Reviewer:** Stage 6 Review Agent
**Date:** 2026-11-06
**Files Changed:** `components/TaskCard.tsx` (only)
**Commit Reviewed:** `9519977`

---

## Per-Check Results

| # | Check | Requirement | Result |
|---|---|---|---|
| 1 | `data-testid="task-status-select"` on `<select>` | FR-09 | PASS — line 111 |
| 2 | `data-testid="task-status-error"` on error `<p>` | FR-09 | PASS — line 124 |
| 3 | `data-testid="task-status"` on sr-only span preserved | FR-09 | PASS — line 106 |
| 4 | `aria-label` includes `task.title` as template literal | FR-08 | PASS — line 112 |
| 5 | `aria-live="polite" aria-atomic="true"` on sr-only span | FR-08 | PASS — line 106 |
| 6 | `useEffect` keyed on `[statusError]` returns `clearTimeout` | NFR-05 | PASS — lines 40–44 |
| 7 | No bare `setTimeout` in catch block | NFR-05 | PASS — catch block only calls `setStatusError` |
| 8 | All existing `data-testid` attributes preserved (12 of 12) | NFR-04 | PASS — see Verified Items |
| 9 | No changes to files outside `components/TaskCard.tsx` | Architecture | PASS |
| 10 | No new npm dependencies | NFR-03 | PASS — `package.json` unchanged |
| 11 | No new required fields on `Task` interface | NFR-04 | PASS — `lib/types.ts` unchanged |
| 12 | Optimistic update before `await onStatusChange(...)` | FR-02 | PASS — lines 49–53 |
| 13 | `disabled={isChangingStatus}` on `<select>` | FR-05 | PASS — line 114 |
| 14 | `setOptimisticStatus(previousStatus)` in catch | FR-06 | PASS — line 56 |
| 15 | TypeScript — template literal uses `task.title: string` | FR-08 | PASS — no type errors; build passes |
| 16 | `useEffect` dependency array is `[statusError]` only | NFR-05 | PASS — `setStatusError` is a stable dispatch function |
| 17 | Seed tasks `t1`–`t5` unchanged | NFR-04 | PASS — `lib/store.ts` not modified |
| 18 | API routes and HTTP verbs unchanged | NFR-04 | PASS — `app/api/` not modified |

---

## Findings

**Finding RV-01**
- Severity: Low
- File + Location: `components/TaskCard.tsx` line 57
- Issue: The fallback error message in the catch block reads `"Failed to update status"`. The architecture specification (§11, Error Handling Design) and FR-06(b) example both specify `"Failed to update status. Please try again."` The current text is informative but omits the action prompt at the end.
- Recommendation: Change the fallback string on line 57 to `"Failed to update status. Please try again."` to match the approved architecture copy. This is a low-risk one-line change.

**Finding RV-02**
- Severity: Low
- File + Location: `docs/agentic-sdlc/artifacts/KT-20/` (missing file)
- Issue: Requirements §5 Q8 and Architecture §12 both specify that a new manual test case TC-UI-015 should be created, covering AC1 (To Do → In Progress optimistic update), AC2 (filter reflection on Done), AC3 (Done → To Do reopen), AC4 (in-flight lock), AC5 (failure rollback via `task-status-error`), and AC6 (keyboard + screen reader). No `manual-tests/test-cases.md` exists in the KT-20 artifact folder or anywhere in the repository.
- Recommendation: Create `docs/agentic-sdlc/artifacts/KT-20/manual-tests/test-cases.md` with TC-UI-015 before or during Stage 7 verification. This does not block the PR merge, but the verification agent will have no documented test cases to execute against.

---

## Verified Items

- Seed tasks `t1`–`t5` unchanged — confirmed (`git diff main -- lib/store.ts` returned empty)
- All existing `data-testid` attributes preserved — confirmed (12 attributes verified in the current file: `task-card`, `task-id`, `task-title`, `edit-task-button`, `delete-task-button`, `task-description`, `task-status`, `task-priority`, `task-assignee`, `inline-status-option-todo`, `inline-status-option-in-progress`, `inline-status-option-done`)
- No new npm dependencies added — confirmed (`git diff main -- package.json` returned empty)
- `lib/types.ts` not modified — confirmed (`git diff main -- lib/types.ts` returned empty)
- `lib/store.ts` not modified — confirmed (`git diff main -- lib/store.ts` returned empty)
- All API route exports present and unchanged — confirmed (`GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/[id]`, `POST /api/auth/login`, `POST /api/auth/logout`)
- Build passes with zero errors — confirmed (implementation log: Next.js 14, 8/8 static pages, `✓ Compiled successfully`)
- Lint passes with zero warnings or errors — confirmed (implementation log)
- Only `components/TaskCard.tsx` was changed (1 file, 11 insertions, 5 deletions) — confirmed via `git diff 2d97379..HEAD`

---

## Required Fixes Before PR

None. No High severity findings were identified. Both findings are Low severity and do not block Stage 7.

RV-01 (error message copy) is a minor copy deviation and should be addressed at the implementer's discretion before merge.

RV-02 (missing TC-UI-015) should be created as part of Stage 7 preparation; the verification agent needs documented acceptance criteria to execute against.

---

## Verdict

**Verdict: Go**

2 findings total: 0 High, 0 Medium, 2 Low. No blocking issues. Proceed to Stage 7.

All 5 architecture gaps (Gap 1–Gap 5) are correctly and completely implemented in `components/TaskCard.tsx`. The optimistic update, disabled state, rollback, timer cleanup, accessibility attributes, and testid renames all conform to the approved architecture and functional requirements.
