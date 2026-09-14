'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Option { value: string; label: string; }

/**
 * A tick that reveals a multi-select dropdown.
 *
 * These options used to sit in the form as a permanent row of checkboxes,
 * which put every category in front of the editor on every attraction — while
 * the field is optional and usually left empty. Ticking is the question worth
 * asking ("is this place more than one thing?"); the list only matters once
 * the answer is yes, so it stays folded into a dropdown until then.
 */
export default function MultiSelectField({
  value, options, onChange, toggleLabel, placeholder = 'Choose…',
}: {
  value: string[];
  options: Option[];
  onChange: (next: string[]) => void;
  /** Wording for the tick itself — the question being answered, not the field name. */
  toggleLabel: string;
  placeholder?: string;
}) {
  const [enabled, setEnabled] = useState(value.length > 0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleOption = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  /** Unticking clears the picks: a hidden value would keep listing the place somewhere the form no longer shows. */
  const setTicked = (on: boolean) => {
    setEnabled(on);
    setOpen(on);
    if (!on && value.length) onChange([]);
  };

  const chosen = options.filter(o => value.includes(o.value));

  return (
    <div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
        <input type="checkbox" className="w-4 h-4 rounded accent-blue-600"
          checked={enabled} onChange={e => setTicked(e.target.checked)} />
        <span className="text-sm text-gray-700 font-medium">{toggleLabel}</span>
      </label>

      {enabled && (
        <div className="relative mt-2" ref={wrapRef}>
          <button type="button" onClick={() => setOpen(o => !o)}
            className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-colors ${
              open ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <span className={`flex-1 capitalize ${chosen.length ? 'text-gray-800' : 'text-gray-400'}`}>
              {chosen.length ? chosen.map(o => o.label).join(', ') : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute z-30 mt-2 w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 max-h-60 overflow-y-auto">
              {options.map(o => {
                const picked = value.includes(o.value);
                return (
                  <button key={o.value} type="button" onClick={() => toggleOption(o.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left capitalize transition ${
                      picked ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      picked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {picked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
