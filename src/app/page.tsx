import { Suspense } from "react";
import { prisma } from "@/lib/db";
import Timeline from "@/components/Timeline";
import Filters from "@/components/Filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    company?: string;
    category?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, company, category } = params;

  // Build query filters
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { summary: { contains: search } },
        { company: { contains: search } },
      ],
    }),
    ...(company && { company }),
    ...(category && { category }),
  };

  const releases = await prisma.release.findMany({
    where,
    include: {
      reviews: true,
    },
    orderBy: {
      releaseDate: "desc",
    },
  });

  // Get all unique companies and categories for filters
  const allReleases = await prisma.release.findMany({
    select: { company: true, category: true },
  });

  const companies = [...new Set(allReleases.map((r) => r.company))].sort();
  const categories = [...new Set(allReleases.map((r) => r.category))].sort();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                AI Release Timeline
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Track AI models and tools with community reviews
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {releases.length} release{releases.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Filters */}
          <Suspense fallback={<div className="h-20" />}>
            <Filters companies={companies} categories={categories} />
          </Suspense>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Timeline releases={releases} />
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>AI Release Timeline — Tracking the pace of AI progress</p>
        </div>
      </footer>
    </div>
  );
}
