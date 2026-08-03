# Design Review — KT-12: Task Search and Advanced Filtering

**Generated:** 2026-08-03  
**Agent:** 03 - Design Review Agent  
**SDLC Stage:** 3 of 8  
**Reviewed Artifact:** [architecture.md](architecture.md)

---

## Executive Summary

**Review Status:** ✅ **GO** — Architecture approved with minor updates applied  
**Overall Assessment:** The proposed architecture is sound, follows existing patterns, and meets all functional requirements. Three minor issues were identified and resolved during review.

**Issues Found:**
- 1 Medium severity issue (resolved)
- 2 Low severity issues (resolved)

**Changes Applied:**
- Added explicit priority validation in API route handler
- Added search term length validation (200 char limit)
- Clarified debounce implementation to prevent race conditions

---

## Review Findings

### Finding 1: Priority Validation Location Unclear

**Severity:** 🟨 **Medium**  
**Location:** Section 8 (API Contract Changes) and Section 9 (Store Logic Changes)  
**Issue:**  
Section 8 specifies that invalid priority values should return `400 Bad Request`, but Section 9 shows the store layer receiving the priority parameter directly without validation. The validation logic location is ambiguous — it should occur in the API route handler (`app/api/tasks/route.ts`) **before** calling `store.getAllTasks()`, not in the store layer.

**Why This Matters:**  
- Store layer should remain validation-agnostic (separation of concerns)
- Invalid values passed to store could cause unexpected filter behavior
- Consistent with existing pattern (status validation happens in API layer)

**Resolution Applied:**  
Updated architecture.md Section 8 to explicitly show validation code in GET handler:

```typescript
// In app/api/tasks/route.ts GET handler
const priority = searchParams.get("priority") ?? undefined;

// Validate priority before passing to store
if (priority && !["low", "medium", "high"].includes(priority)) {
  return NextResponse.json(
    { error: "Invalid priority value. Must be low, medium, or high" },
    { status: 400 }
  );
}

const tasks = await store.getAllTasks(username, status, assignee, search, priority);
```

**Status:** ✅ **Resolved** — Architecture updated

---

### Finding 2: Search Term Length Validation Missing

**Severity:** 🟩 **Low**  
**Location:** Section 8 (API Contract Changes) and Section 9 (Store Logic Changes)  
**Issue:**  
NFR-03 specifies "Input sanitization: Search term length capped at 200 characters to prevent abuse." The API contract (Section 8) mentions "Max 200 chars" but the implementation (Section 9) does not show this validation.

**Why This Matters:**  
- Prevents potential denial-of-service via extremely long search terms
- Enforces documented non-functional requirement
- Aligns with security best practices

**Resolution Applied:**  
Updated architecture.md Section 8 to add search term length validation:

```typescript
// In app/api/tasks/route.ts GET handler
const search = searchParams.get("search") ?? undefined;

// Validate search term length
if (search && search.length > 200) {
  return NextResponse.json(
    { error: "Search term too long. Maximum 200 characters allowed" },
    { status: 400 }
  );
}
```

**Status:** ✅ **Resolved** — Architecture updated

---

### Finding 3: Debounce Race Condition Risk

**Severity:** 🟩 **Low**  
**Location:** Section 10 (UI Changes) — Debounce implementation  
**Issue:**  
The debounce implementation uses `useEffect` with a timeout, but the dependency array includes `[searchTerm, priorityFilter, filter]`. If a user types "api" (triggers debounce timer) and then immediately clicks a priority filter, two API calls may be triggered:
1. The delayed call from typing (after 300ms)
2. The immediate call from filter change

This could cause flickering or stale data display.

**Why This Matters:**  
- Potential race condition if filter changes during debounce delay
- Could result in displaying stale data
- Extra unnecessary API calls

**Resolution Applied:**  
Updated architecture.md Section 10 to use a more robust debounce pattern:

```typescript
// Separate debounced search from immediate filters
useEffect(() => {
  const timer = setTimeout(() => {
    fetchTasks();
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]); // Only debounce search input

useEffect(() => {
  fetchTasks(); // Immediate fetch for filter changes
}, [priorityFilter, filter]);
```

**Status:** ✅ **Resolved** — Architecture updated

---

## Detailed Review by Area

### 1. Correctness ✅

**Evaluation Criteria:** Does each component behave as specified in requirements.md?

