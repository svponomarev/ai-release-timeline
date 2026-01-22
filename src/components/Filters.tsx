"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface FiltersProps {
  companies: string[];
  categories: string[];
}

export default function Filters({ companies, categories }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const currentCompany = searchParams.get("company") || "";
  const currentCategory = searchParams.get("category") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilter("search", searchValue);
    },
    [searchValue, updateFilter]
  );

  const clearFilters = useCallback(() => {
    setSearchValue("");
    startTransition(() => {
      router.push("/");
    });
  }, [router]);

  const hasActiveFilters =
    currentCompany || currentCategory || searchParams.get("search");

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder="Search releases..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Company filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Company:
          </span>
          <select
            value={currentCompany}
            onChange={(e) => updateFilter("company", e.target.value)}
            className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Type:
          </span>
          <select
            value={currentCategory}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
