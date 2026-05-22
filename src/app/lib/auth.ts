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

export const saveSession = (user: User, token: string): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
};

export const signOut = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export async function signUp(fields: {
  name: string;
  email: string;
  password: string;
  country: string;
  language: string;
  level: string;
}) {
  const data = await api<{ user: User; token: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(fields),
  });
  saveSession(data.user, data.token);
  return data.user;
}

export async function signIn(fields: { email: string; password: string }) {
  const data = await api<{ user: User; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(fields),
  });
  saveSession(data.user, data.token);
  return data.user;
}

export async function refreshUser() {
  const data = await api<{ user: User }>("/api/auth/me");
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function updateProfile(user: User) {
  const data = await api<{ user: User }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify({
      name: user.name,
      country: user.country,
      nativeLanguage: user.nativeLanguage,
      level: user.level,
      targetBand: user.targetBand,
      topics: user.topics,
    }),
  });
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function getSessionHistory() {
  return api("/api/users/me/sessions");
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
  currentBand: 5,
  streak: 0,
  topics: ["Daily Life", "IELTS Speaking"],
  countriesConnected: [],
});

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}

function apiBase() {
  return import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
}
