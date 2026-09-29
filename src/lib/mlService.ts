/**
 * ML Service Client
 * Interface to communicate with the Python ML microservice
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_DEMO_MODE = process.env.ML_DEMO_MODE === 'true';

const demoSkills = ['Python', 'SQL', 'Docker', 'REST APIs', 'Git', 'Java', 'React', 'TypeScript', 'AWS', 'Kubernetes'];

const demoCourses = (skills: string[], count: number): CourseRecommendation[] =>
  skills.slice(0, count).map((skill, index) => ({
    course_name: `[Demo] Sample ${skill} learning resource`,
    provider: 'Sample provider',
    skills_gained: skill,
    rating: null,
    level_duration: 'Demo data',
    course_url: `#demo-course-${index + 1}`,
    course_image: '',
    provider_image: '',
    similarity_score: 0.91 - index * 0.03,
    match_percentage: 91 - index * 3,
  }));

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
    if (ML_DEMO_MODE) {
      const skills = ['Python', 'SQL', 'Docker', 'REST APIs', 'Git'].filter((skill) =>
        text.toLowerCase().includes(skill.toLowerCase())
      );
      return { success: true, skills: skills.length ? skills : ['Python', 'SQL', 'Docker'], count: skills.length || 3 };
    }
    const response = await fetch(`${this.baseURL}/api/extract-skills`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) return { success: true, skills: ['Python', 'SQL', 'Docker'], count: 3 };
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/extract-skills-from-pdf`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) {
      const matched_skills = resumeSkills.filter((skill) => jobSkills.some((required) => required.toLowerCase() === skill.toLowerCase()));
      const missing_skills = jobSkills.filter((skill) => !matched_skills.some((matched) => matched.toLowerCase() === skill.toLowerCase()));
      return { success: true, comparison: { matched_skills, missing_skills, extra_skills: resumeSkills.filter((skill) => !matched_skills.includes(skill)), match_percentage: jobSkills.length ? Math.round(matched_skills.length / jobSkills.length * 100) : 100, total_required: jobSkills.length, total_matched: matched_skills.length } };
    }
    const response = await fetch(`${this.baseURL}/api/compare-skills`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) { const courses = demoCourses(missingSkills, topN); return { success: true, courses, count: courses.length }; }
    const response = await fetch(`${this.baseURL}/api/recommend-courses`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) {
      const description = jobDescription.toLowerCase();
      const required = demoSkills.filter((skill) => description.includes(skill.toLowerCase()));
      const matched_skills = required.filter((skill) => resumeSkills.some((candidate) => candidate.toLowerCase() === skill.toLowerCase()));
      const missing_skills = required.filter((skill) => !matched_skills.includes(skill));
      const recommended_courses = demoCourses(missing_skills, topN);
      const match_percentage = required.length ? Math.round(matched_skills.length / required.length * 100) : 100;
      return { success: true, skill_analysis: { matched_skills, missing_skills, extra_skills: resumeSkills.filter((skill) => !required.includes(skill)), match_percentage, total_required: required.length, total_matched: matched_skills.length }, recommended_courses, missing_skills_count: missing_skills.length, match_percentage };
    }
    const response = await fetch(`${this.baseURL}/api/analyze-job`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) { const courses = demoCourses([query, 'Python', 'SQL'], topN); return { success: true, courses, count: courses.length }; }
    const response = await fetch(`${this.baseURL}/api/search-courses`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
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
    if (ML_DEMO_MODE) { const courses = demoCourses([skill], topN); return { success: true, courses, count: courses.length }; }
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
    if (ML_DEMO_MODE) return { status: 'ok', mode: 'demo' };
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

// Export singleton instance
export const mlService = new MLServiceClient();
