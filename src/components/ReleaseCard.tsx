import Link from "next/link";
import type { Release, Review } from "@/generated/prisma/client";

interface ReleaseCardProps {
  release: Release & { reviews: Review[] };
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
      return "border-l-emerald-500";
    case "anthropic":
      return "border-l-orange-500";
    case "google":
      return "border-l-blue-500";
    case "meta":
      return "border-l-indigo-500";
    case "anysphere":
      return "border-l-cyan-500";
    default:
      return "border-l-gray-500";
  }
}

function getSentimentCounts(reviews: Review[]) {
  return reviews.reduce(
    (acc, review) => {
      acc[review.sentiment as keyof typeof acc]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReleaseCard({ release }: ReleaseCardProps) {
  const sentiments = getSentimentCounts(release.reviews);

  return (
    <Link href={`/release/${release.id}`}>
      <article
        className={`group relative border-l-4 ${getCompanyColor(release.company)} bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(release.category)}`}
              >
                {release.category}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(release.releaseDate)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {release.name}
            </h3>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              {release.company}
            </p>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
              {release.summary}
            </p>
          </div>

          {release.reviews.length > 0 && (
            <div className="flex flex-col items-end gap-1 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                {release.reviews.length} review{release.reviews.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-1">
                {sentiments.positive > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    +{sentiments.positive}
                  </span>
                )}
                {sentiments.neutral > 0 && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    ~{sentiments.neutral}
                  </span>
                )}
                {sentiments.negative > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    -{sentiments.negative}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </article>
    </Link>
  );
}
