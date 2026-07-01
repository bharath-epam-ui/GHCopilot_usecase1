"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskStatus } from "@/lib/types";
import { isTaskOverdue } from "@/lib/utils";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";

type FilterStatus = TaskStatus | "all" | "overdue";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [username, setUsername] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTasks = useCallback(
    async (status?: string) => {
      setLoading(true);
      setError("");
      // Skip API call for "overdue" filter (client-side filtering)
      if (status === "overdue") {
        const res = await fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const json = await res.json();
        setTasks(json.data ?? []);
        setLoading(false);
        return;
      }
      const url = status && status !== "all" ? `/api/tasks?status=${status}` : "/api/tasks";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const json = await res.json();
      setTasks(json.data ?? []);
      setLoading(false);
    },
    [token, router]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("name") ?? "";
    if (!storedToken) {
      router.push("/");
      return;
    }
    setUsername(storedName);
    fetchTasks(filter);
  }, [filter, fetchTasks, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    router.push("/");
  }

  async function handleCreate(data: Partial<Task>) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to create task");
    }
    setShowForm(false);
    fetchTasks(filter);
  }

  async function handleUpdate(data: Partial<Task>) {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to update task");
    }
    setEditingTask(null);
    fetchTasks(filter);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to delete task");
      return;
    }
    fetchTasks(filter);
  }

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in-progress" },
    { label: "Done", value: "done" },
    { label: "Overdue", value: "overdue" },
  ];

  /**
   * Filters tasks based on the current filter selection.
   * For "overdue", filters client-side. For other filters, tasks are already filtered by API.
   */
  function getFilteredTasks(): Task[] {
    if (filter === "overdue") {
      return tasks.filter(isTaskOverdue);
    }
    return tasks;
  }

  const displayTasks = getFilteredTasks();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Task Manager</h1>
          <p className="text-xs text-gray-500">GitHub Copilot Kata</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600" data-testid="logged-in-user">
            {username}
          </span>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2" data-testid="status-filter">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                data-testid={`filter-${f.value}`}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                  filter === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowForm(true); setEditingTask(null); }}
            data-testid="add-task-button"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {/* Task form modal */}
        {(showForm || editingTask) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" data-testid="task-modal">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <TaskForm
                initial={editingTask ?? undefined}
                mode={editingTask ? "edit" : "create"}
                onSubmit={editingTask ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditingTask(null); }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mb-4" data-testid="dashboard-error">
            {error}
          </p>
        )}

        {/* Task list */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-12" data-testid="loading-indicator">
            Loading tasks…
          </p>
        ) : displayTasks.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12" data-testid="empty-state">
            No tasks found. Add one to get started!
          </p>
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2"
            data-testid="task-list"
          >
            {displayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Task count */}
        {!loading && (
          <p className="text-xs text-gray-400 text-center mt-6" data-testid="task-count">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            {filter !== "all" ? ` with status "${filter}"` : " total"}
          </p>
        )}
      </main>
    </div>
  );
}
