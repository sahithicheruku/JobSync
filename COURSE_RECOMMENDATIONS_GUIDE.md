# 🎓 Course Recommendations Feature - Complete Guide

## Overview

The Course Recommendations feature provides ML-powered, personalized learning suggestions based on skill gaps between a user's resume and job requirements. This feature uses semantic embeddings and NLP to analyze skills and recommend the most relevant Coursera courses.

---

## 🚀 What's Been Built

### 1. **Python ML Service** (FastAPI Microservice)
- Location: `/ml-service`
- Provides REST API for skill extraction and course recommendations
- Uses sentence-transformers for semantic embeddings
- Pre-loaded with 585 Coursera courses

### 2. **Database Schema**
- Added `Course` model to store course data
- Added `CourseRecommendation` model to track user interactions
- Location: `prisma/schema.prisma`

### 3. **Next.js API Integration**
- ML Service client: `src/lib/mlService.ts`
- API routes in `src/app/api/ml/`:
  - `/api/ml/analyze-job` - Complete skill analysis + courses
  - `/api/ml/extract-skills` - Extract skills from text
  - `/api/ml/recommend-courses` - Get course recommendations
  - `/api/ml/search-courses` - Search courses

### 4. **Frontend Components**
- `CourseCard` - Display individual courses
- `SkillGapAnalysis` - Visual skill comparison
- `CourseRecommendations` - Complete recommendation UI
- Location: `src/components/courses/`

---

## 📦 Deployment Steps

### Step 1: Update Environment Variables

Add to your `.env` file:
```bash
ML_SERVICE_URL=http://ml-service:8000
```

This is already added to `docker-compose.yml`.

### Step 2: Run Database Migration

```bash
# Generate Prisma client with new models
docker exec jobsync_app npx prisma generate

# Create and apply migration
docker exec jobsync_app npx prisma migrate dev --name add_courses
```

### Step 3: Seed Course Data

```bash
# Copy the seed script to container (already done)
docker cp prisma/seedCourses.js jobsync_app:/app/prisma/

# Run the seed script
docker exec jobsync_app node prisma/seedCourses.js
```

This will add ~585 courses to your database.

### Step 4: Build and Start Services

```bash
# Stop existing services
docker-compose down

# Build and start all services (including ML service)
docker-compose up --build -d
```

This will start:
- `jobsync_app` on port 3000
- `jobsync_ml` on port 8000

### Step 5: Verify ML Service

```bash
# Check if ML service is running
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","skill_extractor":true,"course_recommender":true}
```

---

## 💻 Usage Instructions

### For Developers: Integrating into Job Detail Page

1. **Import the component:**
```tsx
import { CourseRecommendations } from "@/components/courses";
```

2. **Add to your job detail page:**
```tsx
// Example: In src/components/myjobs/JobDetails.tsx

<CourseRecommendations
  jobDescription={job.description}
  resumeSkills={userResumeSkills} // Array of skills from user's resume
  jobId={job.id}
/>
```

3. **Extract resume skills** (if not already doing so):
```tsx
// Option A: Extract when user uploads resume
const response = await fetch("/api/ml/extract-skills-from-pdf", {
  method: "POST",
  body: formData, // FormData with PDF file
});
const { skills } = await response.json();

// Option B: Extract from resume text
const response = await fetch("/api/ml/extract-skills", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: resumeText }),
});
const { skills } = await response.json();
```

### For Users: How to Use the Feature

1. **Add a Resume** to your profile
2. **Navigate to a Job** you're interested in
3. **Click "Analyze Skills & Get Recommendations"**
4. **View Results:**
   - Skill match percentage
   - Skills you have (green badges)
   - Skills you need to learn (red badges)
   - Personalized course recommendations
5. **Click "Enroll Now"** on any course to visit Coursera

---

## 🎯 Features in Detail

### 1. Skill Extraction
- Extracts 150+ technical skills from text
- Uses NLP (spaCy) with PhraseMatcher
- Fuzzy matching for skill variations
- Skills covered: Python, AWS, React, Docker, Kubernetes, ML, etc.

### 2. Skill Gap Analysis
- Compares resume skills vs job requirements
- Calculates match percentage
- Identifies matched and missing skills
- Visual progress bar and color-coded badges

### 3. Course Recommendations
- Uses semantic similarity (cosine similarity)
- Ranks courses by relevance to missing skills
- Shows top 12 courses (expandable)
- Displays:
  - Course name, provider, rating
  - Skills gained
  - Duration and level
  - Direct enrollment link

### 4. Pre-loaded Course Data
- **585 Coursera courses**
- Top providers: IBM, Google, Microsoft, DeepLearning.AI
- Categories: AI, ML, Cloud, DevOps, Data Science, Full Stack
- Pre-computed embeddings for fast recommendations

---

## 🔧 API Reference

### Analyze Job (Complete Flow)
```typescript
POST /api/ml/analyze-job
Content-Type: application/json

{
  "jobDescription": "We need a Python developer with AWS and Docker...",
  "resumeSkills": ["python", "javascript", "react"],
  "topN": 10
}

Response:
{
  "success": true,
  "skill_analysis": {
    "matched_skills": ["python"],
    "missing_skills": ["aws", "docker"],
    "match_percentage": 33.33,
    "total_required": 3,
    "total_matched": 1
  },
  "recommended_courses": [
    {
      "course_name": "AWS Fundamentals",
      "provider": "Amazon Web Services",
      "skills_gained": "AWS, Cloud Computing, EC2",
      "rating": 4.7,
      "level_duration": "Beginner · 4 weeks",
      "course_url": "https://coursera.org/...",
      "match_percentage": 92.5
    }
  ],
  "missing_skills_count": 2
}
```

