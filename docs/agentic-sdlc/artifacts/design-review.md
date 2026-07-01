# Design Review — KT-11: Task Due Dates and Overdue Tracking

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
