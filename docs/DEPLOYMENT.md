# Deployment and release

Use the Compose file as the deployment source. Configure `.env` on the host; never bake secrets into an image. Set a real HTTPS `NEXTAUTH_URL`, a strong `AUTH_SECRET`, PostgreSQL credentials, and an optional AI key. `OPENAI_MODEL` is server-controlled; browser input cannot select arbitrary billable models. Bind PostgreSQL to loopback or use a private managed service. Keep ML internal.

For existing installations, complete [data migration](POSTGRESQL.md) before starting the new application. Do not use `migrate reset` on production. Back up both PostgreSQL and the upload directory before migrations. Snapshot rollback requires restoring matching application/database/files; never silently discard new writes.

`docker compose up --build -d` builds and starts the stack. App startup applies migrations and seeds reference data plus the configured initial account. Account seeding never replaces an existing password. `/api/health` verifies database connectivity; it does not expose credentials or database errors. ML `/health` is internal. Use health monitoring, HTTPS, and request-size limits at your reverse proxy (11 MB for uploads, smaller for JSON routes).

`deploy-to-gcp.sh` requires explicit PROJECT_ID, VM_NAME and ZONE and targets an already configured VM with this checkout in `~/jobsync`. It does not provision networking or overwrite secrets. Configure Docker and TLS on that VM beforehand.

CI validates types, lint, Jest, PostgreSQL migrations and relational/JSON persistence, Python syntax, the production Next build, and the web Docker image. The manual release workflow publishes versioned web/ML images to GHCR. Configure the GitHub `release` environment with required reviewers; invoking it is an explicit release action. `push-to-dockerhub.sh` remains an optional manual alternative with an explicit namespace/tag and preexisting Docker login.

No remote deployment, image publication, commit, or push is performed by local implementation work. The legacy historical project report is not an operational guide.

Authentication uses credentials and database-backed per-account request limits. AI requests share a per-user limit of 12/minute; login attempts are 10/minute per hashed email. Limits persist across app replicas. Add an upstream IP rate limit to constrain distributed email attempts. Provider timeouts and sanitized errors are returned to clients with correlation IDs. Do not log request bodies at the proxy.