| Requirement | Architecture Coverage | Status |
|-------------|----------------------|--------|
| FR-01: GET /api/tasks?search= | Section 8 & 9 — search param extraction + filtering | ✅ Complete |
| FR-02: GET /api/tasks?priority= | Section 8 & 9 — priority param extraction + filtering | ✅ Complete |
| FR-03: Combined filters | Section 5 & 9 — sequential filter application | ✅ Complete |
| FR-04: Dashboard search input | Section 10 — UI component + state | ✅ Complete |
| FR-05: Dashboard priority filter chip | Section 10 — UI component + state | ✅ Complete |
| FR-06: Combined UI filters | Section 10 — fetchTasks builds combined query string | ✅ Complete |
| FR-07: Empty state for no results | Section 10 — conditional empty state message | ✅ Complete |
| FR-08: Backward compatibility | Section 12 — explicit compatibility statement | ✅ Complete |

**Finding:** All functional requirements are addressed in the architecture. No gaps identified.

---

### 2. Security ✅

**Evaluation Criteria:** Are secrets excluded? Is user input validated?

| Security Concern | Mitigation | Status |
|------------------|------------|--------|
| **Search input injection** | In-memory string matching (`.includes()`), no database queries | ✅ Safe |
| **Priority value injection** | Validation against whitelist `["low", "medium", "high"]` | ✅ Safe (after Finding 1 resolved) |
| **Search term length abuse** | Max 200 character limit enforced | ✅ Safe (after Finding 2 resolved) |
| **Authentication bypass** | No changes to auth pattern; existing Bearer token validation remains | ✅ Safe |
| **Secrets exposure** | No new environment variables or secrets introduced | ✅ Safe |

**Finding:** Security posture is sound. Input validation added per Findings 1 & 2.

---

### 3. Error Handling ✅

**Evaluation Criteria:** Are all API failures, missing fields, and edge cases handled gracefully?

| Error Case | Handling Strategy | Status |
|------------|-------------------|--------|
| Invalid priority value | Return 400 with descriptive error | ✅ Handled |
| Search term too long | Return 400 with descriptive error | ✅ Handled |
| Empty search result | Return 200 with `{ data: [] }` + empty state UI | ✅ Handled |
| Missing authentication token | Existing 401 handler (unchanged) | ✅ Handled |
| API request timeout | Client-side error handling (existing pattern) | ✅ Handled |
| Tasks without priority field | Not possible — priority is required field | ✅ N/A |

**Finding:** Error handling is comprehensive. All edge cases covered.

---

### 4. Test Coverage ✅

**Evaluation Criteria:** Do the planned changes cover happy path AND edge cases?

**Note:** Test implementation is Stage 5 (Implementation). This review evaluates whether the architecture is **testable**.

| Test Scenario | Testability | Notes |
|---------------|-------------|-------|
| Search with matching results | ✅ Testable | Mock store with sample tasks |
| Search with no results | ✅ Testable | Verify empty array response |
| Priority filter with matching results | ✅ Testable | Filter by each priority value |
| Combined search + priority + status | ✅ Testable | Test AND logic |
| Invalid priority value | ✅ Testable | Verify 400 response |
| Search term > 200 chars | ✅ Testable | Verify 400 response |
| Empty state UI with filters active | ✅ Testable | Use `data-testid="empty-state"` |
| Debounced search input | ✅ Testable | Mock timers in unit test |

**Finding:** Architecture is fully testable. All components have clear boundaries and `data-testid` attributes for UI testing.

---

### 5. Code Clarity ✅

**Evaluation Criteria:** Are names self-explanatory? Is logic easy to follow?

| Component | Clarity Assessment |
|-----------|-------------------|
| **Variable names** | `searchTerm`, `priorityFilter`, `searchLower` — clear and descriptive ✅ |
| **Function names** | `getAllTasks`, `fetchTasks`, `setSearchTerm` — follow existing conventions ✅ |
| **Data flow** | Sequential filtering in store → easy to trace ✅ |
| **Component structure** | Follows existing pattern (state → fetch → render) ✅ |
| **Comment needs** | Minimal — code is self-documenting ✅ |

**Finding:** Code clarity is excellent. Follows existing project conventions.

---

### 6. DRY Principle ✅

**Evaluation Criteria:** Is there duplicated logic that can be shared?

