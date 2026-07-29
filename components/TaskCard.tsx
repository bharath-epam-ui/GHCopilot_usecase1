"use client";

import { Task } from "@/lib/types";

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
  isPending?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, isPending = false }: TaskCardProps) {
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
            disabled={isPending}
            data-testid="edit-task-button"
            className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-60"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            disabled={isPending}
            data-testid="delete-task-button"
            className="text-xs px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-60"
          >
            {isPending ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2" data-testid="task-description">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[task.status]}`}
          data-testid="task-status"
        >
          {statusLabels[task.status]}
        </span>
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
