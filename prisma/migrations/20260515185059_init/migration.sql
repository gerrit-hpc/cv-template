-- CreateEnum
CREATE TYPE "EducationKind" AS ENUM ('degree', 'certification', 'course');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- CreateEnum
CREATE TYPE "Proficiency" AS ENUM ('familiar', 'proficient', 'expert');

-- CreateEnum
CREATE TYPE "JdLanguage" AS ENUM ('en', 'de');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('drafting', 'applied', 'interviewing', 'offer', 'closed');

-- CreateEnum
CREATE TYPE "JdSourceType" AS ENUM ('url', 'path', 'pasted');

-- CreateEnum
CREATE TYPE "ArtifactKind" AS ENUM ('cv', 'cover_letter');

-- CreateEnum
CREATE TYPE "ImportResult" AS ENUM ('success', 'partial', 'failed', 'in_progress');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "professionalSummary" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyQualification" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "KeyQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "EducationKind" NOT NULL,
    "institution" TEXT,
    "name" TEXT NOT NULL,
    "field" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "EducationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "location" TEXT,
    "employmentType" "EmploymentType" NOT NULL,
    "companyUrl" TEXT,
    "overview" TEXT NOT NULL,
    "scopeTeamSize" TEXT,
    "scopeReportingTo" TEXT,
    "scopeTechStack" TEXT,
    "scopeBudget" TEXT,
    "isHighlightsOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExperienceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleTag" (
    "roleId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "RoleTag_pkey" PRIMARY KEY ("roleId","tagId")
);

-- CreateTable
CREATE TABLE "AchievementTag" (
    "achievementId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "AchievementTag_pkey" PRIMARY KEY ("achievementId","tagId")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "proficiency" "Proficiency" NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillApplication" (
    "skillId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "SkillApplication_pkey" PRIMARY KEY ("skillId","roleId")
);

-- CreateTable
CREATE TABLE "SoftSkill" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "whereDemonstrated" TEXT NOT NULL,
    "whatHappened" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SoftSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkillTag" (
    "softSkillId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "SoftSkillTag_pkey" PRIMARY KEY ("softSkillId","tagId")
);

-- CreateTable
CREATE TABLE "ValuePrinciple" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ValuePrinciple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueCareerNarrative" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ValueCareerNarrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueIndustryOpinion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "counterargument" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ValueIndustryOpinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueLinkedInTheme" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ValueLinkedInTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "language" "JdLanguage" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'drafting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "sourceType" "JdSourceType" NOT NULL,
    "sourceValue" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TailoringStrategy" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "TailoringStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyNotes" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "researchedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "CompanyNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPrepBrief" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "InterviewPrepBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "kind" "ArtifactKind" NOT NULL,
    "typstSource" TEXT NOT NULL,
    "pdfPath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "sourcePath" TEXT NOT NULL,
    "result" "ImportResult" NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceRole_userId_slug_key" ON "ExperienceRole"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_userId_name_key" ON "SkillCategory"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_categoryId_name_key" ON "Skill"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ValueCareerNarrative_userId_key" ON "ValueCareerNarrative"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_slug_key" ON "Application"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_applicationId_key" ON "JobDescription"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "TailoringStrategy_applicationId_key" ON "TailoringStrategy"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyNotes_applicationId_key" ON "CompanyNotes"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPrepBrief_applicationId_stageName_key" ON "InterviewPrepBrief"("applicationId", "stageName");

-- CreateIndex
CREATE UNIQUE INDEX "Artifact_applicationId_kind_version_key" ON "Artifact"("applicationId", "kind", "version");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyQualification" ADD CONSTRAINT "KeyQualification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceRole" ADD CONSTRAINT "ExperienceRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ExperienceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ExperienceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleTag" ADD CONSTRAINT "RoleTag_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ExperienceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleTag" ADD CONSTRAINT "RoleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementTag" ADD CONSTRAINT "AchievementTag_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementTag" ADD CONSTRAINT "AchievementTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCategory" ADD CONSTRAINT "SkillCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillApplication" ADD CONSTRAINT "SkillApplication_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillApplication" ADD CONSTRAINT "SkillApplication_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ExperienceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkill" ADD CONSTRAINT "SoftSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillTag" ADD CONSTRAINT "SoftSkillTag_softSkillId_fkey" FOREIGN KEY ("softSkillId") REFERENCES "SoftSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillTag" ADD CONSTRAINT "SoftSkillTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuePrinciple" ADD CONSTRAINT "ValuePrinciple_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueCareerNarrative" ADD CONSTRAINT "ValueCareerNarrative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueIndustryOpinion" ADD CONSTRAINT "ValueIndustryOpinion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueLinkedInTheme" ADD CONSTRAINT "ValueLinkedInTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringStrategy" ADD CONSTRAINT "TailoringStrategy_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNotes" ADD CONSTRAINT "CompanyNotes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPrepBrief" ADD CONSTRAINT "InterviewPrepBrief_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
