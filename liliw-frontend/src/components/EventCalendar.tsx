'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarEvent {
  date: string;
  title: string;
  description?: string;
  category?: string;
}

interface EventCalendarProps {
  attractionName?: string;
  events?: CalendarEvent[];
}

function extractText(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.flatMap((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '')).join(' ');
  return '';
}

export default function EventCalendar({ attractionName, events: propEvents }: EventCalendarProps) {
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents]             = useState<CalendarEvent[]>(propEvents ?? []);

  useEffect(() => {
    if (propEvents) { setEvents(propEvents); return; }
    fetch('/api/strapi/events')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const raw: any[] = json?.data ?? [];
        const mapped: CalendarEvent[] = raw
          .map(item => {
            const a = item?.attributes ?? item;
            const dateStr = a?.date ?? a?.start_date ?? a?.event_date ?? a?.createdAt;
            if (!dateStr) return null;
            return {
              date: dateStr.slice(0, 10),
              title: a?.name ?? a?.title ?? 'Event',
              description: extractText(a?.description)?.slice(0, 120) || undefined,
              category: a?.category ?? a?.type ?? undefined,
            };
          })
          .filter(Boolean) as CalendarEvent[];
        setEvents(mapped);
      })
      .catch(() => {});
  }, [attractionName]);

  const getDaysInMonth  = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth  = getDaysInMonth(currentDate);
  const firstDay     = getFirstDayOfMonth(currentDate);
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const formatDate = (day: number) =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];

  const getEventsForDate   = (day: number) => events.filter(e => e.date === formatDate(day));
  const selectedDateEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];
  const upcomingEvents     = events
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const categoryColors: Record<string, string> = {
    festival:    'bg-purple-100 text-purple-700',
    tour:        'bg-blue-100 text-blue-700',
    workshop:    'bg-green-100 text-green-700',
    celebration: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Calendar */}
      <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#0F1F3C' }}>{currentMonth}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-sm font-semibold text-gray-600 h-8 flex items-center justify-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const dateStr  = day ? formatDate(day) : '';
              const dayEvents = day ? getEventsForDate(day) : [];
              const isSelected = dateStr === selectedDate;
              return (
                <button key={idx} onClick={() => day && setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg flex items-center justify-center relative transition ${day ? 'hover:bg-gray-100 cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-teal-500' : ''}`}
                  style={isSelected ? { backgroundColor: '#e0f9f7' } : {}}>
                  {day && (
                    <>
                      <span className="text-sm font-medium">{day}</span>
                      {dayEvents.length > 0 && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00BFB3' }} />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Events List */}
      <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        className="bg-gray-50 p-6 rounded-xl">
        <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: '#0F1F3C' }}>
          <CalendarIcon size={20} style={{ color: '#00BFB3' }} />
          {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('default', { dateStyle: 'long' }) : 'Select a date'}
        </h3>

        {selectedDateEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedDateEvents.map((event, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-3 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm" style={{ color: '#0F1F3C' }}>{event.title}</h4>
                {event.description && <p className="text-xs text-gray-600">{event.description}</p>}
                {event.category && (
                  <span className={`text-xs font-medium px-2 py-1 rounded w-fit block ${categoryColors[event.category.toLowerCase()] ?? 'bg-blue-100 text-blue-700'}`}>
                    {event.category}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">No events on this date</p>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-sm mb-3" style={{ color: '#0F1F3C' }}>Upcoming Events</h4>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="text-xs p-2 bg-white rounded hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => setSelectedDate(event.date)}>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-gray-500">{new Date(event.date + 'T12:00:00').toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-xs text-center py-2">No upcoming events</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
