import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });
config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase server environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
}

export function clientForToken(token = "") {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export const supabase = clientForToken();

export async function getProfileByToken(token) {
  if (!token) return null;
  const authed = clientForToken(token);
  const { data: authData, error: authError } = await authed.auth.getUser(token);
  if (authError || !authData.user) return null;

  const { data, error } = await authed
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return toUser(data);

  const profile = {
    id: authData.user.id,
    email: authData.user.email,
    full_name: authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "Learner",
    country: authData.user.user_metadata?.country || "Unknown",
    native_language: authData.user.user_metadata?.native_language || "Unknown",
    english_level: authData.user.user_metadata?.english_level || "B1",
    target_score: 7.5,
    current_band: 5,
  };

  const { data: inserted, error: insertError } = await authed
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return toUser(inserted);
}

export async function listRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(toRoom);
}

export async function createRoomRecord(fields, hostUserId = null, token = "") {
  const authed = clientForToken(token);
  const payload = {
    ...(fields.id ? { id: fields.id } : {}),
    name: fields.name || "Untitled Practice Room",
    topic: fields.topic || "Free Talk",
    level: fields.level || "B1-B2",
    max_participants: Number(fields.maxParticipants || fields.max_participants || 8),
    host_user_id: hostUserId,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const query = fields.id
    ? authed.from("rooms").upsert(payload, { onConflict: "id" })
    : authed.from("rooms").insert(payload);

  const { data, error } = await query.select().single();

  if (error) throw new Error(error.message);
  return toRoom(data);
}

export async function getRoomById(id) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toRoom(data) : null;
}

export async function savePracticeSession(input, token = "") {
  if (!input.userId || !token) {
    return {
      id: randomUUID(),
      userId: null,
      roomId: input.roomId || null,
      roomName: input.roomName || "Practice Room",
      topic: input.topic || "Free Talk",
      duration: Number(input.duration || 0),
      transcript: input.transcript || [],
      feedback: input.feedback || {},
      overallBand: typeof input.feedback?.overallBand === "number" ? input.feedback.overallBand : null,
      createdAt: new Date().toISOString(),
    };
  }

  const authed = clientForToken(token);
  const feedback = input.feedback || {};
  const payload = {
    user_id: input.userId || null,
    room_id: isUuid(input.roomId) ? input.roomId : null,
    room_name: input.roomName || "Practice Room",
    topic: input.topic || "Free Talk",
    duration_seconds: Number(input.duration || 0),
    transcript: input.transcript || [],
    feedback,
    overall_band: typeof feedback.overallBand === "number" ? feedback.overallBand : null,
  };

  const { data, error } = await authed
    .from("practice_sessions")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.userId) {
    await updateProfileStats(authed, input.userId, payload.duration_seconds, payload.overall_band);
  }

  return toPracticeSession(data);
}

export async function listPracticeSessions(userId, token = "") {
  const authed = clientForToken(token);
  const { data, error } = await authed
    .from("practice_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(toPracticeSession);
}

async function updateProfileStats(authed, userId, durationSeconds, overallBand) {
  const { data: current, error: readError } = await authed
    .from("profiles")
    .select("total_sessions,total_minutes,current_band")
    .eq("id", userId)
    .single();

  if (readError) throw new Error(readError.message);

  const { error } = await authed
    .from("profiles")
    .update({
      total_sessions: Number(current.total_sessions || 0) + 1,
      total_minutes: Number(current.total_minutes || 0) + Math.round(Number(durationSeconds || 0) / 60),
      current_band: overallBand ?? current.current_band,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

function toUser(row) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email || "",
    country: row.country || "Unknown",
    nativeLanguage: row.native_language || "Unknown",
    level: row.english_level || "B1",
    targetBand: Number(row.target_score || 7.5),
    joinedDate: row.created_at,
    totalSessions: Number(row.total_sessions || 0),
    totalMinutes: Number(row.total_minutes || 0),
    currentBand: Number(row.current_band || 5),
    streak: Number(row.streak || 0),
    topics: Array.isArray(row.topics) ? row.topics : [],
    countriesConnected: Array.isArray(row.countries_connected) ? row.countries_connected : [],
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
    transcript: row.transcript || [],
    feedback: row.feedback || {},
    overallBand: row.overall_band,
    createdAt: row.created_at,
  };
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
