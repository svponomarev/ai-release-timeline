import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Release Not Found
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          The release you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
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
    </div>
  );
}
