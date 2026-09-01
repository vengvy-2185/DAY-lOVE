-- Day Life — auto-delete messages older than 24 hours.
-- Media files on disk/Supabase Storage are removed by the Node cron job
-- (server/src/jobs/autoDelete.js) BEFORE this SQL runs, since SQL alone
-- cannot touch the storage bucket. This statement is the DB-side cleanup
-- and is safe to run on its own as a backstop.

DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Also purge expired / used one-time login codes older than a day, and
-- expired sessions, to keep the DB tidy.
DELETE FROM login_codes
WHERE expires_at < NOW() - INTERVAL '24 hours';

DELETE FROM sessions
WHERE expires_at < NOW();

-- ============================================================
-- OPTION A: pg_cron (if enabled on your Postgres instance)
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'day-life-auto-delete',
--   '*/15 * * * *',  -- every 15 minutes
--   $$DELETE FROM messages WHERE created_at < NOW() - INTERVAL '24 hours';$$
-- );

-- ============================================================
-- OPTION B: Supabase Cron (Dashboard > Database > Cron Jobs)
-- ============================================================
-- Schedule: */15 * * * *
-- Command:  DELETE FROM messages WHERE created_at < NOW() - INTERVAL '24 hours';
-- Note: media files still need the Node job (autoDelete.js) to remove
-- objects from Supabase Storage, since Supabase Cron only runs SQL.
