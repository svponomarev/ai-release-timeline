import type { Release, Review } from "@/generated/prisma/client";
import ReleaseCard from "./ReleaseCard";

interface TimelineProps {
  releases: (Release & { reviews: Review[] })[];
}

function groupByMonth(releases: (Release & { reviews: Review[] })[]) {
  const groups: Record<string, (Release & { reviews: Review[] })[]> = {};

  releases.forEach((release) => {
    const date = new Date(release.releaseDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(release);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        label: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
        releases: items.sort(
          (a, b) =>
            new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        ),
      };
    });
}

export default function Timeline({ releases }: TimelineProps) {
  const grouped = groupByMonth(releases);

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No releases found. Check back later or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ml-4 md:ml-0" />

      <div className="space-y-8">
        {grouped.map((group) => (
          <div key={group.label} className="relative">
            {/* Month marker */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-600 relative z-10 ml-2.5 md:ml-[-5px]" />
              <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                {group.label}
              </h2>
            </div>

            {/* Releases in this month */}
            <div className="space-y-3 pl-8 md:pl-6">
              {group.releases.map((release) => (
                <ReleaseCard key={release.id} release={release} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
