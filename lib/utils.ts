import { Task } from "./types";

/**
 * Returns today's date in YYYY-MM-DD format.
 * Used for overdue date comparison.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Determines if a task is overdue based on its due date and status.
 * A task is overdue if:
 * 1. It has a dueDate set
 * 2. The dueDate is in the past (before today)
 * 3. Its status is NOT "done"
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") {
    return false;
  }
  const today = getTodayDateString();
  return task.dueDate < today;
}
