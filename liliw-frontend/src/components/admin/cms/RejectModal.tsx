'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  remarks: string;
  onChangeRemarks: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function RejectModal({ open, remarks, onChangeRemarks, onConfirm, onCancel, loading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80);
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Reject Entry</p>
                  <p className="text-xs text-gray-400 mt-0.5">Remarks will be sent to the editor</p>
                </div>
              </div>
              <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rejection Remarks <span className="text-red-400">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={remarks}
                onChange={e => onChangeRemarks(e.target.value)}
                placeholder="Explain why this entry is being rejected…"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              {remarks.trim().length === 0 && (
                <p className="text-xs text-red-400 mt-1.5">Remarks are required before rejecting.</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!remarks.trim() || loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#DC2626' }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</>
                  : 'Confirm Reject'
                }
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
