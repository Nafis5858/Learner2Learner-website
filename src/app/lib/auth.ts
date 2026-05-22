import { supabase } from "./supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  nativeLanguage: string;
  level: string;
  targetBand: number;
  joinedDate: string;
  totalSessions: number;
  totalMinutes: number;
  currentBand: number;
  streak: number;
  topics: string[];
  countriesConnected: string[];
  avatar?: string;
}

const USER_KEY = "fw_user";
const TOKEN_KEY = "l2l_token";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string;
  country: string | null;
  native_language: string | null;
  english_level: string | null;
  target_score: number | null;
  current_band: number | null;
  total_sessions: number | null;
  total_minutes: number | null;
  streak: number | null;
  topics: string[] | null;
  countries_connected: string[] | null;
  avatar_url: string | null;
  created_at: string;
};

export const getUser = (): User | null => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? (JSON.parse(s) as User) : null;
  } catch {
    return null;
  }
};

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const saveUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  void updateProfile(user).catch(() => undefined);
};

function saveSession(user: User, token?: string | null): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export const signOut = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  void supabase.auth.signOut();
};

export async function signUp(fields: {
  name: string;
  email: string;
  password: string;
  country: string;
  language: string;
  level: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      data: {
        full_name: fields.name,
        country: fields.country,
        native_language: fields.language,
        english_level: fields.level,
      },
    },
  });

  if (error) throw new Error(formatSupabaseTableError(error));

  const authUser = data.user || data.session?.user;
  if (!authUser) {
    throw new Error("Supabase did not return a new user. In Supabase, check Authentication > Providers and make sure Email signup is enabled.");
  }

  if (authUser.identities && authUser.identities.length === 0) {
    throw new Error("This email is already registered. Switch to Sign In instead.");
  }

  if (!data.session) {
    throw new Error("Account created. Confirm your email, then sign in.");
  }

  const profile = await upsertProfile({
    id: authUser.id,
    email: authUser.email || fields.email,
    full_name: fields.name,
    country: fields.country,
    native_language: fields.language,
    english_level: fields.level,
    target_score: 7.5,
    current_band: levelToBand(fields.level),
    total_sessions: 0,
    total_minutes: 0,
    streak: 0,
    topics: ["Daily Life", "IELTS Speaking"],
    countries_connected: [],
  });

  const user = toUser(profile);
  saveSession(user, data.session.access_token);
  return user;
}

export async function signIn(fields: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fields.email,
    password: fields.password,
  });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error("Could not sign in.");

  const metadata = data.user.user_metadata || {};
  const profile = await getOrCreateProfile({
    id: data.user.id,
    email: data.user.email || fields.email,
    full_name: metadata.full_name || data.user.email?.split("@")[0] || "Learner",
    country: metadata.country || "Unknown",
    native_language: metadata.native_language || "Unknown",
    english_level: metadata.english_level || "B1",
  });

  const user = toUser(profile);
  saveSession(user, data.session.access_token);
  return user;
}

export async function refreshUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.access_token) {
    localStorage.setItem(TOKEN_KEY, sessionData.session.access_token);
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(error?.message || "Not signed in.");

  const profile = await getOrCreateProfile({
    id: data.user.id,
    email: data.user.email || "",
    full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Learner",
    country: data.user.user_metadata?.country || "Unknown",
    native_language: data.user.user_metadata?.native_language || "Unknown",
    english_level: data.user.user_metadata?.english_level || "B1",
  });
  const user = toUser(profile);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function updateProfile(user: User) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .update({
      full_name: user.name,
      country: user.country,
      native_language: user.nativeLanguage,
      english_level: user.level,
      target_score: user.targetBand,
      topics: user.topics,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const next = toUser(data as ProfileRow);
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}

export async function getSessionHistory() {
  const { data, error } = await (supabase as any)
    .from("practice_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
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
  }));
}

export const createUser = (fields: {
  name: string;
  email: string;
  country: string;
  language: string;
  level: string;
}): User => ({
  id: Date.now().toString(),
  name: fields.name,
  email: fields.email,
  country: fields.country,
  nativeLanguage: fields.language,
  level: fields.level,
  targetBand: 7.5,
  joinedDate: new Date().toISOString(),
  totalSessions: 0,
  totalMinutes: 0,
  currentBand: levelToBand(fields.level),
  streak: 0,
  topics: ["Daily Life", "IELTS Speaking"],
  countriesConnected: [],
});

async function getOrCreateProfile(fallback: {
  id: string;
  email: string;
  full_name: string;
  country: string;
  native_language: string;
  english_level: string;
}) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", fallback.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data as ProfileRow;

  return upsertProfile({
    ...fallback,
    target_score: 7.5,
    current_band: levelToBand(fallback.english_level),
    total_sessions: 0,
    total_minutes: 0,
    streak: 0,
    topics: ["Daily Life", "IELTS Speaking"],
    countries_connected: [],
  });
}

async function upsertProfile(profile: Partial<ProfileRow> & { id: string; full_name: string }) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(formatSupabaseTableError(error));
  return data as ProfileRow;
}

function formatSupabaseTableError(error: { message?: string; code?: string }) {
  if (error.code === "42P01" || error.message?.includes("schema cache") || error.message?.includes("profiles")) {
    return "Supabase tables are not ready. Run supabase_schema.sql in the Supabase SQL Editor, then try again.";
  }
  return error.message || "Supabase request failed.";
}

function toUser(row: ProfileRow): User {
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
    avatar: row.avatar_url || undefined,
  };
}

function levelToBand(level: string) {
  const levelMap: Record<string, number> = { A1: 3, A2: 4, B1: 5, B2: 6, C1: 7.5, C2: 8.5 };
  return levelMap[level] || 5;
}