| Potential Duplication | Resolution |
|-----------------------|------------|
| Filter logic (status, assignee, search, priority) | ✅ Centralized in `store.getAllTasks()` — no duplication |
| Query parameter extraction | ✅ Uses `searchParams.get()` for all params — consistent pattern |
| Empty state message | ✅ Single conditional in dashboard — no duplication |
| Validation logic (priority) | ✅ Inline whitelist check — simple, no need to extract |

**Finding:** No code duplication identified. DRY principle upheld.

---

### 7. Dependency Safety ✅

**Evaluation Criteria:** Any known-vulnerable packages added?

**Analysis:**  
- ✅ No new npm packages added
- ✅ Uses native JavaScript string methods (`.toLowerCase()`, `.includes()`, `.filter()`)
- ✅ Uses existing React hooks (`useState`, `useEffect`, `useCallback`)
- ✅ No changes to `package.json`

**Finding:** Zero new dependencies. No security risk from external packages.

---

## Design Decisions Approved

The following design choices are approved and will guide Stage 4 (Implementation Planning):

### Decision 1: Server-Side Filtering (Not Client-Side)
**Rationale:** All filtering logic in `lib/store.ts` keeps business logic centralized and testable. Client-side filtering would scatter logic across UI components.  
**Approved:** ✅ Yes

### Decision 2: Search on Title and Description Only
**Rationale:** Per Requirements FR-01, search is limited to these two fields. No need to search assignee, status, or id.  
**Approved:** ✅ Yes

### Decision 3: Priority Filter as Exclusive Chips (Not Multi-Select)
**Rationale:** Consistent with existing status filter UI pattern. Simpler implementation. Per Requirements Q2 answer.  
**Approved:** ✅ Yes

### Decision 4: Debounce Search at 300ms
**Rationale:** Balances responsiveness with API call efficiency. Per NFR-01 and Requirements Q1 answer.  
**Approved:** ✅ Yes

### Decision 5: Empty State Message Conditional on Active Filters
**Rationale:** Per FR-07, users need to know if no results are due to filters vs. no tasks created yet.  
**Approved:** ✅ Yes

### Decision 6: No New API Route for Search
**Rationale:** Extend existing `GET /api/tasks` with optional query params. Backward compatible and RESTful.  
**Approved:** ✅ Yes

---

## Backward Compatibility Verification ✅

**Critical Check:** No breaking changes allowed per NFR-02.

| Compatibility Concern | Verification | Status |
|-----------------------|--------------|--------|
| **API clients omitting new params** | `search` and `priority` are optional; default behavior unchanged | ✅ Compatible |
| **Existing task data** | No schema migration; priority already exists; search uses existing fields | ✅ Compatible |
| **UI test selectors** | New `data-testid` added; existing ones unchanged | ✅ Compatible |
| **Seed tasks `t1`–`t5`** | Not modified | ✅ Compatible |
| **Store function signature** | Optional params appended; TypeScript allows omission | ✅ Compatible |
| **Authentication** | No changes to auth pattern | ✅ Compatible |

**Confirmation:** 100% backward compatible. All existing clients and tests will continue to work.

---

## Architecture Updates Applied

The following changes were made to [architecture.md](architecture.md) to address review findings:

### Update 1: Added Priority Validation Code (Finding 1)

**Section 8 — API Contract Changes**

Added explicit validation logic to GET handler:

```typescript
// Validate priority parameter
const priority = searchParams.get("priority") ?? undefined;
if (priority && !["low", "medium", "high"].includes(priority)) {
  return NextResponse.json(
    { error: "Invalid priority value. Must be low, medium, or high" },
    { status: 400 }
  );
}
```

**Rationale:** Clarifies that validation happens in API layer before calling store.

---

### Update 2: Added Search Term Length Validation (Finding 2)

**Section 8 — API Contract Changes**

Added length check to GET handler:

```typescript
// Validate search term length
const search = searchParams.get("search") ?? undefined;
if (search && search.length > 200) {
  return NextResponse.json(
    { error: "Search term too long. Maximum 200 characters allowed" },
    { status: 400 }
  );
}
```

**Rationale:** Enforces NFR-03 security requirement.

---

### Update 3: Improved Debounce Implementation (Finding 3)

**Section 10 — UI Changes**

Replaced single `useEffect` with two separate effects:

