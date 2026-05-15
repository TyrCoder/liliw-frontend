'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Calendar, BookOpen } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const CATEGORY_COLORS: Record<string, string> = {
  history:  '#00BFB3',
  culture:  '#8B5CF6',
  people:   '#F59E0B',
  nature:   '#10B981',
  food:     '#EF4444',
  festival: '#EC4899',
};

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

function blockText(children: any[]): string {
  return (children ?? []).map((c: any) => c?.text ?? '').join('');
}

function RichTextBlock({ block }: { block: any }) {
  if (block?.type === 'heading') {
    const text = blockText(block.children);
    const cls = `${['text-3xl','text-2xl','text-xl','text-lg'][((block.level ?? 2) - 1)] ?? 'text-xl'} font-bold mt-8 mb-3`;
    const s = { color: '#0F1F3C' };
    if (block.level === 1) return <h1 className={cls} style={s}>{text}</h1>;
    if (block.level === 3) return <h3 className={cls} style={s}>{text}</h3>;
    if (block.level === 4) return <h4 className={cls} style={s}>{text}</h4>;
    return <h2 className={cls} style={s}>{text}</h2>;
  }
  if (block?.type === 'paragraph') {
    return <p className="text-gray-700 leading-relaxed mb-4">{blockText(block.children)}</p>;
  }
  if (block?.type === 'list') {
    const items: any[] = block?.children ?? [];
    const listItems = items.map((item: any, i: number) => (
      <li key={i}>{blockText(item?.children)}</li>
    ));
    return block.format === 'ordered'
      ? <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">{listItems}</ol>
      : <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">{listItems}</ul>;
  }
  if (block?.type === 'image') {
    const src = mediaUrl(block?.image?.url);
    return src ? <img src={src} alt={block?.image?.alternativeText ?? ''} className="w-full rounded-xl my-6 object-cover" /> : null;
  }
  if (block?.type === 'quote') {
    return <blockquote className="border-l-4 pl-5 py-1 my-6 italic text-gray-600" style={{ borderColor: '#00BFB3' }}>{blockText(block.children)}</blockquote>;
  }
  const fallback = blockText(block?.children ?? []);
  return fallback ? <p className="text-gray-700 leading-relaxed mb-4">{fallback}</p> : null;
}

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/strapi/stories`)
      .then(r => r.json())
      .then(json => {
        const all: any[] = json?.data ?? [];
        const found = all.find(item => {
          const a = item?.attributes ?? item;
          return a?.slug === slug || String(item.id) === slug;
        });
        if (found) {
          const a = found?.attributes ?? found;
          const img = a?.cover_image?.data?.attributes ?? a?.cover_image ?? {};
          setStory({
            id: found.id,
            title: a?.title ?? '',
            excerpt: a?.excerpt ?? '',
            content: a?.content ?? [],
            category: a?.category ?? 'history',
            author: a?.author ?? 'Liliw Tourism',
            coverUrl: mediaUrl(img?.url ?? img?.formats?.large?.url),
            featured: a?.featured ?? false,
            date: a?.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-80 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#00BFB3', opacity: 0.4 }} />
        <p className="text-xl font-semibold text-gray-600">Story not found</p>
        <Link href="/stories" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#00BFB3' }}>← Back to Stories</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Cover image */}
      {story.coverUrl && (
        <div className="w-full h-64 sm:h-96 overflow-hidden relative">
          <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Back link */}
          <Link href="/stories" className="inline-flex items-center gap-1 text-sm font-semibold mb-6 group"
            style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> Back to Stories
          </Link>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white capitalize"
              style={{ backgroundColor: CATEGORY_COLORS[story.category] ?? '#00BFB3' }}>
              {story.category}
            </span>
            {story.featured && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">Featured</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#0F1F3C' }}>{story.title}</h1>

          {/* Author + date */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{story.author}</span>
            {story.date && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{story.date}</span>}
          </div>

          {/* Excerpt */}
          {story.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 font-medium italic">{story.excerpt}</p>
          )}

          {/* Rich text content */}
          <div className="prose-custom">
            {Array.isArray(story.content) && story.content.length > 0
              ? story.content.map((block: any, i: number) => <RichTextBlock key={i} block={block} />)
              : <p className="text-gray-400 italic">No content yet.</p>
            }
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <Link href="/stories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition hover:opacity-90"
              style={{ backgroundColor: '#00BFB3' }}>
              <BookOpen className="w-4 h-4" /> More Stories
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
