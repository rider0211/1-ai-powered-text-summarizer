# AI‑Powered Text Summarizer (React + Express + TypeScript + Tailwind v4 + SQLite)

## 1) Summary

A full‑stack web app where users paste long text and get an AI‑generated summary.

**Client**: React (Vite) + Tailwind v4 

**Server**: Express + TypeScript + SQLite (via `better-sqlite3`)

**AI**: OpenAI Responses API (`gpt-4o-mini` by default)

### Features

* Paste → summarize via OpenAI
* Saves **original + summary + style + timestamp** in SQLite
* **Past summaries list** with quick search
* **Adjustable style**: *concise*, *detailed*, *bullets*
* **Basic abuse guard** (length + repetition) and **rate limiting** on `/api/summarize`
* Dark gradient UI with **color‑coded badges** per style

### Project Structure

```
ai-powered-text-summarizer/
├─ server/           # Express + TS + SQLite
│  ├─ src/
│  │  ├─ index.ts    # routes & rate limit
│  │  ├─ db.ts       # SQLite setup & queries
│  │  ├─ openai.ts   # OpenAI client
│  │  └─ types.ts
│  └─ .env.example
└─ client/           # React + Vite + Tailwind v4
   ├─ src/
   │  ├─ App.tsx
   │  ├─ api.ts
   │  └─ types.ts
   ├─ index.css
   ├─ postcss.config.cjs
   └─ index.html
```

---

## 2) Installation

### Prerequisites

* **Node** v22.15 recommended
* An **OpenAI API key**

### Clone & install

```bash
git clone https://github.com/rider0211/1-ai-powered-text-summarizer.git 

cd 1-ai-powered-text-summarizer.git
```

**Server**

```bash
cd server
cp .env.example .env
# edit .env to add your OpenAI key
# OPENAI_API_KEY=sk-...
npm install
```

**Client**

```bash
cd ../client
npm install
```

### Environment variables

**`server/.env`**

```ini
OPENAI_API_KEY=sk-...
PORT=5050
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data.sqlite
```

**`client` optional `.env`**

```ini
# Only needed if your API is not on http://localhost:5050
VITE_API_BASE=http://localhost:5050
```

---

## 3) How to Run

### Development

**Start the server**

```bash
cd server
npm run dev
# → http://localhost:5050
```

**Start the client**

```bash
cd ../client
# expose to LAN if needed (note the extra --):
npm run dev -- --host 0.0.0.0
# → http://localhost:5173
```

Open the client in the browser, paste text (≥ 30 chars), choose a style, and click **Summarize**.

### API reference (quick testing)

**Create a summary**

```bash
curl -X POST http://localhost:5050/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"Your long text here ...","style":"concise"}'
```

**List summaries**

```bash
curl "http://localhost:5050/api/summaries?q=keyword"
```

**Get one**

```bash
curl http://localhost:5050/api/summaries/1
```

### SQLite schema (auto‑created)

```sql
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  summary TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

## 4) Bonus Points in This Project

* **Adjustable summary styles**

  * `concise`: 3–5 sentences
  * `detailed`: 6–10 sentences with key arguments/data
  * `bullets`: 5–8 short bullet points
* **Basic rate limiting**

  * `express-rate-limit` set to **10 req/min per IP** on `/api/summarize`
* **Simple abuse guard**

  * Rejects highly repetitive inputs and enforces size limits (30–6000 chars)
* **Search saved summaries**

  * Client-side search on both original text and summary
* **Dark gradient UI**

  * Glassy cards, gradient header, and **color‑coded badges** per style

    * concise → sky, detailed → violet, bullets → amber

---

## Troubleshooting

* **`--host` not working**: NPM eats flags unless you add `--` before them. Use `npm run dev -- --host 0.0.0.0`.
* **Tailwind v4 + PostCSS**: Ensure `client/postcss.config.cjs` exists and contains:

  ```js
  module.exports = { plugins: [require("@tailwindcss/postcss")] };
  ```

  In `client/index.css` use:

  ```css
  @import "tailwindcss";
  ```
* **ESM vs CJS config**: Don’t mix `postcss.config.js` (ESM `export default`) in a CommonJS project. Use `.cjs` or switch the package to ESM.
* **Vite cache**: If styles don’t update, stop dev server and remove `node_modules/.vite` then restart.

---

## Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS v4
* **Backend**: Node.js, Express, TypeScript
* **DB**: SQLite (`better-sqlite3`)
* **AI**: OpenAI Responses API