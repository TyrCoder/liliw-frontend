// CMS descriptions are authored as HTML via the Tiptap rich-text editor.
// Use this to render them as plain text in previews/snippets (cards, popups,
// search results) where markup would either show as literal tags or break
// line-clamp layouts. For full-content views, render the HTML directly instead.
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
