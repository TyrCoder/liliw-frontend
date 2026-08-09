'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

/**
 * A date and time field that looks like the rest of the CMS.
 *
 * `<input type="datetime-local">` hands the job to the browser, which draws a
 * grey scrolling column picker that belongs to Chrome rather than to this
 * application — and looks different again in every other browser. This is the
 * same control drawn in the CMS's own type, spacing and blue.
 *
 * The value is kept in the exact format the native input used, `YYYY-MM-DDTHH:mm`
 * in local time, so nothing downstream has to change.
 */

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local, not ISO — toISOString() would shift the day across a timezone. */
function toValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.length <= 16 ? value : value.slice(0, 16));
  return Number.isNaN(d.getTime()) ? null : d;
}

function label(d: Date | null) {
  if (!d) return '';
  return `${d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${
    d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export default function DateTimePicker({
  value, onChange, placeholder = 'Pick a date and time',
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const selected = useMemo(() => parse(value), [value]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => selected ?? new Date());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Reopening on an existing value should land on that month, not on today.
  useEffect(() => { if (open && selected) setCursor(selected); }, [open]);

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

  // Leading blanks so the 1st lands under its weekday.
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }, [cursor]);

  /** Picking a day keeps the time already chosen; a first pick defaults to 9am. */
  const pickDay = (day: number) => {
    const base = selected ?? new Date(new Date().setHours(9, 0, 0, 0));
    onChange(toValue(new Date(cursor.getFullYear(), cursor.getMonth(), day, base.getHours(), base.getMinutes())));
  };

  /** Time is meaningless without a date, so this picks today if none is set. */
  const setTime = (h: number, m: number) => {
    const base = selected ?? new Date();
    onChange(toValue(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m)));
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === cursor.getFullYear() &&
    today.getMonth() === cursor.getMonth() &&
    today.getDate() === day;
  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === cursor.getFullYear() &&
    selected.getMonth() === cursor.getMonth() &&
    selected.getDate() === day;

  const hours = selected ? selected.getHours() : 9;
  const minutes = selected ? selected.getMinutes() : 0;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const isPm = hours >= 12;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-colors ${
          open ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? label(selected) : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={e => { e.stopPropagation(); onChange(null); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onChange(null); } }}
            className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[300px] bg-white rounded-2xl border border-gray-200 shadow-xl p-3">
          {/* Month */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-gray-800">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((day, i) =>
              day === null ? <div key={`blank-${i}`} /> : (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`h-8 rounded-lg text-sm transition-colors ${
                    isSelected(day)
                      ? 'text-white font-bold'
                      : isToday(day)
                        ? 'font-bold hover:bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={
                    isSelected(day) ? { backgroundColor: '#1565C0' }
                    : isToday(day)  ? { color: '#1565C0' }
                    : undefined
                  }
                >
                  {day}
                </button>
              ),
            )}
          </div>

          {/* Time */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={hour12}
                onChange={e => setTime((Number(e.target.value) % 12) + (isPm ? 12 : 0), minutes)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
              <span className="text-gray-400 font-bold">:</span>
              <select
                value={minutes}
                onChange={e => setTime(hours, Number(e.target.value))}
                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {/* Five-minute steps: sixty options to scroll past is the thing
                    that made the native picker painful. */}
                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {(['AM', 'PM'] as const).map(ap => {
                  const active = (ap === 'PM') === isPm;
                  return (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setTime((hour12 % 12) + (ap === 'PM' ? 12 : 0), minutes)}
                      className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${active ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                      style={active ? { backgroundColor: '#1565C0' } : undefined}
                    >
                      {ap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600">
              Clear
            </button>
            <button type="button"
              onClick={() => {
                const now = new Date();
                setCursor(now);
                onChange(toValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())));
              }}
              className="ml-auto text-xs font-semibold" style={{ color: '#1565C0' }}>
              Now
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#1565C0' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
