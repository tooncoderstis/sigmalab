-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('LENT', 'RETURNED', 'OVERDUE', 'LOST');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('ATK', 'SARPRAS', 'LAINNYA');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- CreateTable
CREATE TABLE "LibraryBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "isbn" TEXT,
    "category" TEXT,
    "description" TEXT,
    "coverUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCopy" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "conditionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookLoan" (
    "id" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'LENT',
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "fine" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL DEFAULT 'ATK',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "byId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibraryBook_isbn_key" ON "LibraryBook"("isbn");

-- CreateIndex
CREATE INDEX "LibraryBook_title_idx" ON "LibraryBook"("title");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCopy_code_key" ON "LibraryCopy"("code");

-- CreateIndex
CREATE INDEX "LibraryCopy_bookId_idx" ON "LibraryCopy"("bookId");

-- CreateIndex
CREATE INDEX "LibraryCopy_status_idx" ON "LibraryCopy"("status");

-- CreateIndex
CREATE INDEX "BookLoan_copyId_idx" ON "BookLoan"("copyId");

-- CreateIndex
CREATE INDEX "BookLoan_memberId_idx" ON "BookLoan"("memberId");

-- CreateIndex
CREATE INDEX "BookLoan_status_idx" ON "BookLoan"("status");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- AddForeignKey
ALTER TABLE "LibraryCopy" ADD CONSTRAINT "LibraryCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "LibraryCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