### Extract Skills
```typescript
POST /api/ml/extract-skills
Content-Type: application/json

{
  "text": "5 years of Python, React, and AWS experience..."
}

Response:
{
  "success": true,
  "skills": ["python", "react", "aws"],
  "count": 3
}
```

### Search Courses
```typescript
POST /api/ml/search-courses
Content-Type: application/json

{
  "query": "machine learning python",
  "topN": 5
}

Response:
{
  "success": true,
  "courses": [...],
  "count": 5
}
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Browser                          │
│  (Job Detail Page with CourseRecommendations component) │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Route                          │
│          /api/ml/analyze-job                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP (via mlService client)
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Python ML Service (FastAPI)                     │
│  - SkillExtractor (spaCy + NLP)                        │
│  - CourseRecommender (Sentence Transformers)           │
│  - Pre-computed Embeddings                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Semantic Search
                     ▼
┌─────────────────────────────────────────────────────────┐
│     Course Embeddings (585 courses)                     │
│  Coursera_after_embeddings.pkl                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### ML Service Not Starting

**Check logs:**
```bash
docker logs jobsync_ml -f
```

**Common issues:**
1. **spaCy model not downloaded:**
   ```bash
   docker exec jobsync_ml python -m spacy download en_core_web_md
   ```

2. **Out of memory:**
   - Increase Docker memory limit to 4GB
   - Update `docker-compose.yml`:
     ```yaml
     ml-service:
       deploy:
         resources:
           limits:
             memory: 4G
     ```

3. **Data files missing:**
   - Ensure `ml-service/data/` contains:
     - `Coursera_after_embeddings.pkl`
     - `Coursera_Completed_Data.csv`

### CORS Errors

Update `ml-service/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-domain.com"],
    ...
)
```

### Courses Not Showing

1. **Check if courses are seeded:**
   ```bash
   docker exec jobsync_app npx prisma studio
   ```
   Navigate to `Course` model and verify data exists.

2. **Re-run seed script:**
   ```bash
   docker exec jobsync_app node prisma/seedCourses.js
   ```

### API Timeout

If skill extraction takes too long:
- First request loads the model (~5 seconds)
- Subsequent requests are faster (~100-500ms)
- Consider adding a loading state in your UI

---

## 🎨 Customization

### Change Number of Recommended Courses

In your component:
```tsx
<CourseRecommendations
  jobDescription={job.description}
  resumeSkills={skills}
  topN={15} // Default is 12
/>
```

### Add More Course Providers

1. Obtain course data CSV (Udemy, Pluralsight, etc.)
2. Add to `ml-service/data/`
3. Update `course_recommender.py` to load multiple sources
4. Re-seed database

### Customize Skill Database

Edit `ml-service/app/skill_extractor.py`:
```python
KNOWN_SKILLS = [
    # Add your custom skills here
    "your-custom-skill",
    ...
]
```

Rebuild ML service:
```bash
docker-compose build ml-service
docker-compose up ml-service -d
```

---

## 📈 Future Enhancements

- [ ] Track which courses users enroll in
- [ ] Add Udemy, Pluralsight, LinkedIn Learning
- [ ] Real-time course price comparison
- [ ] Learning path generation (multi-course recommendations)
- [ ] Course completion tracking
- [ ] Email course recommendations
- [ ] A/B testing for recommendation algorithms
- [ ] Caching layer (Redis) for frequently requested analyses

---

## 📝 Testing

### Test ML Service Directly

```bash
# Health check
curl http://localhost:8000/health

# Extract skills
curl -X POST http://localhost:8000/api/extract-skills \
  -H "Content-Type: application/json" \
  -d '{"text":"Python developer with AWS and Docker experience"}'

# Recommend courses
curl -X POST http://localhost:8000/api/recommend-courses \
  -H "Content-Type: application/json" \
  -d '{"missing_skills":["kubernetes","terraform"],"top_n":5}'
```

### Test via Next.js API

```bash
# Analyze job
curl -X POST http://localhost:3000/api/ml/analyze-job \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Need a developer with Python, AWS, Kubernetes",
    "resumeSkills": ["python", "docker"],
    "topN": 5
  }'
```

---

## 📚 Tech Stack

| Component | Technology |
|-----------|------------|
| ML Service | Python 3.11, FastAPI |
| NLP | spaCy (en_core_web_md) |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| ML Utils | scikit-learn, numpy, pandas |
| Frontend | React, TypeScript, Next.js 15 |
| UI Components | shadcn/ui, Tailwind CSS |
| Database | SQLite (Prisma ORM) |
| Deployment | Docker, docker-compose |

---

## 🤝 Contributing

To add features:

1. **Add API endpoint** in `ml-service/app/main.py`
2. **Add Next.js route** in `src/app/api/ml/`
3. **Update ML service client** in `src/lib/mlService.ts`
4. **Update UI components** in `src/components/courses/`
5. **Test** thoroughly
6. **Update this documentation**

---

## ✅ Summary

You now have a complete ML-powered course recommendation system integrated into JobSync!

**What users can do:**
- Upload resume → Extract skills automatically
- View any job → Click "Analyze Skills"
- See exactly which skills they're missing
- Get personalized course recommendations
- Enroll in courses directly

**What you built:**
- ✅ Python FastAPI ML microservice
- ✅ Skill extraction (NLP-powered)
- ✅ Course recommendation engine
- ✅ Next.js API integration
- ✅ Beautiful React UI components
- ✅ 585 pre-loaded Coursera courses
- ✅ Complete deployment pipeline

**Next steps:**
1. Run migrations
2. Seed courses
3. Build & deploy
4. Integrate into job pages
5. Test with real users!

Happy coding! 🚀
