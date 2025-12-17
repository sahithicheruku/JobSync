# 🚀 Quick Start - Course Recommendations Feature

## ⚡ Deploy in 5 Minutes

### Step 1: Run Database Migration
```bash
docker exec jobsync_app npx prisma generate
docker exec jobsync_app npx prisma migrate dev --name add_courses
```

### Step 2: Seed Courses (585 courses)
```bash
docker exec jobsync_app node prisma/seedCourses.js
```
*Press 'n' if it asks about skipping (to ensure fresh seed)*

### Step 3: Rebuild & Start Services
```bash
docker-compose down
docker-compose up --build -d
```

### Step 4: Verify Services
```bash
# Check if ML service is healthy
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","skill_extractor":true,"course_recommender":true}
```

**Done!** 🎉 Your ML service is running!

---

## 📝 How to Use in Your App

### Option 1: Add to Job Detail Page (Recommended)

Edit `src/components/myjobs/JobDetails.tsx`:

```tsx
// 1. Import the component
import { CourseRecommendations } from "@/components/courses";

// 2. Add somewhere in your JobDetails component
<CourseRecommendations
  jobDescription={job.description}
  resumeSkills={userResumeSkills} // Get from resume
  jobId={job.id}
/>
```

### Option 2: Create New Page

Create `src/app/courses/page.tsx`:

```tsx
import { CourseRecommendations } from "@/components/courses";

export default function CoursesPage() {
  return (
    <div className="container py-8">
      <h1>Learning Recommendations</h1>
      <CourseRecommendations
        jobDescription="..." // From selected job
        resumeSkills={[...]} // From user profile
      />
    </div>
  );
}
```

---

## 🧪 Test It Out

### Test ML Service:
```bash
curl -X POST http://localhost:8000/api/recommend-courses \
  -H "Content-Type: application/json" \
  -d '{
    "missing_skills": ["kubernetes", "terraform", "aws"],
    "top_n": 5
  }'
```

### Test via Next.js API:
```bash
curl -X POST http://localhost:3000/api/ml/analyze-job \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Looking for Python developer with AWS and Kubernetes",
    "resumeSkills": ["python", "docker"],
    "topN": 5
  }'
```

---

## 🎯 What You Get

✅ **585 Coursera Courses** pre-loaded
✅ **ML-Powered Recommendations** using semantic search
✅ **Skill Gap Analysis** with visual progress bars
✅ **Beautiful UI Components** ready to use
✅ **Real-time Analysis** in ~200-500ms

---

## 🔍 View Course Data

```bash
# Open Prisma Studio
docker exec jobsync_app npx prisma studio
```

Navigate to `Course` model to see all 585 courses.

---

## 📚 Full Documentation

See `COURSE_RECOMMENDATIONS_GUIDE.md` for:
- Complete API reference
- Troubleshooting guide
- Customization options
- Architecture details

---

## ⚠️ Troubleshooting

**ML Service won't start?**
```bash
docker logs jobsync_ml -f
```

**Courses not showing?**
```bash
# Re-run seed
docker exec jobsync_app node prisma/seedCourses.js
```

**CORS errors?**
- Check `ml-service/app/main.py` allow_origins setting

---

**Need help?** Check the logs or open an issue!
