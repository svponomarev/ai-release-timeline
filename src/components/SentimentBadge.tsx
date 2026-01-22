interface SentimentBadgeProps {
  sentiment: string;
  size?: "sm" | "md";
}

export default function SentimentBadge({
  sentiment,
  size = "sm",
}: SentimentBadgeProps) {
  const baseClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  switch (sentiment) {
    case "positive":
      return (
        <span
          className={`${baseClasses} rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}
        >
          Positive
        </span>
      );
    case "negative":
      return (
        <span
          className={`${baseClasses} rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`}
        >
          Negative
        </span>
      );
    default:
      return (
        <span
          className={`${baseClasses} rounded-full font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300`}
        >
          Neutral
        </span>
      );
  }
}
