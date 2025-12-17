"use client";
import { ExternalLink, Star, Clock, Award } from "lucide-react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export interface CourseCardProps {
  courseName: string;
  provider: string;
  skillsGained: string;
  rating: number | null;
  levelDuration: string;
  courseUrl: string;
  courseImage?: string;
  providerImage?: string;
  matchPercentage?: number;
}

export function CourseCard({
  courseName,
  provider,
  skillsGained,
  rating,
  levelDuration,
  courseUrl,
  courseImage,
  providerImage,
  matchPercentage,
}: CourseCardProps) {
  // Parse skills from comma-separated string
  const skills = skillsGained
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3); // Show first 3 skills

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Course Image */}
      {courseImage && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={courseImage}
            alt={courseName}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = "none";
            }}
          />
          {matchPercentage && matchPercentage > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-green-600 text-white">
                {matchPercentage}% Match
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Provider */}
        <div className="flex items-center gap-2">
          {providerImage && (
            <img
              src={providerImage}
              alt={provider}
              className="h-6 w-6 rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {provider}
          </span>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-base line-clamp-2 min-h-[3rem]">
          {courseName}
        </h3>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {skills.map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skillsGained.split(",").length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skillsGained.split(",").length - 3} more
            </Badge>
          )}
        </div>

        {/* Rating and Duration */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
          {levelDuration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{levelDuration}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" size="sm">
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <Award className="h-4 w-4" />
            Enroll Now
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
