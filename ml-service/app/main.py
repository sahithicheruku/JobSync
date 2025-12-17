from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
from PyPDF2 import PdfReader

from .skill_extractor import SkillExtractor
from .course_recommender import CourseRecommender

# Initialize FastAPI app
app = FastAPI(
    title="JobSync ML Service",
    description="ML-powered skill extraction and course recommendation service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # JobSync frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
skill_extractor = None
course_recommender = None


@app.on_event("startup")
async def startup_event():
    """Initialize ML models on startup"""
    global skill_extractor, course_recommender
    print("Initializing ML services...")
    skill_extractor = SkillExtractor()
    course_recommender = CourseRecommender()
    print("ML services initialized successfully!")


# Request/Response Models
class TextRequest(BaseModel):
    text: str


class SkillsRequest(BaseModel):
    resume_skills: List[str]
    job_skills: List[str]


class CourseRecommendationRequest(BaseModel):
    missing_skills: List[str]
    top_n: int = 10


class JobAnalysisRequest(BaseModel):
    job_description: str
    resume_skills: List[str]
    top_n: int = 10


class SearchCoursesRequest(BaseModel):
    query: str
    top_n: int = 10


# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "JobSync ML Service",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "skill_extractor": skill_extractor is not None,
        "course_recommender": course_recommender is not None
    }


# Skill extraction endpoints
@app.post("/api/extract-skills")
async def extract_skills(request: TextRequest):
    """Extract skills from text (resume or job description)"""
    try:
        skills = skill_extractor.extract_from_text(request.text)
        return {
            "success": True,
            "skills": skills,
            "count": len(skills)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extract-skills-from-pdf")
async def extract_skills_from_pdf(file: UploadFile = File(...)):
    """Extract skills from uploaded PDF resume"""
    try:
        # Read PDF file
        pdf_bytes = await file.read()
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))

        # Extract text from all pages
        resume_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Extract skills
        skills = skill_extractor.extract_from_resume(resume_text)

        return {
            "success": True,
            "skills": skills,
            "count": len(skills),
            "text_length": len(resume_text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compare-skills")
async def compare_skills(request: SkillsRequest):
    """Compare resume skills with job requirements"""
    try:
        comparison = skill_extractor.compare_skills(
            request.resume_skills,
            request.job_skills
        )
        return {
            "success": True,
            "comparison": comparison
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Course recommendation endpoints
@app.post("/api/recommend-courses")
async def recommend_courses(request: CourseRecommendationRequest):
    """Recommend courses based on missing skills"""
    try:
        recommendations = course_recommender.recommend_courses(
            request.missing_skills,
            top_n=request.top_n
        )
        return {
            "success": True,
            "courses": recommendations,
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-job")
async def analyze_job(request: JobAnalysisRequest):
    """
    Analyze a job posting against resume skills and recommend courses
    This is the main endpoint combining skill analysis + course recommendations
    """
    try:
        analysis = course_recommender.recommend_for_job(
            job_description=request.job_description,
            resume_skills=request.resume_skills,
            top_n=request.top_n
        )
        return {
            "success": True,
            **analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-courses")
async def search_courses(request: SearchCoursesRequest):
    """Search for courses by keyword or skill"""
    try:
        results = course_recommender.search_courses(
            query=request.query,
            top_n=request.top_n
        )
        return {
            "success": True,
            "courses": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses/by-skill/{skill}")
async def get_courses_by_skill(skill: str, top_n: int = 5):
    """Get courses that teach a specific skill"""
    try:
        courses = course_recommender.get_course_by_skill(skill, top_n=top_n)
        return {
            "success": True,
            "skill": skill,
            "courses": courses,
            "count": len(courses)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
