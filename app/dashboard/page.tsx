"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskStatus } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import UndoToast from "@/components/UndoToast";

type FilterStatus = TaskStatus | "all";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [username, setUsername] = useState("");

  // KT-23 UI state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Record<string, boolean>>({});
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTasks = useCallback(
    async (status?: string) => {
      setLoading(true);
      setError("");
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

  // KT-23: Open confirmation modal (no request on cancel)
  function handleDeleteRequest(id: string) {
    const task = tasks.find((t) => t.id === id) ?? null;
    setSelectedTask(task);
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!selectedTask) return;

    const task = selectedTask;
    setPendingTaskIds((prev) => ({ ...prev, [task.id]: true }));
    setDeleteModalOpen(false);

    // Optimistic UI: remove from list immediately
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      // rollback optimistic removal
      setTasks((prev) => [task, ...prev]);
      setError(json.message ?? json.error ?? "Failed to delete task");
      setPendingTaskIds((prev) => ({ ...prev, [task.id]: false }));
      return;
    }

    // Show Undo toast (>=10s)
    setUndoTask(task);
    setShowUndoToast(true);
    setPendingTaskIds((prev) => ({ ...prev, [task.id]: false }));
  }

  async function handleUndoDelete() {
    if (!undoTask) return;
    const task = undoTask;

    setPendingTaskIds((prev) => ({ ...prev, [task.id]: true }));

    const res = await fetch(`/api/tasks/${task.id}/restore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.message ?? json.error ?? "Failed to restore task");
      setPendingTaskIds((prev) => ({ ...prev, [task.id]: false }));
      setShowUndoToast(false);
      setUndoTask(null);
      return;
    }

    // Reinsert restored task
    setTasks((prev) => [task, ...prev]);
    setPendingTaskIds((prev) => ({ ...prev, [task.id]: false }));
    setShowUndoToast(false);
    setUndoTask(null);
  }

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in-progress" },
    { label: "Done", value: "done" },
  ];

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
        {/* KT-23: Delete confirmation modal */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          taskTitle={selectedTask?.title ?? ""}
          loading={selectedTask ? !!pendingTaskIds[selectedTask.id] : false}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedTask(null);
          }}
          onConfirm={handleConfirmDelete}
        />

        {/* KT-23: Undo toast (>=10s) */}
        <UndoToast
          open={showUndoToast}
          message="Task deleted."
          durationMs={10000}
          disabled={undoTask ? !!pendingTaskIds[undoTask.id] : false}
          onUndo={handleUndoDelete}
          onClose={() => {
            setShowUndoToast(false);
            setUndoTask(null);
          }}
        />

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
            onClick={() => {
              setShowForm(true);
              setEditingTask(null);
            }}
            data-testid="add-task-button"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {/* Task form modal */}
        {(showForm || editingTask) && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            data-testid="task-modal"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <TaskForm
                initial={editingTask ?? undefined}
                mode={editingTask ? "edit" : "create"}
                onSubmit={editingTask ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
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
        ) : tasks.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12" data-testid="empty-state">
            No tasks found. Add one to get started!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" data-testid="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setShowForm(false);
                }}
                onDelete={handleDeleteRequest}
                isPending={!!pendingTaskIds[task.id]}
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
