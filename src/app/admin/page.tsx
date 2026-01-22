"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScraperSource {
  id: string;
  type: string;
  name: string;
  url: string;
  company: string | null;
  enabled: boolean;
}

export default function AdminPage() {
  const [sources, setSources] = useState<ScraperSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "reddit",
    name: "",
    url: "",
    company: "",
    enabled: true,
  });

  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/admin/sources?secret=${secret}`);
      if (res.status === 401) {
        setAuthenticated(false);
        setError("Invalid secret");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch sources");
      const data = await res.json();
      setSources(data);
      setAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...formData } : formData;

    try {
      const res = await fetch(`/api/admin/sources?secret=${secret}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save source");

      setFormData({ type: "reddit", name: "", url: "", company: "", enabled: true });
      setEditingId(null);
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleEdit = (source: ScraperSource) => {
    setEditingId(source.id);
    setFormData({
      type: source.type,
      name: source.name,
      url: source.url,
      company: source.company || "",
      enabled: source.enabled,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this source?")) return;

    try {
      const res = await fetch(`/api/admin/sources?secret=${secret}&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggle = async (source: ScraperSource) => {
    try {
      const res = await fetch(`/api/admin/sources?secret=${secret}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, enabled: !source.enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  // Auth screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Admin Access
          </h1>
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              fetchSources();
            }}
          >
            <input
              type="password"
              placeholder="Enter admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Admin"}
            </button>
          </form>
          <Link
            href="/"
            className="block text-center text-sm text-zinc-500 mt-4 hover:text-zinc-700"
          >
            Back to Timeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Scraper Sources Admin
            </h1>
            <p className="text-sm text-zinc-500">
              Manage Reddit and blog sources for scraping
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Back to Timeline
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {editingId ? "Edit Source" : "Add New Source"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="reddit">Reddit</option>
                  <option value="rss">RSS Feed</option>
                  <option value="blog">Blog</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., r/LocalLLaMA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                URL
              </label>
              <input
                type="url"
                placeholder="https://old.reddit.com/r/LocalLLaMA or RSS feed URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Company (for blogs)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Anthropic"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Enabled</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                {editingId ? "Update Source" : "Add Source"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ type: "reddit", name: "", url: "", company: "", enabled: true });
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Sources List */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Current Sources ({sources.length})
          </h2>

          {loading ? (
            <p className="text-zinc-500">Loading...</p>
          ) : sources.length === 0 ? (
            <p className="text-zinc-500">No sources configured. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    source.enabled
                      ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                      : "border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 opacity-60"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          source.type === "reddit"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            : source.type === "rss"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        }`}
                      >
                        {source.type}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {source.name}
                      </span>
                      {source.company && (
                        <span className="text-xs text-zinc-500">({source.company})</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{source.url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(source)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        source.enabled
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {source.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => handleEdit(source)}
                      className="px-3 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="px-3 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Help Section */}
        <section className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">URL Formats</h3>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <li><strong>Reddit:</strong> https://old.reddit.com/r/LocalLLaMA</li>
            <li><strong>RSS:</strong> https://www.anthropic.com/rss.xml</li>
            <li><strong>Blog:</strong> Any blog URL (used as source reference)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
