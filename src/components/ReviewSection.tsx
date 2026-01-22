import type { Review } from "@/generated/prisma/client";
import SentimentBadge from "./SentimentBadge";

interface ReviewSectionProps {
  reviews: Review[];
}

function getSourceIcon(source: string) {
  switch (source.toLowerCase()) {
    case "reddit":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      );
    case "x":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "blog":
      return (
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
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      );
    default:
      return (
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
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      );
  }
}

function getSentimentDistribution(reviews: Review[]) {
  const total = reviews.length;
  if (total === 0) return { positive: 0, neutral: 0, negative: 0 };

  const counts = reviews.reduce(
    (acc, review) => {
      acc[review.sentiment as keyof typeof acc]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  return {
    positive: Math.round((counts.positive / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
    negative: Math.round((counts.negative / total) * 100),
  };
}

export default function ReviewSection({ reviews }: ReviewSectionProps) {
  const distribution = getSentimentDistribution(reviews);

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      {reviews.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Community Sentiment
          </h3>

          {/* Sentiment bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-2">
            {distribution.positive > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${distribution.positive}%` }}
              />
            )}
            {distribution.neutral > 0 && (
              <div
                className="bg-zinc-400"
                style={{ width: `${distribution.neutral}%` }}
              />
            )}
            {distribution.negative > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${distribution.negative}%` }}
              />
            )}
          </div>

          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-green-600 dark:text-green-400">
              {distribution.positive}% positive
            </span>
            <span>{distribution.neutral}% neutral</span>
            <span className="text-red-600 dark:text-red-400">
              {distribution.negative}% negative
            </span>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            No reviews yet for this release.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {getSourceIcon(review.source)}
                  </span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {review.author || "Anonymous"}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    via {review.source}
                  </span>
                </div>
                <SentimentBadge sentiment={review.sentiment} />
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                {review.content}
              </p>

              <a
                href={review.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                View original
                <svg
                  className="w-3 h-3"
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
            </article>
          ))
        )}
      </div>
    </div>
  );
}
