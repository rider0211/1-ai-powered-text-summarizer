import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.prepare(`CREATE TABLE IF NOT EXISTS summaries (id INTEGER PRIMARY KEY AUTOINCREMENT,text TEXT NOT NULL,summary TEXT NOT NULL,style TEXT NOT NULL,created_at TEXT NOT NULL);`).run();

export const insertSummary = db.prepare(`INSERT INTO summaries (text, summary, style, created_at) VALUES (@text, @summary, @style, @created_at)`);

export const listSummaries = db.prepare(`SELECT id, text, summary, style, created_at FROM summaries WHERE (@q IS NULL OR text LIKE @pat OR summary LIKE @pat) ORDER BY datetime(created_at) DESC LIMIT @limit OFFSET @offset`);

export const getSummary = db.prepare(`SELECT id, text, summary, style, created_at FROM summaries WHERE id = ?`);