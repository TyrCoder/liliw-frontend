'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Archive, Loader2, RotateCcw, Trash2 } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'neutral';

const TONES: Record<ConfirmTone, { accent: string; soft: string; icon: React.ReactNode }> = {
  danger:  { accent: '#DC2626', soft: '#FEF2F2', icon: <Trash2 className="w-5 h-5" /> },
  warning: { accent: '#B45309', soft: '#FFFBEB', icon: <Archive className="w-5 h-5" /> },
  neutral: { accent: '#0F5FB5', soft: '#EFF6FF', icon: <RotateCcw className="w-5 h-5" /> },
};

/**
 * Replaces window.confirm for destructive CMS actions.
 *
 * The browser dialog names the site rather than the thing being acted on —
 * "liliw-frontend-prod.vercel.app says: Delete this artisan?" — puts the
 * confirming button on the left in some browsers, and cannot say what actually
 * happens. This one names the entry, explains the consequence, and lets the
 * wording differ between archiving something and destroying it.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'danger', loading, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { accent, soft, icon } = TONES[tone];

  // Focus lands on Confirm so the keyboard path is one key, but Escape always
  // cancels — the safe option is never the one you have to hunt for.
  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          role="alertdialog" aria-modal="true" aria-label={title}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">

            <div className="px-6 pt-6 pb-5 flex gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: soft, color: accent }}>
                {icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-base leading-snug">{title}</h3>
                <div className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={onCancel} disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200/70 transition disabled:opacity-50">
                {cancelLabel}
              </button>
              <button ref={confirmRef} onClick={onConfirm} disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                style={{ backgroundColor: accent }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shown inside ConfirmDialog when an action cannot be undone. */
export function IrreversibleNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-600">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </span>
  );
}
