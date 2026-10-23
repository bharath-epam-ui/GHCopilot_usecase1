"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@/lib/types";

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  "in-progress": "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-50 text-blue-600",
  medium: "bg-orange-50 text-orange-600",
  high: "bg-red-50 text-red-600",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, newStatus: TaskStatus) => Promise<void>;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(task.status);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    setOptimisticStatus(task.status);
  }, [task.status]);

  const handleInlineStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    const previousStatus = optimisticStatus;
    setOptimisticStatus(newStatus);
    setIsChangingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(task.id, newStatus);
      }
    } catch (err) {
      setOptimisticStatus(previousStatus);
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
      setTimeout(() => setStatusError(""), 3000);
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
      data-testid="task-card"
      data-task-id={task.id}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs text-gray-400 font-mono mb-0.5" data-testid="task-id">
            ID: {task.id}
          </p>
          <h3 className="font-semibold text-sm text-gray-900 leading-snug" data-testid="task-title">
            {task.title}
          </h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            data-testid="edit-task-button"
            className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            data-testid="delete-task-button"
            className="text-xs px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2" data-testid="task-description">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-col gap-1">
          {/* sr-only span: textContent === statusLabels[optimisticStatus] for FR-04 / NFR-02 assertions */}
          <span data-testid="task-status" className="sr-only">
            {statusLabels[optimisticStatus]}
          </span>

          <select
            data-testid="inline-status-select"
            aria-label="Change status"
            value={optimisticStatus}
            disabled={isChangingStatus}
            onChange={handleInlineStatusChange}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${statusColors[optimisticStatus]}`}
          >
            <option value="todo"        data-testid="inline-status-option-todo">To Do</option>
            <option value="in-progress" data-testid="inline-status-option-in-progress">In Progress</option>
            <option value="done"        data-testid="inline-status-option-done">Done</option>
          </select>

          {statusError && (
            <p data-testid="inline-status-error" className="text-red-500 text-xs mt-1">
              {statusError}
            </p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${priorityColors[task.priority]}`}
          data-testid="task-priority"
        >
          {task.priority}
        </span>
        <span className="text-xs text-gray-400 ml-auto" data-testid="task-assignee">
          @{task.assignee}
        </span>
      </div>
    </div>
  );
}
