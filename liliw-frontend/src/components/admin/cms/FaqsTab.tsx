'use client';

import { HelpCircle } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';

interface Entry {
  id: string; question: string; answer: string; category: string;
  sort_order: number; status: string; created_by: string;
  reject_remarks: string | null; created_at: string;
}

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'faqs',
  title: 'FAQs',
  subtitle: 'Frequently asked questions',
  entityLabel: 'FAQ',
  emptyIcon: <HelpCircle className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No FAQs yet',
  empty: { question: '', answer: '', category: '', sort_order: 0, reject_remarks: null },
  fields: [
    { name: 'question',   label: 'Question', type: 'text',     required: true, placeholder: 'What is…?' },
    { name: 'answer',     label: 'Answer',   type: 'textarea', required: true, rows: 5 },
    { name: 'category',   label: 'Category', type: 'text',     colSpan: 1, placeholder: 'e.g. Travel, Permits' },
    { name: 'sort_order', label: 'Sort Order', type: 'number', colSpan: 1 },
  ],
  columns: [
    { header: 'Question', primary: true, render: e => <p className="font-semibold text-gray-900 max-w-[300px] truncate">{e.question}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 text-xs">{e.category || '—'}</span> },
    { header: 'Order',    render: e => <span className="text-gray-400 text-xs">{e.sort_order}</span> },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function FaqsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
