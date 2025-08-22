import type { SummaryRow, SummaryStyle } from "./types";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050";

export async function summarize(text: string, style: SummaryStyle): Promise<SummaryRow> {
    const res = await fetch(`${BASE}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
    });
    if (!res.ok) throw new Error(`Summarize failed: ${res.status}`);
    return res.json();
}

export async function listSummaries(q?: string): Promise<SummaryRow[]> {
    const url = new URL(`${BASE}/api/summaries`);
    if (q) url.searchParams.set("q", q);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    const data = await res.json();
    return data.items as SummaryRow[];
}