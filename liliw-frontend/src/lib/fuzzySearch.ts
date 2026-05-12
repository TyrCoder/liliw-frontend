function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : 1 + Math.min(row[j - 1], row[j], prev);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

// Allow 1 typo for 4–5 char words, 2 typos for 6+ char words, exact for shorter.
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();

  if (t.includes(q)) return true;

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 2);
  const textWords = t.split(/\s+/);

  return queryWords.every((qw) => {
    if (t.includes(qw)) return true;
    const maxDist = qw.length >= 6 ? 2 : qw.length >= 4 ? 1 : 0;
    if (maxDist === 0) return false;
    return textWords.some((tw) => levenshtein(tw, qw) <= maxDist);
  });
}
