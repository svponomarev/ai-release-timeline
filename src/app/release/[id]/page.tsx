import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ReviewSection from "@/components/ReviewSection";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getCategoryColor(category: string) {
  switch (category) {
    case "model":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "tool":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getCompanyColor(company: string) {
  switch (company.toLowerCase()) {
    case "openai":
      return "bg-emerald-500";
    case "anthropic":
      return "bg-orange-500";
    case "google":
      return "bg-blue-500";
    case "meta":
      return "bg-indigo-500";
    case "anysphere":
      return "bg-cyan-500";
    default:
      return "bg-gray-500";
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReleasePage({ params }: PageProps) {
  const { id } = await params;

  const release = await prisma.release.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!release) {
    notFound();
  }

  const features = JSON.parse(release.features) as string[];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Timeline
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero section */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-lg ${getCompanyColor(release.company)} flex items-center justify-center text-white font-bold text-xl`}
            >
              {release.company[0]}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(release.category)}`}
                >
                  {release.category}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(release.releaseDate)}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {release.name}
              </h1>

              <p className="text-zinc-600 dark:text-zinc-400 mb-1">
                {release.company}
              </p>

              <p className="text-zinc-500 dark:text-zinc-400">
                {release.summary}
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <a
              href={release.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Documentation
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>

            <a
              href={release.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Announcement
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Features */}
          <section className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Key Features
            </h2>

            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing */}
          <section className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Pricing
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400">
              {release.pricing || "Pricing not available"}
            </p>
          </section>
        </div>

        {/* Reviews */}
        <section className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Community Reviews ({release.reviews.length})
          </h2>

          <ReviewSection reviews={release.reviews} />
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>AI Release Timeline — Tracking the pace of AI progress</p>
        </div>
      </footer>
    </div>
  );
}
