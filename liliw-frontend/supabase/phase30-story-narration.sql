-- Which narration Gat Tayaw reads on a story page.
--
-- The story page used to work this out by looking for words in the slug and
-- title — church, tsinelas, ancestral, legend — and fell back to a mapping
-- from the category when it found none. A story on any other subject was
-- therefore narrated with whichever script its category happened to point at,
-- silently and with no way for an editor to correct it.
--
-- Nullable on purpose: null means "work it out", which is exactly what every
-- story published before this column existed needs.

alter table public.cms_stories
  add column if not exists audio_key text;

comment on column public.cms_stories.audio_key is
  'Narration for Gat Tayaw: welcome | legend | church | ancestral | tsinelas. Null = infer from slug, title and category.';

-- Keys are a closed set, and a typo here would be a story that plays nothing.
--
-- The empty string is allowed alongside null because that is what the CMS
-- sends for "choose automatically": a <select> whose blank option has value
-- "". Rejecting it would mean every story saved without an explicit narration
-- failed to save at all, which is the default case. Both mean unset, and the
-- page treats them identically — isNarrationKey('') is false, so the fallback
-- runs exactly as it does for null.
alter table public.cms_stories
  drop constraint if exists cms_stories_audio_key_check;

alter table public.cms_stories
  add constraint cms_stories_audio_key_check
  check (
    audio_key is null
    or audio_key = ''
    or audio_key in ('welcome','legend','church','ancestral','tsinelas')
  );
