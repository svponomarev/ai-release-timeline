export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-900 rounded mt-2 animate-pulse" />
            </div>
          </div>
          <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                    <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
