"use client";

import { useEffect, useRef } from "react";

interface DeleteConfirmModalProps {
  open: boolean;
  taskTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  taskTitle,
  onCancel,
  onConfirm,
  loading = false,
}: DeleteConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      data-testid="delete-confirm-modal"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 id="delete-modal-title" className="text-lg font-semibold mb-2">
          Delete task?
        </h2>
        <p className="text-sm text-gray-600 mb-6" data-testid="delete-modal-task-title">
          {taskTitle}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            data-testid="delete-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            data-testid="delete-confirm-button"
          >
            {loading ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
