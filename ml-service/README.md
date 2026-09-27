# JobSync ML service

Python 3.11 / FastAPI. Provides existing skill extraction, comparison and course recommendation endpoints, plus `/api/resume-text` and `/api/semantic-similarity`.

```sh
cd ml-service
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Models download on first startup. Set `ML_SERVICE_URL=http://localhost:8000` for local Next.js development. Docker Compose handles the service address automatically and does not publish its port. The service has no independent authentication: keep it private and use the authenticated Next.js routes.

The course CSV/pickle is a static dataset, not a live catalog. Semantic similarity is not a measured accuracy or hiring probability. See [scoring](../docs/SCORING.md).

`/health` reports model readiness. PDF extraction accepts text PDFs up to 10 MB / 50 pages; scanned-image PDFs require OCR before upload. Semantic embeddings process token-sized chunks to avoid silent tail truncation.
