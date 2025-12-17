"use client";
import { useState, useEffect } from "react";
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { CourseCard, CourseCardProps } from "./CourseCard";
import { SkillGapAnalysis } from "./SkillGapAnalysis";
import { toast } from "../ui/use-toast";

export interface CourseRecommendationsProps {
  jobDescription: string;
  resumeSkills?: string[];
  jobId?: string;
}

export function CourseRecommendations({
  jobDescription,
  resumeSkills = [],
  jobId,
}: CourseRecommendationsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleAnalyzeJob = async () => {
    if (!jobDescription) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Job description is required",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ml/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resumeSkills: resumeSkills.length > 0 ? resumeSkills : [],
          topN: 12,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data);

      toast({
        variant: "success",
        title: "Analysis Complete!",
        description: `Found ${data.recommended_courses.length} relevant courses`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedCourses = showAll
    ? analysis?.recommended_courses
    : analysis?.recommended_courses?.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            AI-Powered Learning Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized course recommendations based on skill gaps for this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysis && (
            <Button
              onClick={handleAnalyzeJob}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Analyzing..." : "Analyze Skills & Get Recommendations"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Skill Gap Analysis */}
      {analysis && analysis.skill_analysis && (
        <SkillGapAnalysis
          matchedSkills={analysis.skill_analysis.matched_skills}
          missingSkills={analysis.skill_analysis.missing_skills}
          matchPercentage={analysis.skill_analysis.match_percentage}
          totalRequired={analysis.skill_analysis.total_required}
        />
      )}

      {/* Course Recommendations */}
      {analysis && analysis.recommended_courses && analysis.recommended_courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Courses</CardTitle>
            <CardDescription>
              Top courses to help you learn the missing skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCourses.map((course: any, index: number) => (
                <CourseCard
                  key={index}
                  courseName={course.course_name}
                  provider={course.provider}
                  skillsGained={course.skills_gained}
                  rating={course.rating}
                  levelDuration={course.level_duration}
                  courseUrl={course.course_url}
                  courseImage={course.course_image}
                  providerImage={course.provider_image}
                  matchPercentage={course.match_percentage}
                />
              ))}
            </div>

            {/* Show More/Less Button */}
            {analysis.recommended_courses.length > 6 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : `Show ${analysis.recommended_courses.length - 6} More Courses`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Missing Skills Message */}
      {analysis &&
       analysis.skill_analysis &&
       analysis.skill_analysis.missing_skills.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">All Set!</h3>
            <p className="text-muted-foreground">
              You have all the required skills for this position. No additional courses needed!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
