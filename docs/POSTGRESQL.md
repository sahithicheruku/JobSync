# PostgreSQL migration

The active schema and migrations target PostgreSQL. The original SQLite schema and migrations are preserved as `prisma/schema.sqlite.prisma` and `prisma/migrations-sqlite/` for rollback/reference; do not run them against PostgreSQL.

## Existing installation

1. Stop application writes. Back up the SQLite database and uploaded files (`data/files` or `/data/files`). Keep the old application image for rollback.
2. Export the database read-only: `python3 scripts/export-sqlite.py /absolute/path/dev.db > /private/path/jobsync-export.json`. Protect this export: it contains private records and password hashes.
3. Configure a **new, empty** PostgreSQL database with `DATABASE_URL`. Run `npm run db:generate` and `npm run db:migrate`.
4. Before seeding or starting the app, run `npm run db:import -- /private/path/jobsync-export.json`. Import preserves IDs, relations, dates, and password hashes, verifies row counts, and rolls back the entire import on error. It refuses a nonempty destination.
5. Copy uploaded files into the same data mount and preserve paths. Test login, jobs, activities, resumes, and downloads before switching traffic.
6. Keep the source backup until verification is complete. To roll back, stop writes to the new app and restore the previous app/database/files together. New PostgreSQL writes are not automatically copied back.

For a fresh installation, migrate then run `npm run seed`. No public account or password is supplied. URL-encode special characters in database passwords; Compose interpolation must use the same encoded value in the connection URL.

## Repeatable migration verification

Run `TEST_DATABASE_URL=<disposable-postgres-url> npm run test:migration`. This creates a temporary schema and a synthetic SQLite database, validates import fidelity, checks rollback after an invalid foreign key, and checks rejection of a nonempty destination. Temporary fixtures/schema are removed afterward. Never point this test at a production database.
