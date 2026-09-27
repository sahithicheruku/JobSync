# Implementation phases

1. PostgreSQL schema and migration baseline; original SQLite migrations preserved; read-only export and atomic import with row-count verification.
2. Responses API structured output, configurable server model, preserved Ollama preference, validated output and timeouts.
3. Evidence-checked requirement extraction with deterministic weighted scoring and real embedding similarity.
4. ATS text heuristic, keyword evidence, weak bullets, job-specific review, immutable comparison snapshots.
5. Insights computed from recorded applications and latest saved matches; empty states and sample counts.
6. Focused assistant with account-owned resume/job context and measured insights, no tools or external actions.
7. Auth throttling, record ownership, safe uploads/downloads, sanitized errors, regression tests, Docker/PostgreSQL readiness, CI and manual release workflow.
8. Current setup/migration/scoring/deployment docs replace old IPs, public credentials, and unsupported benchmark claims.

Validation results and remaining environment limitations are recorded by the implementation session. Source changes do not themselves migrate a user's existing database or establish AI quality. Run the database importer on a backed-up source only after verifying the test deployment.

Official implementation references: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [configured default model](https://developers.openai.com/api/docs/models/gpt-5-mini).
