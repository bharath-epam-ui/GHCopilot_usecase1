# Requirements — KT-12

**Jira Story:** [KT-12](https://bharathwaj1390.atlassian.net/browse/KT-12)  
**Story Title:** KT-CAPSTONE-DEMO: Task Search and Advanced Filtering  
**Generated:** 2026-08-03  
**Status:** Active — future demo story (Option B)

---

## 1. Jira Story

**Key:** KT-12  
**URL:** https://bharathwaj1390.atlassian.net/browse/KT-12  
**Summary:** As an authenticated user, I want to search tasks and apply combined filters so I can find relevant tasks quickly  

---

## 2. Problem Statement

The current Task Manager supports only basic filtering by **status** (todo / in-progress / done / overdue) and **assignee**. Users with many tasks cannot efficiently locate specific items when they need to search by keywords or narrow results by priority level. This leads to manual scanning through long task lists and wastes time.

This story introduces **keyword search** (title and description) and **priority filtering** to enable users to quickly find relevant tasks using multiple combined filters.

---

## 3. Goals

- Enable users to search tasks by keyword (title and description) with case-insensitive matching
- Allow filtering by task priority (low / medium / high) in addition to existing status and assignee filters
- Combine multiple filters (search, priority, status, assignee) in a single API request
- Provide clear UI controls (search input + priority filter chip) on the dashboard
- Display an appropriate empty state when no tasks match the combined filters
- Preserve all existing CRUD and authentication behavior without breaking changes

---

## 4. Non-Goals

- **Advanced search operators** (AND/OR, wildcards, regex) — out of scope for this story
- **Saved search presets** or user-defined filters — not included
- **Faceted filtering UI** (multi-select checkboxes) — single priority selection only
- **Search performance optimization** (indexing, caching) — acceptable for current task volumes (< 100 tasks per user)
- **Search result highlighting** — not required
- **Backend pagination** — client-side filtering is sufficient for now

---

## 5. Functional Requirements

### FR-01 — GET /api/tasks?search= (keyword search)
**Requirement:**  
The API route `GET /api/tasks` must accept an optional query parameter `search` that filters tasks by case-insensitive substring match on **title** and **description** fields.

**Pass Criterion:**  
- `GET /api/tasks?search=login` returns all tasks where `title` or `description` contains "login" (case-insensitive)
- `GET /api/tasks?search=LOGIN` returns the same results (case-insensitive)
- `GET /api/tasks?search=xyz` returns an empty array if no match
- Omitting `?search` returns all tasks (existing behavior unchanged)

---

### FR-02 — GET /api/tasks?priority= (priority filter)
**Requirement:**  
The API route `GET /api/tasks` must accept an optional query parameter `priority` that filters tasks by exact match on the `priority` field (low / medium / high).

**Pass Criterion:**  
- `GET /api/tasks?priority=high` returns only tasks with `priority: "high"`
- `GET /api/tasks?priority=invalid` returns 400 Bad Request
- Omitting `?priority` returns all tasks (existing behavior unchanged)

---

### FR-03 — Combined filters
**Requirement:**  
All query parameters (`search`, `priority`, `status`, `assignee`) must be combinable in a single request. Filters are applied with **AND** logic.

**Pass Criterion:**  
- `GET /api/tasks?status=todo&priority=high&search=login` returns only tasks matching ALL three conditions
- `GET /api/tasks?priority=medium&assignee=user1` returns only medium-priority tasks assigned to user1
- Empty result set returned if no task matches all filters

---

### FR-04 — Dashboard search input
**Requirement:**  
The dashboard (`/dashboard`) must include a search input field that:
- Accepts text input from the user
- Sends the search query to `GET /api/tasks?search=` on form submission or debounced input change
- Displays all tasks when the input is empty

**Pass Criterion:**  
- Search input has `data-testid="search-input"`
- Typing "login" and pressing Enter triggers `GET /api/tasks?search=login`
- Clearing the input resets to all tasks
- Search input is visible and accessible above the task list

---

### FR-05 — Dashboard priority filter chip
**Requirement:**  
The dashboard must include a priority filter control (chip/dropdown) that allows the user to select one priority level (low / medium / high) or clear the filter.

**Pass Criterion:**  
- Priority filter has `data-testid="priority-filter"`
- Selecting "High" triggers `GET /api/tasks?priority=high`
- Selecting "All" (or clearing the filter) removes the `?priority=` param
- Selected priority is visually highlighted

---

### FR-06 — Combined UI filters
**Requirement:**  
All UI filters (status buttons, search input, priority filter) must work together. Changing any filter re-fetches tasks with all active filters combined.

**Pass Criterion:**  
- Selecting Status = "To Do" + Priority = "High" + Search = "api" sends:  
  `GET /api/tasks?status=todo&priority=high&search=api`
- All filter controls remain synchronized with the current query state

---

### FR-07 — Empty state for no results
**Requirement:**  
When no tasks match the combined filters, the dashboard must display an informative empty state message (not the generic "No tasks yet" message).

**Pass Criterion:**  
- Message shown: **"No tasks match the selected filters"** (or similar)
- Empty state has `data-testid="empty-state"`
- Empty state includes visual indicator (icon or illustration)
- Applies to search + priority filters (not just status filters)

---

### FR-08 — Backward compatibility
**Requirement:**  
All existing API routes, response shapes, `data-testid` attributes, and CRUD operations must remain unchanged. New query params are optional additions only.

**Pass Criterion:**  
- Existing clients calling `GET /api/tasks` without new params receive identical responses
- Existing UI tests (manual test cases TC-01 → TC-29) pass without modification
- Seed tasks `t1`–`t5` in `lib/store.ts` are unmodified
- No changes to authentication, task schema, or error responses

---

## 6. Non-Functional Requirements

### NFR-01 — Performance
- **Search response time:** < 500ms for up to 100 tasks per user (in-memory filtering)
- **UI responsiveness:** Search input debounced at 300ms to avoid excessive API calls

### NFR-02 — Backward Compatibility
- **Zero breaking changes:** All existing API routes, response formats, and UI selectors unchanged
- **Optional parameters only:** `?search=` and `?priority=` must be optional — omitting them preserves current behavior
- **Seed task integrity:** Tasks `t1`–`t5` in `lib/store.ts` must remain unmodified

### NFR-03 — Security
- **Authorization required:** All task endpoints require Bearer token validation (existing behavior)
- **No SQL injection risk:** Search uses in-memory string matching — no external database queries
- **Input sanitization:** Search term length capped at 200 characters to prevent abuse

### NFR-04 — Accessibility
- **Keyboard navigation:** Search input and priority filter must be keyboard accessible (Tab, Enter)
- **Screen reader support:** Filter controls must have appropriate ARIA labels

---

## 7. Risks and Assumptions

### Assumptions
1. **Search scope:** Title and description fields only — no need to search other fields (id, status, assignee)
2. **Task volume:** Users have < 100 tasks — in-memory filtering is sufficient without pagination
3. **Case-insensitive only:** No need for exact-match or regex search operators
4. **Single priority selection:** UI allows selecting one priority at a time (not multi-select)
5. **Priority values:** Only valid priority values are "low", "medium", "high" — no custom priorities

### Risks
1. **Performance degradation:** If task counts exceed 100, search response time may increase. Mitigation: Monitor usage; add pagination if needed.
2. **UI clutter:** Adding search + priority filter may overcrowd the dashboard header. Mitigation: Responsive design; collapse filters on mobile.
3. **Empty state confusion:** Users may not realize filters are active if the empty state is ambiguous. Mitigation: Show active filter chips above the empty state message.
4. **Debounce delay:** 300ms debounce may feel slow for fast typists. Mitigation: User testing to validate acceptable delay.

---

## 8. Open Questions

### Q1: Should search be debounced or triggered on Enter only?
**Proposed Answer:** Debounce at 300ms (search-as-you-type) for better UX. Allow manual trigger via Enter key as well.  
**Requires User Approval:** Yes — confirm debounce delay is acceptable.

### Q2: Should priority filter be a dropdown or chip buttons (like status)?
**Proposed Answer:** Chip buttons (consistent with status filter design). Display: All · Low · Medium · High.  
**Requires User Approval:** Yes — confirm UI design preference.

### Q3: Should the empty state suggest removing filters?
**Proposed Answer:** Yes. Show: "No tasks match the selected filters. Try adjusting your search or filters."  
**Requires User Approval:** No — standard UX pattern.

### Q4: Should search match partial words or whole words only?
**Proposed Answer:** Partial word matching (e.g., "log" matches "login"). Case-insensitive substring search.  
**Requires User Approval:** No — most common user expectation.

### Q5: Should priority filter be combinable with overdue filter?
**Proposed Answer:** Yes. Overdue filter is client-side; priority filter is server-side. Both can coexist.  
**Requires User Approval:** No — technical implementation detail.

---

## Summary

This story adds **keyword search** (`?search=`) and **priority filtering** (`?priority=`) to the Task Manager, combinable with existing status and assignee filters. The dashboard will include a search input and priority filter chip, with an appropriate empty state for no results. All changes are backward compatible — existing API clients and tests remain unaffected.

**Estimated Complexity:** Medium (3-5 days)  
**Dependencies:** None — all changes are additive  
**Testing Strategy:** Unit tests for search logic, integration tests for API routes, manual test cases for UI