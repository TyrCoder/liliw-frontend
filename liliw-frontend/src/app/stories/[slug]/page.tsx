'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Calendar, BookOpen } from 'lucide-react';
import GatTayaw from '@/components/GatTayaw';

function getAudioKey(category: string, slug: string, title = ''): string {
  // Check slug + title together so synthetic stories (UUID slugs) still match by title
  const s = (slug + ' ' + title).toLowerCase();
  const c = category.toLowerCase();
  if (s.includes('church') || s.includes('simbahan') || s.includes('parish'))    return 'church';
  if (s.includes('tsinelas') || s.includes('slipper') || s.includes('sapatos'))  return 'tsinelas';
  if (s.includes('ancestral') || s.includes('bahay') || s.includes('house'))     return 'ancestral';
  if (s.includes('legend') || s.includes('alamat') || s.includes('myth'))        return 'legend';
  if (c === 'history')  return 'legend';
  if (c === 'culture')  return 'ancestral';
  if (c === 'food')     return 'tsinelas';
  return 'welcome';
}

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const CATEGORY_COLORS: Record<string, string> = {
  history:  '#EF4444',
  culture:  '#8B5CF6',
  people:   '#EAB308',
  nature:   '#22C55E',
  food:     '#F97316',
  festival: '#EC4899',
};

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

// Render a single inline node (text with formatting, or link)
function InlineNode({ node }: { node: any }): React.ReactNode {
  if (!node) return null;

  if (node.type === 'link') {
    return (
      <a href={node.url ?? '#'} target="_blank" rel="noopener noreferrer"
        className="underline hover:opacity-75 transition-opacity" style={{ color: '#1565C0' }}>
        {(node.children ?? []).map((c: any, i: number) => <InlineNode key={i} node={c} />)}
      </a>
    );
  }

  const text: string = node.text ?? '';
  if (!text) return null;

  if (node.code) return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{text}</code>;

  let el: React.ReactNode = text;
  if (node.bold)          el = <strong className="font-bold">{el}</strong>;
  if (node.italic)        el = <em className="italic">{el}</em>;
  if (node.underline)     el = <u className="underline decoration-current">{el}</u>;
  if (node.strikethrough) el = <s>{el}</s>;
  return <>{el}</>;
}

function InlineContent({ children }: { children: any[] }) {
  return <>{(children ?? []).map((c: any, i: number) => <InlineNode key={i} node={c} />)}</>;
}

