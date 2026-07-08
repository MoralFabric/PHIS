-- migration_003: make guest_sessions.email optional
-- Visitors now enter the profile with no gate. Name/org/email are only
-- collected when a guest opens an AI tool (fit / interview), and only
-- name is required. Email must be nullable to support that flow.
-- Safe to run even if the column is already nullable.

ALTER TABLE guest_sessions ALTER COLUMN email DROP NOT NULL;