```typescript
// Debounce search input only
useEffect(() => {
  const timer = setTimeout(() => {
    fetchTasks();
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Immediate fetch for filter changes
useEffect(() => {
  fetchTasks();
}, [priorityFilter, filter]);
```

**Rationale:** Prevents race conditions when filters change during search debounce delay.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Performance degradation** (> 100 tasks) | Low | Medium | Monitor usage; add pagination if needed (documented in architecture) |
| **UI clutter** (search + priority adds complexity) | Low | Low | Responsive design planned; mobile collapse |
| **Debounce delay feels slow** | Low | Low | User testing recommended; 300ms is standard |
| **Empty state confusion** | Very Low | Low | Clear messaging implemented |

**Overall Risk Level:** 🟢 **Low** — All risks have documented mitigations.

---

## Go / No-Go Decision

### ✅ **GO — Proceed to Stage 4 (Implementation Plan)**

**Rationale:**

1. **All functional requirements covered** — FR-01 through FR-08 fully addressed
2. **All non-functional requirements met** — Performance, security, accessibility, backward compatibility
3. **All review findings resolved** — 3 issues identified and fixed during review
4. **No breaking changes** — 100% backward compatible
5. **No new dependencies** — Uses existing stack
6. **Clear implementation path** — 3 files to modify, no new files needed
7. **Testable design** — All components have clear boundaries and test hooks

**Conditions for Proceeding:**
- ✅ Medium severity issue (priority validation) resolved
- ✅ Low severity issues (search length, debounce) resolved
- ✅ Architecture.md updated with validation code
- ✅ Backward compatibility verified

**Sign-Off:**  
This design is approved for implementation. Stage 4 (Implementation Planning) may proceed.

---

## Recommendations for Stage 4

1. **Test Coverage:** Ensure unit tests cover all validation edge cases (invalid priority, search term > 200 chars)
2. **Performance Testing:** Add a manual test with 100+ tasks to verify < 500ms response time
3. **UI/UX Review:** Consider adding a "Clear all filters" button if user testing shows confusion
4. **Documentation:** Update API documentation with new query parameter examples
5. **Accessibility:** Verify keyboard navigation (Tab, Enter) works for search input and priority chips

---

## Conclusion

The proposed architecture for KT-12 (Task Search and Advanced Filtering) is **well-designed, secure, and implementable**. Three minor issues were identified during review and immediately resolved through architecture updates. The design maintains 100% backward compatibility, introduces zero breaking changes, and follows all project conventions.

**Status:** ✅ **Approved — Ready for Implementation Planning (Stage 4)**

---

**Review Completed:** 2026-08-03  
**Reviewer:** Design Review Agent (Stage 3)  
**Next Stage:** 04 - Implementation Plan

**Generated:** 2026-07-01  
**Agent:** 03 - Design Review Agent  
**SDLC Stage:** 3 of 8

---

## Executive Summary

This design review evaluates the proposed architecture for KT-11 (Task Due Dates and Overdue Tracking) against security, correctness, error handling, testability, and code quality standards.

**Overall Assessment:** The architecture is sound and follows established patterns. **3 Medium severity issues** and **4 Low severity issues** were identified, all with straightforward resolutions. With the recommended changes, this design is **approved to proceed to implementation planning (Stage 4)**.

---

## Review Findings

### Finding 1: Date Validation Insufficient (Format vs. Validity)

**Severity:** Medium  
**Location:** `app/api/tasks/route.ts` and `app/api/tasks/[id]/route.ts` — Section 8.1, 8.2  
**Issue:** The architecture specifies regex validation `/^\d{4}-\d{2}-\d{2}$/` which checks format but not date validity. Invalid dates like `"2026-02-30"`, `"2026-13-01"`, `"2026-00-15"` would pass validation but cause issues downstream.

**Resolution:**  
Add actual date validity check after regex validation:

```typescript
// After regex check
if (dueDate && dueDate !== null) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dueDate)) {
    return NextResponse.json(
      { error: "dueDate must be in YYYY-MM-DD format" }, 
      { status: 400 }
    );
  }
  
  // NEW: Check if date is actually valid
  const date = new Date(dueDate + "T00:00:00");
  if (isNaN(date.getTime()) || date.toISOString().split("T")[0] !== dueDate) {
    return NextResponse.json(
      { error: "dueDate is not a valid date" }, 
      { status: 400 }
    );
  }
}
```

