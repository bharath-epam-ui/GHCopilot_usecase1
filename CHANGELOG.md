# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
