// server/src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { insertSummary, listSummaries, getSummary } from "./db";
import type { SummaryStyle } from "./types";
import { openai } from "./openai";

const app = express();

// Trust proxy so rate limiting works correctly behind reverse proxies
app.set("trust proxy", 1);

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

// Basic per-IP rate limit for /api/summarize
const summarizerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true, // send RateLimit-* headers
    legacyHeaders: false,
    message: {
        error: "rate_limited",
        message: "Too many requests. Please try again shortly.",
    },
});

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

const SummarizeBody = z.object({
    text: z.string().min(30, "Please provide at least 30 characters.").max(6000, "Max 6000 characters."),
    style: z.union([z.literal("concise"), z.literal("detailed"), z.literal("bullets")]).default("concise"),
});

app.post("/api/summarize", summarizerLimiter, async (req, res) => {
    const parsed = SummarizeBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
    }

    const { text, style } = parsed.data;

    // Simple abuse/repetition guard: reject highly repetitive inputs
    if (/([\w\W]{1,20})\1{10,}/.test(text)) {
        return res.status(400).json({ error: "bad_request", message: "Input appears repetitive/abusive." });
    }

    const styleInstructions: Record<SummaryStyle, string> = {
        concise: "Summarize in 3–5 sentences, plain language.",
        detailed: "Summarize in 6–10 sentences capturing key arguments, data points, and caveats.",
        bullets: "Summarize as 5–8 bullet points. Use short bullets.",
    };

    const instructions =
        `You are an expert text summarizer. ${styleInstructions[style]}\n\n` +
        `Rules:\n- Preserve key facts and numbers.\n- Be faithful, do not invent details.\n- Write in English.`;

    try {
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            // Provide a single input string containing both instructions and the text
            input: `${instructions}\n\n---\nTEXT TO SUMMARIZE:\n${text}`,
        });

        const summary = (response as any)?.output_text?.trim();
        if (!summary) {
            return res.status(502).json({ error: "upstream_error", message: "No summary returned." });
        }

        const row = {
            text,
            summary,
            style,
            created_at: new Date().toISOString(),
        };

        const info = insertSummary.run(row);
        const id = Number(info.lastInsertRowid);

        return res.status(201).json({ id, ...row });
    } catch (err: any) {
        const code = err?.status || err?.statusCode;
        if (code === 429) {
            return res.status(429).json({ error: "rate_limited", message: "OpenAI rate limit reached. Please retry later." });
        }
        console.error("Summarize error:", err);
        return res.status(500).json({ error: "server_error" });
    }
});

app.get("/api/summaries", (req, res) => {
    const q = typeof req.query.q === "string" && req.query.q.trim().length > 0 ? req.query.q.trim() : null;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const rows = listSummaries.all({
        q,
        pat: q ? `%${q}%` : undefined,
        limit,
        offset,
    });

    res.json({ items: rows, limit, offset, q: q || undefined });
});

app.get("/api/summaries/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "bad_request" });

    const row = getSummary.get(id);
    if (!row) return res.status(404).json({ error: "not_found" });

    res.json(row);
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
