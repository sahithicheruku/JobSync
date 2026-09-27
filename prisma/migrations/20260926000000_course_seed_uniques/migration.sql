CREATE UNIQUE INDEX "Course_courseUrl_key" ON "Course"("courseUrl");

CREATE UNIQUE INDEX "CourseRecommendation_userId_jobId_courseId_missingSkill_key"
ON "CourseRecommendation"("userId", "jobId", "courseId", "missingSkill");
