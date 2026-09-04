'use client';

import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paging for the lists in the admin panel.
 *
 * Client-side, because every list it is used on is already fully in memory —
 * the routes return the whole table and the page slices it. That is the right
 * trade at this size: 43 accounts, 36 attractions, a few hundred visitor
 * records. It is not the right trade forever, and the places where it will
 * break first are already known: /api/event-signup caps at 200 rows and
 * PostgREST caps at 1000, so those lists silently stop growing rather than
 * paginating. Moving those to server-side paging is a change to the routes,
 * not to this component.
 */
export function usePaged<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(items.length / pageSize));

  // Deleting the last row of the last page, or filtering the list down, would
  // otherwise leave the view on a page that no longer exists — an empty table
  // with no way back except reloading.
  useEffect(() => { if (page > total) setPage(total); }, [page, total]);

  const slice = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, setPage, totalPages: total, slice, pageSize, count: items.length };
}

export function Pagination({ page, totalPages, count, pageSize, onChange, label = 'items' }: {
  page: number;
  totalPages: number;
  count: number;
  pageSize: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (count === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);

  // A window around the current page rather than every number: with 40 pages a
  // full run of buttons is unusable and wraps the row.
  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const btn = 'min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 tabular-nums">
        {first}–{last} of {count} {label}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(page - 1)} disabled={page === 1}
            aria-label="Previous page"
            className={`${btn} border border-gray-200 text-gray-600 hover:border-gray-300`}>
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((p, i) => p === '…' ? (
            <span key={`gap${i}`} className="px-1 text-xs text-gray-300">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${p === page
                ? 'text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={p === page ? { backgroundColor: '#0B3D91' } : undefined}>
              {p}
            </button>
          ))}

          <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
            aria-label="Next page"
            className={`${btn} border border-gray-200 text-gray-600 hover:border-gray-300`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
