'use client';

const MAP: Record<string, { cls: string; label: string }> = {
  draft:    { cls: 'bg-gray-100 text-gray-600',   label: 'Draft' },
  pending:  { cls: 'bg-yellow-50 text-yellow-700', label: 'Pending Review' },
  approved: { cls: 'bg-green-50 text-green-700',   label: 'Published' },
  rejected: { cls: 'bg-red-50 text-red-600',       label: 'Rejected' },
};

export default function StatusBadge({ status }: { status: string }) {
  const { cls, label } = MAP[status] ?? { cls: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}
