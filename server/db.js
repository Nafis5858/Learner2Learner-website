import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const dataDir = path.resolve("server", "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "learner2learner.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    native_language TEXT NOT NULL,
    level TEXT NOT NULL,
    current_band REAL NOT NULL DEFAULT 5.0,
    target_band REAL NOT NULL DEFAULT 7.5,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_minutes INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    topics TEXT NOT NULL DEFAULT '[]',
    countries_connected TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    topic TEXT NOT NULL,
    level TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 8,
    host_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    room_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    transcript_json TEXT NOT NULL DEFAULT '[]',
    feedback_json TEXT NOT NULL DEFAULT '{}',
    overall_band REAL,
    created_at TEXT NOT NULL
  );
`);

const count = db.prepare("SELECT COUNT(*) AS count FROM rooms").get().count;
if (count === 0) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO rooms (id, name, topic, level, max_participants, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run("open-daily-life", "Open English Practice", "Daily Life", "A2-B2", 8, now, now);
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = Buffer.from(hash, "hex");
  const attempted = scryptSync(password, salt, 64);
  return actual.length === attempted.length && timingSafeEqual(actual, attempted);
}

export function createToken(userId) {
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 30);
  db.prepare("INSERT INTO auth_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    userId,
    createdAt.toISOString(),
    expiresAt.toISOString(),
  );
  return token;
}

export function getUserByToken(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT users.*
    FROM auth_sessions
    JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token = ? AND auth_sessions.expires_at > ?
  `).get(token, new Date().toISOString());
  return row ? toUser(row) : null;
}

export function createUser(fields) {
  const now = new Date().toISOString();
  const levelToBand = { A1: 3, A2: 4, B1: 5, B2: 6, C1: 7.5, C2: 8.5 };
  const id = randomUUID();
  db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, country, native_language, level,
      current_band, target_band, total_sessions, total_minutes, streak,
      topics, countries_connected, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 7.5, 0, 0, 0, ?, ?, ?, ?)
  `).run(
    id,
    fields.email.toLowerCase(),
    hashPassword(fields.password),
    fields.name,
    fields.country,
    fields.language,
    fields.level,
    levelToBand[fields.level] || 5,
    JSON.stringify(["Daily Life", "IELTS Speaking"]),
    JSON.stringify([]),
    now,
    now,
  );
  return getUserById(id);
}

export function getUserById(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? toUser(row) : null;
}

export function getUserByEmail(email) {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  return row || null;
}

export function updateUser(userId, fields) {
  const current = getUserById(userId);
  if (!current) return null;
  const next = {
    name: fields.name ?? current.name,
    country: fields.country ?? current.country,
    nativeLanguage: fields.nativeLanguage ?? current.nativeLanguage,
    level: fields.level ?? current.level,
    targetBand: Number(fields.targetBand ?? current.targetBand),
    topics: fields.topics ?? current.topics,
  };
  db.prepare(`
    UPDATE users
    SET name = ?, country = ?, native_language = ?, level = ?, target_band = ?,
        topics = ?, updated_at = ?
    WHERE id = ?
  `).run(
    next.name,
    next.country,
    next.nativeLanguage,
    next.level,
    next.targetBand,
    JSON.stringify(next.topics),
    new Date().toISOString(),
    userId,
  );
  return getUserById(userId);
}

export function listRooms() {
  return db.prepare("SELECT * FROM rooms WHERE is_active = 1 ORDER BY created_at DESC").all().map(toRoom);
}

export function createRoomRecord(fields, hostUserId = null) {
  const now = new Date().toISOString();
  const id = fields.id || randomUUID();
  db.prepare(`
    INSERT OR REPLACE INTO rooms (id, name, topic, level, max_participants, host_user_id, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, COALESCE((SELECT created_at FROM rooms WHERE id = ?), ?), ?)
  `).run(
    id,
    fields.name || "Untitled Practice Room",
    fields.topic || "Free Talk",
    fields.level || "B1-B2",
    Number(fields.maxParticipants || 8),
    hostUserId,
    id,
    now,
    now,
  );
  return getRoomById(id);
}

export function getRoomById(id) {
  const row = db.prepare("SELECT * FROM rooms WHERE id = ?").get(id);
  return row ? toRoom(row) : null;
}

export function savePracticeSession(input) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const feedback = input.feedback || {};
  db.prepare(`
    INSERT INTO practice_sessions (
      id, user_id, room_id, room_name, topic, duration_seconds,
      transcript_json, feedback_json, overall_band, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.userId || null,
    input.roomId || null,
    input.roomName || "Practice Room",
    input.topic || "Free Talk",
    Number(input.duration || 0),
    JSON.stringify(input.transcript || []),
    JSON.stringify(feedback),
    typeof feedback.overallBand === "number" ? feedback.overallBand : null,
    now,
  );

  if (input.userId) {
    db.prepare(`
      UPDATE users
      SET total_sessions = total_sessions + 1,
          total_minutes = total_minutes + ?,
          current_band = COALESCE(?, current_band),
          updated_at = ?
      WHERE id = ?
    `).run(Math.round(Number(input.duration || 0) / 60), typeof feedback.overallBand === "number" ? feedback.overallBand : null, now, input.userId);
  }

  return getPracticeSession(id);
}

export function listPracticeSessions(userId) {
  return db.prepare("SELECT * FROM practice_sessions WHERE user_id = ? ORDER BY created_at DESC").all(userId).map(toPracticeSession);
}

export function getPracticeSession(id) {
  const row = db.prepare("SELECT * FROM practice_sessions WHERE id = ?").get(id);
  return row ? toPracticeSession(row) : null;
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    country: row.country,
    nativeLanguage: row.native_language,
    level: row.level,
    targetBand: row.target_band,
    joinedDate: row.created_at,
    totalSessions: row.total_sessions,
    totalMinutes: row.total_minutes,
    currentBand: row.current_band,
    streak: row.streak,
    topics: safeJson(row.topics, []),
    countriesConnected: safeJson(row.countries_connected, []),
  };
}

function toRoom(row) {
  return {
    id: row.id,
    name: row.name,
    topic: row.topic,
    level: row.level,
    maxParticipants: row.max_participants,
    hostUserId: row.host_user_id,
    participants: [],
  };
}

function toPracticeSession(row) {
  return {
    id: row.id,
    userId: row.user_id,
    roomId: row.room_id,
    roomName: row.room_name,
    topic: row.topic,
    duration: row.duration_seconds,
    transcript: safeJson(row.transcript_json, []),
    feedback: safeJson(row.feedback_json, {}),
    overallBand: row.overall_band,
    createdAt: row.created_at,
  };
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
