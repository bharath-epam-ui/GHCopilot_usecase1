# Design Review — KT-20 (Second Pass)

**Reviewer:** Stage 3 Design Review Agent
**Story:** KT-20 — Inline status transitions on task cards (To Do ↔ In Progress ↔ Done)
**Pass:** 2 of 2 — patch verification after No-Go on first pass
**Input artifacts reviewed:**
- `docs/agentic-sdlc/artifacts/KT-20/requirements.md`
- `docs/agentic-sdlc/artifacts/KT-20/architecture.md` (patched)
**Prior verdict:** No-Go — blocking issue DR-01, plus Low findings DR-02 and DR-03
**This pass:** Verify all three patches; run full checklist for new findings

---

## Prior Finding Patch Verification

### DR-01 — Duplicate `task-status-select` testid (Medium — was blocking)

**Patch applied (Option B):**
- `architecture.md` §8 now contains a named decision block "DR-01 Resolution: Shared `task-status-select` testid on TaskCard and TaskForm". It explicitly states Option B was chosen, explains the concurrent-DOM scenario (edit modal open while task cards remain mounted), and cross-references §12.
- `architecture.md` §12 now contains a "Mandatory Test Scoping Constraint (DR-01)" subsection with three concrete, copy-ready selector patterns:
  - React Testing Library: `within(screen.getAllByTestId('task-card')[0]).getByTestId('task-status-select')`
  - CSS: `[data-testid="task-card"] [data-testid="task-status-select"]`
  - Playwright/Cypress: `page.locator('[data-testid="task-card"]').first().locator('[data-testid="task-status-select"]')`
- The unscoped failure mode (`getByTestId` throwing on multi-match) is explicitly called out.

**Verdict on patch: Adequate.** Both required locations are present, the concurrent-DOM risk is accurately described, and the scoping guidance is specific enough to implement directly.

---

### DR-02 — Undisposed `inline-status-option-*` testids on `<option>` elements (Low)

**Patch applied:**
- `architecture.md` §7a now contains an explicit "DR-02 — `<option>` element testids disposition:" paragraph. It names all three affected values (`inline-status-option-todo`, `inline-status-option-in-progress`, `inline-status-option-done`), notes FR-09 does not require option-level testids, and states they are out of scope for KT-20 and may be addressed in a future story. They are explicitly not renamed as part of this story.

**Verdict on patch: Adequate.** The disposition is unambiguous. The naming inconsistency (sibling `inline-*` options alongside renamed `task-*` elements) is now a documented and accepted state, not an overlooked gap.

---

### DR-03 — `fetchTasks` loading-flash not acknowledged in §7c (Low)

**Patch applied:**
- `architecture.md` §7c now contains a "DR-03 note:" that names `fetchTasks` calling `setLoading(true)` on every invocation, describes the observable brief "Loading tasks…" indicator between the optimistic update and the final filtered list render, and explicitly classifies it as accepted pre-existing KT-19 behaviour outside KT-20's scope, with no dashboard changes made.

**Verdict on patch: Adequate.** An implementer reading §7c will not be surprised by the loading flash or attempt to suppress it in a way that expands scope.

---

## Full Checklist — Second Pass

### Completeness

All 9 FRs, 5 NFRs, 4 risks, and 3 open questions are accounted for in the patched architecture. Coverage table is unchanged from the first pass and confirmed still accurate:

| FR | Architecture section | Status |
|---|---|---|
| FR-01 (select on every card) | §2 audit row 1; §7a Gap 1 | Covered |
| FR-02 (optimistic update) | §2 audit row 2; §9 data flow | Covered |
| FR-03 (PUT /api/tasks/:id) | §5; §7c | Covered |
| FR-04 (all transitions free) | §5; §6 | Covered |
| FR-05 (disabled during in-flight) | §2 audit row 3 | Covered |
| FR-06 (error rollback + 3s dismiss) | §7a Gap 4; §11 | Covered |
| FR-07 (filter reflects change) | §2 audit row 12; §7c | Covered |
| FR-08 (keyboard + accessibility) | §7a Gaps 2 & 3; §10 | Covered |
| FR-09 (data-testid attributes) | §7a Gap 1; §8 DR-01; §12 | Covered — with scoping constraint documented |

| NFR | Architecture section | Status |
|---|---|---|
| NFR-01 (100ms optimistic) | §2; §9 | Covered |
| NFR-02 (layout stability) | §8 OQ-1 resolution | Covered |
| NFR-03 (no new dependencies) | §2 audit row 13 | Covered |
| NFR-04 (backward compat) | §13 | Covered |
| NFR-05 (timer cleanup on unmount) | §7a Gap 4; §11 | Covered |

| Risk | Architecture treatment | Status |
|---|---|---|
| R1 (KT-19 overlap) | §2 full audit table | Covered |
| R2 (race condition) | §2 audit row 3 | Covered |
| R3 (filter state) | §7c; §9 success branch | Covered |
| R4 (unmount timer) | §7a Gap 4; §11 | Covered |

| OQ | Resolution | Status |
|---|---|---|
| OQ-1 (dropdown vs pill) | §8 — select IS the pill | Resolved |
| OQ-2 (from-scratch vs patch) | §2 — audit/patch approach | Resolved |
| OQ-3 (error testid) | §8; §7a Gap 5 — `task-status-error` | Resolved |

