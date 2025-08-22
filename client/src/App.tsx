import { useEffect, useMemo, useState } from "react";
import type { SummaryStyle, SummaryRow } from "./types";
import { listSummaries, summarize } from "./api";

function badgeClasses(style: SummaryStyle) {
    switch (style) {
        case "concise":
            return "border border-sky-500/30 bg-sky-500/20 text-sky-300";
        case "detailed":
            return "border border-violet-500/30 bg-violet-500/20 text-violet-300";
        case "bullets":
            return "border border-amber-500/30 bg-amber-500/20 text-amber-300";
    }
}

export default function App() {
    const [text, setText] = useState("");
    const [style, setStyle] = useState<SummaryStyle>("concise");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<SummaryRow[]>([]);
    const [q, setQ] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);

    const filtered = useMemo(() => {
        if (!q.trim()) return items;
        const s = q.toLowerCase();
        return items.filter(
            (r) => r.text.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s)
        );
    }, [q, items]);

    useEffect(() => {
        listSummaries()
            .then((rows) => setItems(rows))
            .catch(console.error)
            .finally(() => setInitialLoading(false));
    }, []);

    async function onSummarize() {
        setError(null);
        setLoading(true);
        try {
            const row = await summarize(text, style);
            setItems((prev) => [row, ...prev]);
            setText("");
        } catch (e: any) {
            setError(e?.message || "Failed to summarize");
        } finally {
            setLoading(false);
        }
    }

    const disabled = loading || text.trim().length < 30 || text.length > 6000;

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                        AI Text Summarizer
                    </h1>
                    <span className="text-sm text-slate-400">React • Express • SQLite</span>
                </header>

                {/* Form Card */}
                <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 space-y-4 shadow-lg shadow-black/20">
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-slate-200" htmlFor="text-input">
                            Paste your text
                        </label>
                        <textarea
                            id="text-input"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[200px] rounded-xl border border-white/10 bg-black/30 text-slate-100 placeholder:text-slate-400 p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/60 w-full"
                            placeholder="Paste 30—6000 characters..."
                        />
                        <div className="flex justify-end text-xs text-slate-400">
                            {text.length}/6000
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-200" htmlFor="style-select">
                                Style
                            </label>
                            <select
                                id="style-select"
                                value={style}
                                onChange={(e) => setStyle(e.target.value as SummaryStyle)}
                                className="border border-white/10 bg-black/30 text-slate-100 rounded-lg p-2"
                            >
                                <option value="concise">Concise (3–5 sentences)</option>
                                <option value="detailed">Detailed (6–10 sentences)</option>
                                <option value="bullets">Bullet points</option>
                            </select>
                        </div>

                        <button
                            onClick={onSummarize}
                            disabled={disabled}
                            className="sm:ml-auto px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 text-white enabled:hover:from-sky-500 enabled:hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30"
                        >
                            {loading ? "Summarizing…" : "Summarize"}
                        </button>
                    </div>

                    {error && <p className="text-rose-400 text-sm">{error}</p>}
                </section>

                {/* Past summaries */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold">Past summaries</h2>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search…"
                            className="ml-auto border border-white/10 bg-black/30 text-slate-100 placeholder:text-slate-400 rounded-lg p-2 w-64"
                        />
                    </div>

                    {initialLoading ? (
                        <p className="text-sm text-slate-400">Loading…</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-sm text-slate-500">No summaries yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {filtered.map((row) => (
                                <li
                                    key={row.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-lg shadow-black/20"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs uppercase tracking-wide text-slate-400">
                                            {new Date(row.created_at).toLocaleString()}
                                        </span>
                                        <span className={`text-xs rounded-full px-2 py-1 ${badgeClasses(row.style)}`}>
                                            {row.style}
                                        </span>
                                    </div>
                                    <details open>
                                        <summary className="cursor-pointer font-medium">Summary</summary>
                                        <p className="mt-2 whitespace-pre-wrap text-slate-100">{row.summary}</p>
                                    </details>
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-sm text-slate-300">Original</summary>
                                        <p className="mt-2 text-sm whitespace-pre-wrap text-slate-200">{row.text}</p>
                                    </details>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
