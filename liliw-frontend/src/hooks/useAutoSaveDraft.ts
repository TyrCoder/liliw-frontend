'use client';
import { useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

/**
 * Debounced auto-save for CMS edit forms.
 * Only fires when editingId is set (editing an existing entry, not creating).
 * Skips the first render after an entry is opened to avoid saving on open.
 *
 * `enabled` exists because PUT /api/cms/[type]/[id] resets status to 'draft'
 * on every write. Auto-saving an approved entry therefore pulled it off the
 * public site 1.5 seconds after a single keystroke, with nothing on screen to
 * say so. This hook is for drafts — as its name says — so callers pass false
 * for anything already published or awaiting review, and unpublishing stays a
 * deliberate act via the Save button.
 */
export function useAutoSaveDraft(
  editingId: string | undefined,
  depsKey: string,
  saveFn: () => Promise<void>,
  enabled = true,
): AutoSaveStatus {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const isMount   = useRef(true);
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!editingId) { isMount.current = true; return; }
    if (isMount.current) { isMount.current = false; return; }
    if (!enabled) return;

    if (timer.current)     clearTimeout(timer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);

    timer.current = setTimeout(async () => {
      setStatus('saving');
      await saveFnRef.current().catch(() => null);
      setStatus('saved');
      clearTimer.current = setTimeout(() => setStatus('idle'), 2500);
    }, 1500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [editingId, depsKey, enabled]);

  return status;
}