No completeness gaps found.

---

### Correctness

No issues found. The data flow in §9 accurately models the synchronous optimistic-then-async-fetch pattern. The `useEffect` timer pattern in §11 correctly handles the error-dismiss lifecycle including rapid double-failure (timer restarts) and unmount (cleanup fires). The `aria-live="polite"` placement on the sr-only span (which updates on optimistic change) means screen reader announcements fire before the disabled state is fully processed, which is the correct order.

### Backward Compatibility

No issues found. §13 covers all seven files in the impacted-file table. `inline-status-select` and `inline-status-error` are explicitly noted as safe to rename (no external test contract dependency). All other existing testids and API shapes are unchanged.

### Optional Fields

No issues found. No new fields are introduced. §4 explicitly confirms `lib/types.ts` is unmodified.

### API Contract

No issues found. §5 confirms route paths, HTTP verbs, request/response shapes, and error codes are all unchanged.

### UI Consistency

No issues found. The `task-status-*` naming family (`task-status`, `task-status-select`, `task-status-error`) is internally consistent. The retained `inline-status-option-*` values on `<option>` elements are explicitly documented as a deferred inconsistency (DR-02 resolution).

### Error Handling

No issues found. §11 covers the full error lifecycle: rollback, error message text sourcing (`err.message` with fallback), timer management, rapid double-failure, and unmount cancellation.

### Security

No issues found. No server-side changes are made. The existing bearer token authorization on `PUT /api/tasks/:id` is unmodified. No secrets are exposed in the UI layer.

### DRY / Clarity

No issues found. The patches are additive documentation text. No logic is duplicated.

### Scope Creep

No issues found. The four patched locations (§7a DR-02 note, §7c DR-03 note, §8 DR-01 decision, §12 scoping constraint) are all documentation clarifications of existing design decisions. No new features, fields, routes, or dependencies are introduced.

---

## Findings

### New finding from second pass

**Finding DR-04**
- Severity: Low (informational — does not block Stage 4)
- Location: `architecture.md` §13 (Backward Compatibility Statement), `requirements.md` §7 NFR-04
- Issue: The backward compatibility statement in §13 lists `task-id` as a preserved `data-testid` attribute (`task-card`, `task-id`, `task-title`, …). NFR-04 in requirements.md does not list `task-id` in its preserved-attributes enumeration. This is a pre-existing discrepancy introduced before the KT-20 architecture was written; neither the first-pass review nor any patch introduced it. The inconsistency is harmless — the architecture's intent is to preserve testids, not remove them, so listing an extra one in §13 does not create a correctness or compatibility risk.
- Resolution: No action required before Stage 4. If desired, §13 can be aligned with NFR-04's list in a future editorial pass.

### All prior findings

**Finding DR-01** — Resolved. See patch verification above.

**Finding DR-02** — Resolved. See patch verification above.

**Finding DR-03** — Resolved. See patch verification above.

---

## Decisions

The following design choices are explicitly agreed upon and carried forward from both passes:

1. **Audit-and-patch approach.** KT-20 is a completion pass over KT-19. The 5 gaps in §2 of architecture.md are the complete change set.
2. **Option B for DR-01.** The inline select retains `data-testid="task-status-select"` (matching FR-09 exactly and the existing `TaskForm.tsx` value). All automated test selectors for the inline card control must scope within `[data-testid="task-card"]`. Concrete patterns are mandated in §12.
3. **Select IS the pill.** The `<select>` is styled as the status pill using `statusColors` and `rounded-full`. The `<span data-testid="task-status" className="sr-only">` provides screen-reader text only. OQ-1 resolved.
4. **`task-status-error` as the error testid.** OQ-3 resolved. Rename from `inline-status-error` is safe — no external test contract dependency on the KT-19 value.
5. **`inline-status-option-*` retained as-is.** The three `<option>` testids are out of scope for KT-20 and not renamed. DR-02 resolved by explicit documentation.
6. **Loading-flash accepted.** The brief "Loading tasks…" indicator after a successful status change is accepted pre-existing KT-19 behaviour. No dashboard changes are made to suppress it. DR-03 resolved by explicit documentation.
7. **`useEffect` timer pattern for NFR-05.** The 3-second dismiss timer is managed via `useEffect` keyed on `statusError`. The catch block only calls `setStatusError(...)`; the effect owns the timer and its cleanup.
8. **`aria-live="polite"` on the sr-only span.** The existing `<span data-testid="task-status" className="sr-only">` gains `aria-live="polite" aria-atomic="true"`. The `data-testid` is not changed.
9. **No spinner.** NFR-01 explicitly prohibits a spinner during the optimistic phase. The `disabled` state on the `<select>` is the sole in-progress feedback.
10. **No changes outside `components/TaskCard.tsx`.** `lib/types.ts`, `lib/store.ts`, both API routes, `TaskForm.tsx`, and `app/dashboard/page.tsx` are unchanged.

---

## Required Changes to architecture.md

None — architecture approved as written. All three prior required changes have been applied. DR-04 is informational and does not require an architecture update before Stage 4.

---

## Verdict

**Verdict: Go**

All first-pass findings (DR-01, DR-02, DR-03) are resolved. The single new finding (DR-04) is Low severity and informational — it does not affect functional correctness, test coverage, or implementation guidance. Proceed to Stage 4.
