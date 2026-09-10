-- Narration recordings uploaded through the CMS.
--
-- Until now the storyteller's audio lived in the repository, at fixed
-- filenames under public/audio. Changing a recording meant editing files and
-- deploying, which is fine for the people who built this and impossible for
-- the office that will run it after they have gone. An editor could choose
-- which recording played but could not change what was in it.
--
-- The files go to Cloudinary, where every other upload already goes. These
-- columns hold their URLs, one per language, so a story can carry its own
-- narration.
--
-- Nullable, and null is the normal case: a story without its own recording
-- falls back to the built-in narration chosen by audio_key, exactly as it
-- does today. Nothing that works now stops working.

alter table public.cms_stories
  add column if not exists audio_en  text,
  add column if not exists audio_fil text;

comment on column public.cms_stories.audio_en is
  'Cloudinary URL of the English narration. Null = use the built-in recording for audio_key.';
comment on column public.cms_stories.audio_fil is
  'Cloudinary URL of the Filipino narration. Null = use the built-in recording for audio_key.';

-- A URL or nothing. A half-typed path here is a story that plays silence with
-- no error anywhere, which is the failure that is hardest to notice.
alter table public.cms_stories
  drop constraint if exists cms_stories_audio_urls_check;

alter table public.cms_stories
  add constraint cms_stories_audio_urls_check
  check (
    (audio_en  is null or audio_en  = '' or audio_en  like 'https://%')
    and
    (audio_fil is null or audio_fil = '' or audio_fil like 'https://%')
  );
