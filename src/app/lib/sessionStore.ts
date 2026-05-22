import type { TranscriptLine } from "./realtime";

export type FeedbackResult = {
  overallBand: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  pronunciationScore: number;
  corrections: { bad: string; good: string; note: string; category?: string }[];
  vocabularySuggestions: { original: string; better: string; context: string; example: string }[];
  summary: string;
  nextSteps?: string[];
};

export type LastSession = {
  roomName: string;
  topic: string;
  duration: number;
  transcript: TranscriptLine[];
  feedback: FeedbackResult | null;
};

const KEY = "l2l_last_session";

export function saveLastSession(session: LastSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function getLastSession(): LastSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastSession;
  } catch {
    return null;
  }
}