**Impact:** Without this fix, malformed dates could be persisted to Redis, causing UI rendering errors or incorrect overdue calculations.

---

### Finding 2: Date Parsing Error Handling Missing in UI

**Severity:** Medium  
**Location:** `components/TaskCard.tsx` — Section 10.2  
**Issue:** The `formatDueDate()` function assumes `dueDate` is always a valid date string. If a malformed date somehow gets through (e.g., due to data migration or direct Redis edit), the function will crash with `Invalid Date`.

**Resolution:**  
Add error handling to `formatDueDate()`:

```typescript
function formatDueDate(dueDate: string): string {
  try {
    const date = new Date(dueDate + "T00:00:00");
    if (isNaN(date.getTime())) {
      return dueDate;  // Fallback: show raw string if parse fails
    }
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return dueDate;  // Fallback: show raw string on exception
  }
}
```

**Impact:** Prevents UI crashes if corrupted date data exists in the database.

---

### Finding 3: Inconsistent Filter Behavior in Dashboard

**Severity:** Medium  
**Location:** `app/dashboard/page.tsx` — Section 10.3, Change 3  
**Issue:** The proposed filter click handler has inconsistent behavior:
- Clicking "Overdue" sets `filter` but doesn't call `fetchTasks()`
- Clicking other filters (All, To Do, etc.) sets `filter` which triggers `useEffect` → `fetchTasks()`
- This means the `useEffect` dependency on `filter` is misleading — it will fire when switching to "overdue" but the "overdue" branch doesn't need fresh data

**Resolution:**  
Refactor to make the behavior explicit and avoid unnecessary API calls:

```typescript
// Update useEffect to NOT refetch when filter is "overdue"
useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedName = localStorage.getItem("name") ?? "";
  if (!storedToken) {
    router.push("/");
    return;
  }
  setUsername(storedName);
  
  // Only fetch from API if filtering by status (not "overdue")
  if (filter !== "overdue") {
    fetchTasks(filter === "all" ? undefined : filter);
  }
}, [filter, fetchTasks, router]);

// Simplified filter click handler
{filters.map((f) => (
  <button
    key={f.value}
    onClick={() => setFilter(f.value)}  // Just set filter, useEffect handles the rest
    data-testid={`filter-${f.value}`}
    className={...}
  >
    {f.label}
  </button>
))}
```

**Impact:** Avoids unnecessary API calls and makes the code easier to reason about.

---

### Finding 4: DRY Violation — Date Comparison Logic Duplicated

