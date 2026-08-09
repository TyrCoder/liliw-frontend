-- Phase 22 — Contact inbox
--
-- Messages from the contact form landed in community_submissions and were
-- never answerable: the dashboard listed them read-only, so replying meant
-- copying the address into a personal mail client, and nothing recorded that
-- a reply had been sent. Two staff could answer the same message, or nobody
-- could, and there was no way to tell which.
--
-- This adds the reply side and the handling state the inbox needs.

-- Replies sent from the dashboard. Kept as a thread rather than a single
-- column so a conversation can run to more than one message.
create table if not exists submission_replies (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references community_submissions(id) on delete cascade,
  body           text not null,
  sent_by        text not null,
  sent_at        timestamptz not null default now(),
  -- A reply row is written whether or not the mail actually left, because a
  -- failed send that vanishes silently is the bug this whole phase exists to
  -- avoid. `delivered` says which happened.
  delivered      boolean not null default false,
  delivery_error text
);

create index if not exists submission_replies_submission_idx
  on submission_replies (submission_id, sent_at desc);

-- Who picked the message up. Distinct from status: a message can be read by
-- one person and answered by another, and the inbox shows both.
alter table community_submissions add column if not exists handled_by text;
alter table community_submissions add column if not exists handled_at timestamptz;

-- status was free text carrying only 'new'. The inbox moves a message through
-- new → read → replied → closed, so the values are pinned down here.
alter table community_submissions alter column status set default 'new';
update community_submissions set status = 'new' where status is null or status = '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_submissions_status_check') then
    alter table community_submissions
      add constraint community_submissions_status_check
      check (status in ('new', 'read', 'replied', 'closed'));
  end if;
end $$;

-- Reading and writing happen only through the server with the service role,
-- exactly as community_submissions itself does — no policy grants the anon
-- key access, so the browser can never read other people's messages.
alter table submission_replies enable row level security;
