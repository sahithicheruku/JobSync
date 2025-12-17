/**
 * ML Service Client
 * Interface to communicate with the Python ML microservice
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface SkillExtractionResponse {
  success: boolean;
  skills: string[];
  count: number;
}

export interface SkillComparisonResponse {
  success: boolean;
  comparison: {
    matched_skills: string[];
    missing_skills: string[];
    extra_skills: string[];
    match_percentage: number;
    total_required: number;
    total_matched: number;
  };
}

export interface CourseRecommendation {
  course_name: string;
  provider: string;
  skills_gained: string;
  rating: number | null;
  level_duration: string;
  course_url: string;
  course_image: string;
  provider_image: string;
  similarity_score: number;
  match_percentage: number;
}

export interface CourseRecommendationResponse {
  success: boolean;
  courses: CourseRecommendation[];
  count: number;
}

export interface JobAnalysisResponse {
  success: boolean;
  skill_analysis: {
    matched_skills: string[];
    missing_skills: string[];
    extra_skills: string[];
    match_percentage: number;
    total_required: number;
    total_matched: number;
  };
  recommended_courses: CourseRecommendation[];
  missing_skills_count: number;
  match_percentage: number;
}

class MLServiceClient {
  private baseURL: string;

  constructor() {
    this.baseURL = ML_SERVICE_URL;
  }

  /**
   * Extract skills from text (resume or job description)
   */
  async extractSkills(text: string): Promise<SkillExtractionResponse> {
    const response = await fetch(`${this.baseURL}/api/extract-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Extract skills from PDF file
   */
  async extractSkillsFromPDF(file: File | Blob): Promise<SkillExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/extract-skills-from-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Compare resume skills with job requirements
   */
  async compareSkills(
    resumeSkills: string[],
    jobSkills: string[]
  ): Promise<SkillComparisonResponse> {
    const response = await fetch(`${this.baseURL}/api/compare-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_skills: resumeSkills,
        job_skills: jobSkills,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get course recommendations based on missing skills
   */
  async recommendCourses(
    missingSkills: string[],
    topN: number = 10
  ): Promise<CourseRecommendationResponse> {
    const response = await fetch(`${this.baseURL}/api/recommend-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missing_skills: missingSkills,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Analyze a job posting against resume skills
   * Returns skill comparison + course recommendations
   */
  async analyzeJob(
    jobDescription: string,
    resumeSkills: string[],
    topN: number = 10
  ): Promise<JobAnalysisResponse> {
    const response = await fetch(`${this.baseURL}/api/analyze-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_description: jobDescription,
        resume_skills: resumeSkills,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for courses by query
   */
  async searchCourses(
    query: string,
    topN: number = 10
  ): Promise<CourseRecommendationResponse> {
    const response = await fetch(`${this.baseURL}/api/search-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get courses that teach a specific skill
   */
  async getCoursesBySkill(
    skill: string,
    topN: number = 5
  ): Promise<CourseRecommendationResponse> {
    const response = await fetch(
      `${this.baseURL}/api/courses/by-skill/${encodeURIComponent(skill)}?top_n=${topN}`
    );

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

// Export singleton instance
export const mlService = new MLServiceClient();
