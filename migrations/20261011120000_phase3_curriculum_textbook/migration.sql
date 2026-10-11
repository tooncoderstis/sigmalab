-- CreateEnum
CREATE TYPE "LessonPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'LENT', 'LOST', 'DAMAGED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('LENT', 'RETURNED', 'LOST');

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "termId" TEXT,
    "authorId" TEXT,
    "meetingNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "activities" TEXT,
    "resources" TEXT,
    "assessment" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "status" "LessonPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Textbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "isbn" TEXT,
    "subjectId" TEXT,
    "programId" TEXT,
    "gradeLevel" TEXT,
    "description" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "coverUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookCopy" (
    "id" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "conditionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextbookCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookDistribution" (
    "id" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "status" "DistributionStatus" NOT NULL DEFAULT 'LENT',
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdById" TEXT,

    CONSTRAINT "TextbookDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonPlan_classId_idx" ON "LessonPlan"("classId");

-- CreateIndex
CREATE INDEX "LessonPlan_authorId_idx" ON "LessonPlan"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlan_classId_meetingNo_key" ON "LessonPlan"("classId", "meetingNo");

-- CreateIndex
CREATE UNIQUE INDEX "Textbook_isbn_key" ON "Textbook"("isbn");

-- CreateIndex
CREATE INDEX "Textbook_subjectId_idx" ON "Textbook"("subjectId");

-- CreateIndex
CREATE INDEX "Textbook_programId_idx" ON "Textbook"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookCopy_code_key" ON "TextbookCopy"("code");

-- CreateIndex
CREATE INDEX "TextbookCopy_textbookId_idx" ON "TextbookCopy"("textbookId");

-- CreateIndex
CREATE INDEX "TextbookCopy_status_idx" ON "TextbookCopy"("status");

-- CreateIndex
CREATE INDEX "TextbookDistribution_copyId_idx" ON "TextbookDistribution"("copyId");

-- CreateIndex
CREATE INDEX "TextbookDistribution_studentId_idx" ON "TextbookDistribution"("studentId");

-- CreateIndex
CREATE INDEX "TextbookDistribution_status_idx" ON "TextbookDistribution"("status");

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Textbook" ADD CONSTRAINT "Textbook_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Textbook" ADD CONSTRAINT "Textbook_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Textbook" ADD CONSTRAINT "Textbook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookCopy" ADD CONSTRAINT "TextbookCopy_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookDistribution" ADD CONSTRAINT "TextbookDistribution_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "TextbookCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookDistribution" ADD CONSTRAINT "TextbookDistribution_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookDistribution" ADD CONSTRAINT "TextbookDistribution_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookDistribution" ADD CONSTRAINT "TextbookDistribution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

