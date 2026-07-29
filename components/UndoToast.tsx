"use client";

import { useEffect, useMemo, useState } from "react";

interface UndoToastProps {
  open: boolean;
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export default function UndoToast({
  open,
  message,
  durationMs = 10000,
  onUndo,
  onClose,
  disabled = false,
}: UndoToastProps) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const stepMs = 250;

  const progress = useMemo(() => {
    if (durationMs <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((remainingMs / durationMs) * 100)));
  }, [remainingMs, durationMs]);

  useEffect(() => {
    if (!open) return;
    setRemainingMs(durationMs);

    const interval = window.setInterval(() => {
      setRemainingMs((ms) => Math.max(0, ms - stepMs));
    }, stepMs);

    const timeout = window.setTimeout(() => onClose(), durationMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" data-testid="undo-toast">
      <div className="bg-gray-900 text-white rounded-xl shadow-xl px-4 py-3 w-[min(92vw,420px)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" data-testid="undo-toast-message">
            {message}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUndo}
              disabled={disabled}
              className="text-sm font-medium underline underline-offset-2 disabled:opacity-60"
              data-testid="undo-toast-undo"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-300 hover:text-white"
              aria-label="Close"
              data-testid="undo-toast-close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="h-1 bg-gray-700 rounded mt-2 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
