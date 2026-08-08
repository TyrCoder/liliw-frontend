'use client';

import { Calendar } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; title: string; category: string; description: string;
  venue: string; date_start: string | null; date_end: string | null;
  is_joinable: boolean; slug: string; status: string;
  created_by: string; reject_remarks: string | null; created_at: string;
  media?: MediaItem[];
}

const CATEGORIES = ['festival', 'seminar', 'workshop', 'sports', 'cultural', 'other'];

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'events',
  title: 'Events',
  subtitle: 'Festivals, seminars, workshops and community activities',
  entityLabel: 'Event',
  emptyIcon: <Calendar className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No events yet',
  empty: {
    title: '', category: 'cultural', description: '', venue: '',
    date_start: null, date_end: null, is_joinable: false,
    slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',       label: 'Title',    type: 'text', required: true },
    { name: 'category',    label: 'Category', type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c })) },
    { name: 'venue',       label: 'Venue',    type: 'text', colSpan: 1 },
    { name: 'date_start',  label: 'Start Date', type: 'datetime', colSpan: 1 },
    { name: 'date_end',    label: 'End Date',   type: 'datetime', colSpan: 1 },
    { name: 'is_joinable', label: 'Allow public sign-ups (Joinable)', type: 'checkbox' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 4,
      placeholder: 'What is happening… A Facebook video link pasted here plays inside the event.' },
    { name: 'media',       label: 'Cover Photo', type: 'media', maxFiles: 1 },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category}</span> },
    { header: 'Date', render: e => (
      <span className="text-gray-400 text-xs">
        {e.date_start
          ? new Date(e.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </span>
    ) },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function EventsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
