# JobSync ML Service

ML-powered skill extraction and course recommendation microservice for JobSync.

## Features

- **Skill Extraction**: Extract technical skills from resumes and job descriptions using NLP
- **Course Recommendations**: AI-powered course suggestions based on skill gaps
- **Job Analysis**: Complete analysis of job requirements vs resume skills
- **Semantic Search**: Find courses using natural language queries

## Technology Stack

- **FastAPI**: Modern Python web framework
- **Sentence Transformers**: Semantic embeddings (all-MiniLM-L6-v2)
- **spaCy**: Natural Language Processing
- **scikit-learn**: ML utilities and cosine similarity
- **585 Coursera Courses**: Pre-loaded with embeddings

## Installation

### Using Docker (Recommended)

The ML service is automatically started with docker-compose:

```bash
cd /path/to/jobsync
docker-compose up --build
```

The service will be available at: `http://localhost:8000`

### Local Development

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_md

# Run the service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Extract Skills from Text
```bash
POST /api/extract-skills
Content-Type: application/json

{
  "text": "5 years of experience in Python, React, and AWS..."
}
```

### Extract Skills from PDF Resume
```bash
POST /api/extract-skills-from-pdf
Content-Type: multipart/form-data

file: <resume.pdf>
```

### Compare Skills
```bash
POST /api/compare-skills
Content-Type: application/json

{
  "resume_skills": ["python", "react", "docker"],
  "job_skills": ["python", "react", "kubernetes", "aws"]
}
```

### Recommend Courses
```bash
POST /api/recommend-courses
Content-Type: application/json

{
  "missing_skills": ["kubernetes", "aws"],
  "top_n": 10
}
```

### Analyze Job (Complete Analysis)
```bash
POST /api/analyze-job
Content-Type: application/json

{
  "job_description": "We are looking for a Senior Developer with Python, Kubernetes...",
  "resume_skills": ["python", "docker", "react"],
  "top_n": 10
}
```

### Search Courses
```bash
POST /api/search-courses
Content-Type: application/json

{
  "query": "machine learning python",
  "top_n": 10
}
```

### Get Courses by Skill
```bash
GET /api/courses/by-skill/kubernetes?top_n=5
```

## Data

- **Course Data**: 585 Coursera courses with metadata
- **Embeddings**: Pre-computed semantic embeddings for fast retrieval
- **Skills Database**: 150+ technical skills in the knowledge base

## Architecture

```
JobSync (Next.js)
    ↓ HTTP API calls
ML Service (FastAPI)
    ├── Skill Extractor (spaCy + NLP)
    ├── Course Recommender (Sentence Transformers)
    └── Pre-computed Embeddings (Pickle files)
```

## Development

### Run Tests
```bash
pytest
```

### Check Logs
```bash
docker logs jobsync_ml -f
```

### Rebuild Service
```bash
docker-compose build ml-service
docker-compose up ml-service
```

## Performance

- **Skill Extraction**: ~100-500ms per document
- **Course Recommendation**: ~50-200ms (using pre-computed embeddings)
- **Model Loading**: ~2-5 seconds on startup

## Troubleshooting

### Model Download Issues
If spaCy model fails to download:
```bash
python -m spacy download en_core_web_md --direct
```

### Memory Issues
The service requires ~2GB RAM for models. Adjust Docker memory limits if needed.

### CORS Errors
Update `allow_origins` in `app/main.py` to match your frontend URL.

## Future Enhancements

- [ ] Add more course providers (Udemy, Pluralsight)
- [ ] Real-time course price tracking
- [ ] User learning path generation
- [ ] A/B testing for recommendations
- [ ] Caching layer for frequent queries
