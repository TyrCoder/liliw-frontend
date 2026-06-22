'use client';

const MAP: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  pending:  'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${MAP[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
