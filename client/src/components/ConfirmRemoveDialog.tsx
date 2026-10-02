"use client";

import React, { useEffect } from "react";

/**
 * The one "are you sure?" used everywhere something gets removed.
 *
 * The rule the client set: the first click never deletes. It opens this, the
 * person reads back what they are about to remove — by name, not "this item" —
 * and only the second click inside here actually does it. Test uploads left on
 * a live site are what this exists to clear out, so the path has to be short:
 * click, read, confirm.
 */
export default function ConfirmRemoveDialog({
  open,
  title = "Remove this?",
  itemName,
  body,
  warning,
  confirmLabel = "Yes, remove it",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  /** What is being removed, shown back verbatim so there is no mistaking it. */
  itemName?: string;
  body?: string;
  /** Consequence copy — shown in red when removal costs someone something. */
  warning?: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Escape cancels, so a mis-click is never a trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#25233b] border border-white/10 text-white p-6 max-w-md w-full"
      >
        <h2 className="text-lg font-semibold mb-3">{title}</h2>

        {itemName && (
          <p className="text-[1.05rem] font-semibold text-second mb-2 break-words">
            {itemName}
          </p>
        )}

        <p className="text-sm text-gray-200 mb-2">
          {body ?? "This can't be undone."}
        </p>

        {warning && (
          <p className="text-sm text-red-400 border-l-2 border-red-500 pl-3 mb-2">
            {warning}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 border border-white/30 text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50"
          >
            {busy ? "Removing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
