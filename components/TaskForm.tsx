"use client";

import { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TaskFormProps {
  initial?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

export default function TaskForm({ initial, onSubmit, onCancel, mode }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [assignee, setAssignee] = useState(initial?.assignee ?? "");
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ 
        title, 
        description, 
        status, 
        priority, 
        assignee,
        dueDate: dueDate || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="task-form">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="task-title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          data-testid="task-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          data-testid="task-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="task-status">
            Status
          </label>
          <select
            id="task-status"
            data-testid="task-status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="task-priority">
            Priority
          </label>
          <select
            id="task-priority"
            data-testid="task-priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="task-assignee">
          Assignee
        </label>
        <input
          id="task-assignee"
          data-testid="task-assignee-input"
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="task-duedate">
          Due Date
        </label>
        <input
          id="task-duedate"
          data-testid="task-duedate-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm" data-testid="task-form-error">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          data-testid="task-submit-button"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Saving…" : mode === "create" ? "Create Task" : "Update Task"}
        </button>
        <button
          type="button"
          data-testid="task-cancel-button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
