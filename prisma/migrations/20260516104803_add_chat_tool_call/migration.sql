-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "ChatToolCallStatus" AS ENUM ('pending', 'approved', 'edited', 'rejected', 'cancelled', 'errored');

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatToolCall" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "toolName" TEXT NOT NULL,
    "toolUseId" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "status" "ChatToolCallStatus" NOT NULL DEFAULT 'pending',
    "resolvedContent" JSONB,
    "resolutionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ChatToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_applicationId_createdAt_idx" ON "ChatMessage"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatToolCall_applicationId_status_idx" ON "ChatToolCall"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ChatToolCall_applicationId_createdAt_idx" ON "ChatToolCall"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatToolCall" ADD CONSTRAINT "ChatToolCall_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
