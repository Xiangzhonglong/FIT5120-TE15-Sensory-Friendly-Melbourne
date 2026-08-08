-- Prerequisite:
-- Create the calmpath_app login and set its password outside Git.
-- Never store database passwords or connection strings in this file.

BEGIN;

GRANT CONNECT ON DATABASE neondb TO calmpath_app;
GRANT USAGE ON SCHEMA public TO calmpath_app;
REVOKE CREATE ON SCHEMA public FROM calmpath_app;

REVOKE ALL PRIVILEGES
  ON ALL TABLES IN SCHEMA public
  FROM calmpath_app;

GRANT SELECT
  ON ALL TABLES IN SCHEMA public
  TO calmpath_app;

ALTER DEFAULT PRIVILEGES
  FOR ROLE neondb_owner
  IN SCHEMA public
  GRANT SELECT ON TABLES TO calmpath_app;

COMMIT;
