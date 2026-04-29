import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.resolve("/home/runner/workspace/data");
const LOG_FILE = path.join(DATA_DIR, "audit-logs.json");

export type AuditLogEntry = {
  id: string;
  sessionId: string;
  createdAt: string;
  userMessage: string;
  aiResponse: string;
  nonBenFlag: boolean;
  nonBenTrigger: string;
  fallbackFlag: boolean;
};

function readLogs(): AuditLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return JSON.parse(raw) as AuditLogEntry[];
  } catch {
    return [];
  }
}

function writeLogs(logs: AuditLogEntry[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

export function saveAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): AuditLogEntry {
  const logs = readLogs();
  const newEntry: AuditLogEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  logs.unshift(newEntry);
  // Keep max 500 entries
  const trimmed = logs.slice(0, 500);
  writeLogs(trimmed);
  return newEntry;
}

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  const logs = readLogs();
  return logs.slice(0, limit);
}

const NON_BEN_KEYWORDS = [
  "慰謝料",
  "いくら",
  "勝てる",
  "負ける",
  "交渉",
  "連絡して",
  "代理",
  "訴えたい",
  "相場",
  "有利",
  "不利",
];

const FALLBACK_PHRASES = [
  "担当者が確認します",
  "確認に時間がかかっています",
];

export function detectNonBen(text: string): { flag: boolean; triggers: string } {
  const matched = NON_BEN_KEYWORDS.filter((kw) => text.includes(kw));
  return {
    flag: matched.length > 0,
    triggers: matched.join(","),
  };
}

export function detectFallback(text: string): boolean {
  return FALLBACK_PHRASES.some((phrase) => text.includes(phrase));
}
