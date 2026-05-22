import { io, type Socket } from "socket.io-client";
import { getToken } from "./auth";

export type RoomSummary = {
  id: string;
  name: string;
  topic: string;
  level: string;
  maxParticipants: number;
  participants: ParticipantSummary[];
};

export type ParticipantSummary = {
  id: string;
  name: string;
  country?: string;
  level?: string;
  isMuted: boolean;
  joinedAt: number;
};

export type TranscriptLine = {
  id?: string;
  speakerId: string;
  speakerName: string;
  isYou: boolean;
  text: string;
  at?: string;
};

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:3001", {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export async function fetchRooms(): Promise<RoomSummary[]> {
  const response = await fetch(`${apiBase()}/api/rooms`);
  if (!response.ok) throw new Error("Could not load rooms.");
  return response.json();
}

export async function createRoom(input: {
  name: string;
  topic: string;
  level: string;
  maxParticipants: number;
}): Promise<RoomSummary> {
  const response = await fetch(`${apiBase()}/api/rooms`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Could not create room.");
  return response.json();
}

export async function analyzeFeedback(input: {
  userName: string;
  roomId?: string;
  roomName?: string;
  topic?: string;
  duration?: number;
  transcript: TranscriptLine[];
}) {
  const response = await fetch(`${apiBase()}/api/feedback/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok && data.fallback) return data.fallback;
  if (!response.ok) throw new Error(data.error || "AI feedback failed.");
  return data;
}

function apiBase() {
  return import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