function RichTextBlock({ block }: { block: any }) {
  if (!block) return null;

  if (block.type === 'heading') {
    const level = block.level ?? 2;
    const sizeMap: Record<number, string> = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg', 5: 'text-base', 6: 'text-sm' };
    const cls = `${sizeMap[level] ?? 'text-xl'} font-bold mt-8 mb-3`;
    const s = { color: '#1A1A2E', fontFamily: HL };
    const content = <InlineContent children={block.children} />;
    if (level === 1) return <h1 className={cls} style={s}>{content}</h1>;
    if (level === 3) return <h3 className={cls} style={s}>{content}</h3>;
    if (level === 4) return <h4 className={cls} style={s}>{content}</h4>;
    if (level === 5) return <h5 className={cls} style={s}>{content}</h5>;
    if (level === 6) return <h6 className={cls} style={s}>{content}</h6>;
    return <h2 className={cls} style={s}>{content}</h2>;
  }

  if (block.type === 'paragraph') {
    return (
      <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: BL }}>
        <InlineContent children={block.children} />
      </p>
    );
  }

  if (block.type === 'list') {
    const listItems = (block.children ?? []).map((item: any, i: number) => {
      // list-item children may contain paragraph nodes or inline text nodes
      const itemContent = (item.children ?? []).map((child: any, j: number) => {
        if (child.type === 'paragraph' || child.type === 'list-item') {
          return <InlineContent key={j} children={child.children ?? []} />;
        }
        return <InlineNode key={j} node={child} />;
      });
      return <li key={i} style={{ fontFamily: BL }}>{itemContent}</li>;
    });
    return block.format === 'ordered'
      ? <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">{listItems}</ol>
      : <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">{listItems}</ul>;
  }

  if (block.type === 'image') {
    const src = mediaUrl(block?.image?.url);
    const alt = block?.image?.alternativeText ?? '';
    if (!src) return null;
    return (
      <figure className="my-8">
        <img src={src} alt={alt} className="w-full rounded-xl object-cover shadow-md" />
        {alt && (
          <figcaption className="text-center text-sm text-gray-400 mt-2 italic" style={{ fontFamily: BL }}>
            {alt}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 pl-5 py-2 my-6 italic text-gray-600 bg-amber-50 rounded-r-xl"
        style={{ borderColor: '#F5C518', fontFamily: BL }}>
        <InlineContent children={block.children} />
      </blockquote>
    );
  }

  if (block.type === 'code') {
    const code = (block.children ?? []).map((c: any) => c?.text ?? '').join('');
    return (
      <pre className="bg-gray-900 text-green-400 rounded-xl p-4 my-6 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    );
  }

  // Generic fallback — render children as inline content
  const children = block.children ?? [];
  if (!children.length) return null;
  return (
    <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: BL }}>
      <InlineContent children={children} />
    </p>
  );
}

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory]     = useState<any>(null);
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
            id:       found.id,
            title:    a?.title ?? '',
            excerpt:  typeof a?.excerpt === 'string' ? a.excerpt : '',
            content:  Array.isArray(a?.content) ? a.content : [],
            category: a?.category ?? 'history',
            author:   a?.author ?? 'Liliw Tourism',
            coverUrl: mediaUrl(img?.url ?? img?.formats?.large?.url),
            featured: a?.featured ?? false,
            date:     a?.publishedAt
              ? new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12" style={{ fontFamily: BL }}>
        <div className="animate-pulse space-y-6">
          <div className="h-5 bg-gray-200 rounded w-28" />
          <div className="h-80 bg-gray-200 rounded-2xl" />
          <div className="h-10 bg-gray-200 rounded w-2/3" />
          <div className="flex gap-10">
            <div className="w-72 shrink-0 space-y-3">
              <div className="h-48 bg-gray-200 rounded-2xl" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#0B3D91', opacity: 0.4 }} />
        <p className="text-xl font-semibold text-gray-600" style={{ fontFamily: HL }}>Story not found</p>
        <Link href="/stories" className="mt-4 inline-block text-sm font-semibold"
          style={{ color: '#0B3D91', fontFamily: BL }}>
          ← Back to Stories
        </Link>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[story.category] ?? '#0B3D91';

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Cover image */}
      {story.coverUrl && (
        <div className="w-full h-64 sm:h-96 overflow-hidden relative">
          <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white uppercase tracking-wide"
              style={{ backgroundColor: catColor, fontFamily: HL }}>
              {story.category}
            </span>
            {story.featured && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(245,197,24,0.95)', color: '#0B3D91', fontFamily: HL }}>
                Featured
              </span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Back link */}
          <Link href="/stories" className="inline-flex items-center gap-1 text-sm font-semibold mb-6 group"
            style={{ color: '#0B3D91', fontFamily: BL }}>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> Back to Stories
          </Link>

          {/* Category badges (only when no cover image) */}
          {!story.coverUrl && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white capitalize"
                style={{ backgroundColor: catColor, fontFamily: HL }}>
                {story.category}
              </span>
              {story.featured && (
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(245,197,24,0.15)', color: '#0B3D91', fontFamily: HL }}>
                  Featured
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl"
            style={{ color: '#1A1A2E', fontFamily: DL }}>
            {story.title}
          </h1>

          {/* Author + date */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-10 pb-8 border-b border-gray-100"
            style={{ fontFamily: BL }}>
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{story.author}</span>
            {story.date && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{story.date}</span>}
          </div>

          {/* Two-column layout: GatTayaw sidebar (left) + Article content (right) */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

            {/* ── Left sidebar: GatTayaw + dog (sticky on desktop) ── */}
            <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-8">
              <GatTayaw defaultKey={getAudioKey(story.category, slug, story.title)} />
              <div className="flex justify-center mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/liliw-dog.png"
                  alt="Liliw mascot"
                  className="gat-float"
                  style={{ width: 130, height: 'auto', display: 'block', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}
                />
              </div>
            </div>

            {/* ── Right column: Article body ── */}
            <div className="flex-1 min-w-0">

              {/* Excerpt — styled pull quote */}
              {story.excerpt && (
                <p className="text-lg text-gray-600 leading-relaxed mb-8 pl-4 border-l-4 font-medium italic"
                  style={{ fontFamily: DL, borderColor: catColor }}>
                  {story.excerpt}
                </p>
              )}

              {/* Rich text content */}
              <div>
                {story.content.length > 0
                  ? story.content.map((block: any, i: number) => <RichTextBlock key={i} block={block} />)
                  : <p className="text-gray-400 italic" style={{ fontFamily: BL }}>No content yet.</p>
                }
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <Link href="/stories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#1565C0', color: '#ffffff', fontFamily: BL }}>
              <BookOpen className="w-4 h-4" /> More Stories
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
