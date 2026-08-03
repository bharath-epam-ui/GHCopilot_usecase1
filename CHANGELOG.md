# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Keyword search functionality for tasks via `GET /api/tasks?search=<term>` query parameter
- Case-insensitive substring matching on task title and description fields
- Priority filter via `GET /api/tasks?priority=<low|medium|high>` query parameter
- Search input field on dashboard with placeholder "Search tasks..." and `data-testid="search-input"`
- Priority filter chip UI with buttons: "All", "Low", "Medium", "High" (each with `data-testid="filter-priority-{value}"`)
- Debounced search input (300ms delay) to prevent excessive API calls while typing
- Adaptive empty state messages: context-aware message based on active filter state
- Combined filter support: all query params (`search`, `priority`, `status`, `assignee`) work together with AND logic
- Search length validation: max 200 characters, returns 400 Bad Request on violation
- Priority whitelist validation: only `["low", "medium", "high"]` accepted, returns 400 Bad Request for invalid values

### Changed
- `lib/store.ts` — Extended `getAllTasks` function signature with two new optional parameters: `search?: string` and `priority?: string`
- `app/api/tasks/route.ts` — GET handler now extracts and validates `search` and `priority` query parameters before passing to store layer
- `app/dashboard/page.tsx` — Dashboard UI extended with search input and priority filter chips, updated `fetchTasks` logic to build combined query string
- Empty state message logic — Now shows "No tasks match the selected filters..." when filters are active, or "No tasks found. Add one to get started!" when no filters applied

### Fixed
- N/A — No bugs fixed in this release

*Closes: [KT-12](https://bharathwaj1390.atlassian.net/browse/KT-12) — Task Search and Advanced Filtering*

---

### Added (KT-11)
- Optional due date field on tasks (YYYY-MM-DD format)
- HTML5 date picker in task creation and edit forms
- Due date display on task cards with human-readable format ("Due: Dec 31, 2026")
- Visual "OVERDUE" badge (red) for past-due incomplete tasks
- "Overdue" filter button on dashboard to show only overdue tasks
- Date utility functions (`getTodayDateString`, `isTaskOverdue`) in `lib/utils.ts`
- Comprehensive API validation for due dates (format and validity checks)
- Support for clearing due dates (send `dueDate: null` in PUT requests)
- New `data-testid` attributes for test automation:
  - `task-duedate-input` — Date input field in task form
  - `task-duedate` — Due date display on task card
  - `task-overdue-badge` — Overdue indicator badge
  - `filter-overdue` — Overdue filter button

### Changed
- Task interface now includes optional `dueDate?: string` field
- Task form extended with due date input field (positioned after "Assignee")
- Task card display updated to show due date and overdue status
- Dashboard filter bar extended with "Overdue" button (5th filter)
- POST `/api/tasks` accepts optional `dueDate` field with validation
- PUT `/api/tasks/:id` accepts optional `dueDate` field with validation
- Client-side filtering implemented for overdue tasks (no backend API changes)

### Fixed
- N/A — No bugs fixed in this release

*Closes: [KT-11](https://bharathwaj1390.atlassian.net/browse/KT-11) — Task Due Dates and Overdue Tracking*

---

## [1.0.0] - 2026-06-30

### Initial Release
- Basic task management (create, edit, delete tasks)
- Task properties: title, description, status, priority, assignee
- User authentication (login/logout with Bearer token)
- Dashboard with status filters (All, To Do, In Progress, Done)
- Upstash Redis storage for production
- In-memory storage fallback for local development
- Next.js 14 App Router architecture
- Deployed to Vercel: https://gh-copilot-usecase1.vercel.app
