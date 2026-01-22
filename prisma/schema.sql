-- CreateTable: Release
CREATE TABLE IF NOT EXISTS "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "releaseDate" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "pricing" TEXT,
    "docsUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Review
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: ScraperSource
CREATE TABLE IF NOT EXISTS "ScraperSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "company" TEXT,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
