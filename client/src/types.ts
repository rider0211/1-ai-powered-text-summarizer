export type SummaryStyle = "concise" | "detailed" | "bullets";
export interface SummaryRow { id: number; text: string; summary: string; style: SummaryStyle; created_at: string; }