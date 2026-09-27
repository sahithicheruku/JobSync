-- CreateTable
CREATE TABLE "CareerAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeTitle" TEXT NOT NULL,
    "resumeHash" TEXT NOT NULL,
    "jobId" TEXT,
    "jobTitle" TEXT,
    "jobHash" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rubric" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CareerAnalysis_userId_kind_createdAt_idx" ON "CareerAnalysis"("userId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "CareerAnalysis" ADD CONSTRAINT "CareerAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

