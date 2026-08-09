-- Phase 22 — Unified staff inbox
--
-- The public writes to the office through three separate doors: the contact
-- form (community_submissions), the participate form (participation_requests)
-- and custom event forms (event_form_responses). Each landed in its own
-- read-only table on its own dashboard tab, none could be answered, and
-- nothing recorded that anyone had dealt with a message. Two staff could
-- answer the same person, or neither could, and there was no way to tell.
--
-- Rather than add a status column and a replies table to each source — and to
-- event_form_responses, which does not exist until phase13 is run — the state
-- and the replies live in two tables keyed by (source, ref_id). A new kind of
-- message becomes a new source value and needs no migration at all.
--
-- Safe to run more than once, including over the earlier draft of this file
-- that created submission_replies.

-- ─────────────────────────────────────────────
-- 1. WHAT HAS BEEN DONE WITH A MESSAGE
-- ─────────────────────────────────────────────
-- Absence of a row means 'new', so nothing has to be backfilled and a message
-- that arrives while this runs is not left in a state that does not exist.
create table if not exists inbox_state (
  source     text        not null check (source in ('contact', 'participation', 'event')),
  ref_id     text        not null,
  status     text        not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  handled_by text,
  handled_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (source, ref_id)
);

-- ─────────────────────────────────────────────
-- 2. REPLIES SENT FROM THE DASHBOARD
-- ─────────────────────────────────────────────
-- A thread rather than a single column, so a conversation can run to more than
-- one message.
create table if not exists inbox_replies (
  id             uuid        primary key default gen_random_uuid(),
  source         text        not null check (source in ('contact', 'participation', 'event')),
  ref_id         text        not null,
  body           text        not null,
  sent_by        text        not null,
  sent_at        timestamptz not null default now(),
  -- Written whether or not the mail actually left. A send that fails silently
  -- leaves someone waiting on an answer nobody realises never went — which is
  -- the failure this whole phase exists to prevent.
  delivered      boolean     not null default false,
  delivery_error text
);

create index if not exists inbox_replies_thread_idx
  on inbox_replies (source, ref_id, sent_at);

-- ─────────────────────────────────────────────
-- 3. CARRY OVER THE EARLIER CONTACT-ONLY DRAFT
-- ─────────────────────────────────────────────
-- The first version of this file created submission_replies, tied by foreign
-- key to community_submissions. If it was run, its replies are moved across
-- and the old table is left in place untouched — dropping a table that holds
-- real correspondence is not something a migration should decide.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'submission_replies') then
    insert into inbox_replies (id, source, ref_id, body, sent_by, sent_at, delivered, delivery_error)
    select id, 'contact', submission_id::text, body, sent_by, sent_at, delivered, delivery_error
    from submission_replies
    on conflict (id) do nothing;
  end if;
end $$;

-- Likewise for any handling state the earlier draft wrote onto the table.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'community_submissions'
               and column_name = 'handled_by') then
    insert into inbox_state (source, ref_id, status, handled_by, handled_at)
    select 'contact', id::text,
           case when status in ('new','read','replied','closed') then status else 'new' end,
           handled_by, handled_at
    from community_submissions
    where handled_by is not null or status <> 'new'
    on conflict (source, ref_id) do nothing;
  end if;
end $$;

-- ─────────────────────────────────────────────
-- 4. ACCESS
-- ─────────────────────────────────────────────
-- Reached only through the server with the service role, exactly as the three
-- source tables are. No policy grants the anon key anything, so the browser
-- can never read the public's correspondence.
alter table inbox_state   enable row level security;
alter table inbox_replies enable row level security;
