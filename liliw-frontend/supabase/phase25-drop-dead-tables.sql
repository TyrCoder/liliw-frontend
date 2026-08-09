-- Phase 25 — Remove three tables nothing reads
--
-- Each was superseded and left behind. None is referenced anywhere in the
-- codebase (checked across every .ts and .tsx), and all three are empty in
-- the live database:
--
--   visitor_records      0 rows — superseded by lbo_visitor_records. This
--                        specific pair has already caused one bug: a route
--                        read the wrong one of the two and would have
--                        reported zero visitors forever. Leaving the decoy
--                        in place invites exactly that again.
--   submission_replies   0 rows — the first draft of the inbox, replaced by
--                        inbox_replies in phase 22, which is keyed by
--                        (source, ref_id) and serves all three message
--                        sources rather than contact alone.
--   cms_hero_slides      0 rows — the homepage hero was changed to show the
--                        video alone, so nothing renders slides any more.
--
-- Each drop is guarded on the table actually being empty. If any of them has
-- gained a row since this was written, that row is a fact this migration did
-- not know about, and destroying it silently would be worse than the clutter
-- the migration exists to remove — so it is left alone and reported instead.

do $$
declare
  t         text;
  n         bigint;
  survivors text[] := '{}';
begin
  foreach t in array array['visitor_records', 'submission_replies', 'cms_hero_slides'] loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      raise notice '% — already gone, nothing to do', t;
      continue;
    end if;

    execute format('select count(*) from %I', t) into n;

    if n = 0 then
      execute format('drop table %I', t);   -- no CASCADE: see below
      raise notice '% — dropped (was empty)', t;
    else
      survivors := survivors || t;
      raise notice '% — KEPT: it now holds % row(s)', t, n;
    end if;
  end loop;

  if array_length(survivors, 1) is not null then
    raise warning 'Left in place because they are no longer empty: %. Look at what is in them before dropping by hand.',
      array_to_string(survivors, ', ');
  end if;
end $$;

-- Deliberately no CASCADE. If something turns out to depend on one of these,
-- the drop should fail and say so rather than quietly take a view, a foreign
-- key or another table down with it.

-- Verify: all three should be absent.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('visitor_records', 'submission_replies', 'cms_hero_slides');