**Severity:** Low  
**Location:** `components/TaskCard.tsx` (Section 10.2) and `app/dashboard/page.tsx` (Section 10.3)  
**Issue:** The expression `new Date().toISOString().split("T")[0]` (get today's date as YYYY-MM-DD) appears in two places:
1. `isOverdue()` function in `TaskCard.tsx`
2. `getFilteredTasks()` function in `page.tsx`

**Resolution:**  
Create a shared utility function in `lib/utils.ts`:

```typescript
// lib/utils.ts (create this file)
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function isTaskOverdue(dueDate: string, status: string): boolean {
  if (status === "done") return false;
  return dueDate < getTodayDateString();
}
```

Then use it in both components:

```typescript
// TaskCard.tsx
import { isTaskOverdue } from "@/lib/utils";

{task.dueDate && isTaskOverdue(task.dueDate, task.status) && (
  <span className="..." data-testid="task-overdue-badge">OVERDUE</span>
)}

// page.tsx
import { getTodayDateString } from "@/lib/utils";

function getFilteredTasks(): Task[] {
  if (filter === "overdue") {
    const today = getTodayDateString();
    return tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "done"
    );
  }
  return tasks;
}
```

**Impact:** Centralized logic is easier to test and maintain. If the date comparison logic needs to change (e.g., to handle timezone offsets), it only needs to be updated in one place.

---

### Finding 5: Missing `data-testid` for Due Date Input Label

**Severity:** Low  
**Location:** `components/TaskForm.tsx` — Section 10.1  
**Issue:** The new due date input field has `data-testid="task-duedate-input"` on the `<input>` element, but the `<label>` element doesn't have a test ID. While not critical, this inconsistency with other form fields (which do have labeled test IDs in some test frameworks) could make test automation harder.

**Resolution:**  
Add `data-testid` to the label (optional but recommended for consistency):

```tsx
<label 
  className="block text-sm font-medium mb-1" 
  htmlFor="task-duedate"
  data-testid="task-duedate-label"
>
  Due Date
</label>
```

**Impact:** Improves test automation coverage and consistency.

---

### Finding 6: Edge Case — Empty String vs. Null Handling

**Severity:** Low  
**Location:** `components/TaskForm.tsx` — Section 10.1  
**Issue:** The architecture specifies `dueDate: dueDate || null` to convert empty strings to `null`, but the state is initialized with `const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "")`. This means:
- If a task has `dueDate: null`, the input field shows an empty string ✅
- If the user clears the input, `dueDate` becomes `""`, which is sent as `null` ✅
- BUT: What if `initial?.dueDate` is `undefined`? TypeScript will allow it since the field is optional.

**Resolution:**  
Ensure type safety with explicit handling:

```typescript
const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "");

// In handleSubmit
await onSubmit({ 
  title, 
  description, 
  status, 
  priority, 
  assignee, 
  dueDate: dueDate.trim() || null  // .trim() handles whitespace-only strings
});
```

**Impact:** Prevents edge case where whitespace-only input is treated as a valid date.

---

### Finding 7: No Mention of Task Count Update

**Severity:** Low  
**Location:** `app/dashboard/page.tsx` — Section 10.3  
**Issue:** The architecture doesn't mention updating the task count display (e.g., "5 tasks" or "2 overdue tasks") that may be shown in the UI. The current dashboard may or may not have this, but if it does, it should reflect the filtered count.

**Resolution:**  
**Verify in implementation:** Check if the dashboard has a task count display. If yes, update it to use `getFilteredTasks().length` instead of `tasks.length`.

If no count display exists, this is a non-issue.

**Impact:** If a count exists and isn't updated, users will see misleading numbers (e.g., "5 tasks" when only 2 are shown due to filtering).

---

## Review Checklist Results

| Review Area | Status | Notes |
|-------------|--------|-------|
| **Correctness** | ✅ Pass (with fixes) | All 10 functional requirements addressed. Findings 1-3 ensure correct behavior. |
| **Security** | ✅ Pass | No new security surface. Date input validated. Auth unchanged. |
| **Error Handling** | ⚠️ Needs Improvement | Findings 1-2 add necessary error handling for invalid dates. |
| **Test Coverage** | ✅ Pass | Happy path and edge cases covered. Proposed changes add missing edge case handling. |
| **Code Clarity** | ✅ Pass | Function names clear. Logic straightforward. Finding 3 improves clarity. |
| **DRY Principle** | ⚠️ Minor Violation | Finding 4 addresses duplicated date logic. |
| **Dependency Safety** | ✅ Pass | No new dependencies. Native browser APIs only. |

---

## Design Decisions Confirmed

| Decision | Rationale | Approved |
|----------|-----------|----------|
| **Client-side overdue filtering** | Simpler implementation, no API changes | ✅ Yes |
| **HTML5 `<input type="date">`** | Native date picker, no library needed, good browser support | ✅ Yes |
| **No changes to `lib/store.ts`** | Spread operators already handle extra fields | ✅ Yes |
| **Short date format ("Dec 31, 2026")** | Human-readable, confirmed by product owner | ✅ Yes |
| **Red "OVERDUE" badge** | High visibility, confirmed by product owner | ✅ Yes |
| **Optional `dueDate` field** | Backward compatible, existing tasks work unchanged | ✅ Yes |

---

## Required Architecture Updates

Before proceeding to Stage 4 (Implementation Plan), update `architecture.md` with the following changes:

### Update 1: Section 8.1 and 8.2 — Add Date Validity Check

**Location:** API Contract Changes sections

**Add after the regex validation text:**

> **Additional validation:** After regex check passes, verify the date is actually valid by parsing it and comparing the result to the input string. This catches invalid dates like `2026-02-30` or `2026-13-01`.

**Code snippet to add:**
```typescript
const date = new Date(dueDate + "T00:00:00");
if (isNaN(date.getTime()) || date.toISOString().split("T")[0] !== dueDate) {
  return NextResponse.json(
    { error: "dueDate is not a valid date" }, 
    { status: 400 }
  );
}
```

---

### Update 2: Section 10.2 — Add Error Handling to formatDueDate

**Location:** TaskCard.tsx UI Changes

**Replace the `formatDueDate` function with:**

```typescript
function formatDueDate(dueDate: string): string {
  try {
    const date = new Date(dueDate + "T00:00:00");
    if (isNaN(date.getTime())) {
      return dueDate;  // Fallback: show raw string if parse fails
    }
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return dueDate;  // Fallback: show raw string on exception
  }
}
```

---

### Update 3: Section 10.3 — Simplify Filter Click Handler

**Location:** Dashboard Page UI Changes (Change 3)

**Replace the filter click handler code with:**

```typescript
// Update useEffect to NOT refetch when filter is "overdue"
useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedName = localStorage.getItem("name") ?? "";
  if (!storedToken) {
    router.push("/");
    return;
  }
  setUsername(storedName);
  
  // Only fetch from API if filtering by status (not "overdue")
  if (filter !== "overdue") {
    fetchTasks(filter === "all" ? undefined : filter);
  }
}, [filter, fetchTasks, router]);

// Simplified filter click handler
{filters.map((f) => (
  <button
    key={f.value}
    onClick={() => setFilter(f.value)}
    data-testid={`filter-${f.value}`}
    className={...}
  >
    {f.label}
  </button>
))}
```

---

### Update 4: Section 10 — Add New Section 10.4 for Shared Utilities

**Location:** After Section 10.3 (Dashboard Page)

**Add new section:**

#### 10.4 Shared Utility Functions (lib/utils.ts)

**Change:** Create new file `lib/utils.ts` with shared date utility functions.

**Purpose:** Centralize date comparison logic used in both `TaskCard.tsx` and `page.tsx` to follow DRY principle.

**File content:**
```typescript
// lib/utils.ts (NEW FILE)

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check if a task is overdue
 * @param dueDate - Task due date in YYYY-MM-DD format
 * @param status - Task status
 * @returns true if task is overdue (past due date and not done)
 */
export function isTaskOverdue(dueDate: string, status: string): boolean {
  if (status === "done") return false;
  return dueDate < getTodayDateString();
}
```

**Then update:**
- `TaskCard.tsx`: Import and use `isTaskOverdue()` instead of inline `isOverdue()`
- `page.tsx`: Import and use `getTodayDateString()` in `getFilteredTasks()`

**Files impacted:** `lib/utils.ts` (new), `components/TaskCard.tsx` (modified), `app/dashboard/page.tsx` (modified)

---

## Go / No-Go Decision

**Decision:** ✅ **GO** — Proceed to Stage 4 (Implementation Plan)

**Rationale:**

**Strengths:**
- ✅ All 10 functional requirements are addressed
- ✅ Backward compatibility is maintained (no breaking changes)
- ✅ Architecture follows established patterns
- ✅ No new dependencies or security risks
- ✅ Clear data flow and component responsibilities
- ✅ Comprehensive error handling (with recommended fixes)

**Issues Identified:**
- ⚠️ 3 Medium severity issues (all have straightforward fixes)
- ⚠️ 4 Low severity issues (minor improvements)
- ✅ No High severity blockers

**Required Actions Before Coding:**
1. Update `architecture.md` with the 4 required changes listed above
2. Add the new `lib/utils.ts` file to the impacted files list (Section 6)
3. Update Section 6 to show 7 files modified (was 6)

**Timeline Impact:** Addressing these findings adds ~30 minutes to implementation time (mostly for writing unit tests for the new validation logic). This is acceptable.

**Risk Assessment:** Low risk. All issues have clear resolutions and don't require architectural changes — only implementation-level improvements.

---

## Summary

The architecture for KT-11 is well-designed and ready for implementation with minor adjustments:

1. **Add date validity check** in API routes (not just format check)
2. **Add error handling** for date parsing in UI
3. **Simplify filter logic** to avoid unnecessary API calls
4. **Extract shared utilities** for date comparison logic
5. **Minor fixes** for edge cases and test IDs

Once `architecture.md` is updated per the "Required Architecture Updates" section above, this design is **approved to proceed to Stage 4** (Implementation Plan).

---

**Next Steps:**
1. Update `architecture.md` with the 4 required changes
2. Run **Agent 04 - Implementation Plan** to break the architecture into tasks
3. Proceed with implementation in Stage 5
