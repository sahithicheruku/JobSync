"use client";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export interface SkillGapAnalysisProps {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  totalRequired: number;
}

export function SkillGapAnalysis({
  matchedSkills,
  missingSkills,
  matchPercentage,
  totalRequired,
}: SkillGapAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Skill Match Analysis
        </CardTitle>
        <CardDescription>
          Compare your skills with job requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Match</span>
            <span className="text-2xl font-bold text-primary">
              {matchPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={matchPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            You match {matchedSkills.length} out of {totalRequired} required skills
          </p>
        </div>

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Skills You Have ({matchedSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {missingSkills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Skills to Learn ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Message */}
        {missingSkills.length > 0 && (
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-1">💡 Good news!</p>
            <p className="text-muted-foreground">
              We found courses to help you learn these missing skills. Check out
              the recommendations below.
            </p>
          </div>
        )}

        {missingSkills.length === 0 && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-sm">
            <p className="font-medium mb-1 text-green-700 dark:text-green-400">
              🎉 Perfect Match!
            </p>
            <p className="text-green-600 dark:text-green-300">
              You have all the required skills for this position. You&apos;re ready to apply!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
