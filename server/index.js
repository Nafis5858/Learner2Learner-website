import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { Server } from "socket.io";
import {
  createRoomRecord,
  getRoomById,
  getProfileByToken,
  listPracticeSessions,
  listRooms,
  savePracticeSession,
} from "./supabaseStore.js";

config({ path: ".env.local" });
config();

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 3001);
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.has(origin) ? origin : false);
  },
}));
app.use(express.json({ limit: "1mb" }));

const io = new Server(server, {
  cors: { origin: [...allowedOrigins], methods: ["GET", "POST"] },
});

const rooms = new Map();

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    topic: room.topic,
    level: room.level,
    maxParticipants: room.maxParticipants,
    participants: [...room.participants.values()].map(({ socketId, ...p }) => p),
  };
}

async function hydrateRooms() {
  const storedRooms = await listRooms();
  rooms.clear();
  for (const room of storedRooms) {
    rooms.set(room.id, {
      ...room,
      createdAt: Date.now(),
      participants: new Map(),
      transcripts: [],
    });
  }
}

async function getOrCreateRoom(data = {}) {
  const id = data.id || randomUUID();
  if (!rooms.has(id)) {
    const persisted = (await getRoomById(id)) || (await createRoomRecord({ ...data, id }));
    rooms.set(id, {
      ...persisted,
      createdAt: Date.now(),
      participants: new Map(),
      transcripts: [],
    });
  }
  return rooms.get(id);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY), aiProvider: "gemini" });
});

app.post("/api/auth/signup", (_req, res) => {
  res.status(410).json({ error: "Auth is handled by Supabase Auth in the browser." });
});

app.post("/api/auth/login", (_req, res) => {
  res.status(410).json({ error: "Auth is handled by Supabase Auth in the browser." });
});

app.get("/api/auth/me", authOptional, (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: req.user });
});

app.patch("/api/users/me", (_req, res) => {
  res.status(410).json({ error: "Profile updates are handled by Supabase in the browser." });
});

app.get("/api/users/me/sessions", authRequired, async (req, res, next) => {
  try {
    res.json(await listPracticeSessions(req.user.id, req.accessToken));
  } catch (error) {
    next(error);
  }
});

app.get("/api/rooms", async (_req, res, next) => {
  try {
    res.json(await mergedRooms());
  } catch (error) {
    next(error);
  }
});

app.post("/api/rooms", authRequired, async (req, res, next) => {
  try {
    const persisted = await createRoomRecord(req.body || {}, req.user.id, req.accessToken);
    const room = await getOrCreateRoom(persisted);
    Object.assign(room, persisted);
    res.status(201).json(publicRoom(room));
  } catch (error) {
    next(error);
  }
});

app.post("/api/feedback/analyze", authOptional, async (req, res) => {
  const transcript = Array.isArray(req.body?.transcript) ? req.body.transcript : [];
  const userName = req.body?.userName || "Learner";

  if (transcript.length === 0) {
    return res.status(400).json({ error: "No transcript lines were captured." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({
      error: "GEMINI_API_KEY is not configured on the server.",
      fallback: await persistFeedback(req, buildFallbackFeedback(transcript, userName, "GEMINI_API_KEY is not configured on the server.")),
    });
  }

  try {
    const prompt = transcript
      .map((line) => `${line.speakerName}${line.isYou ? " (target learner)" : ""}: ${line.text}`)
      .join("\n");

    const feedback = await analyzeWithGemini(userName, prompt);
    res.json(await persistFeedback(req, feedback));
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    res.status(500).json({
      error: message,
      fallback: await persistFeedback(req, buildFallbackFeedback(transcript, userName, message)),
    });
  }
});

async function analyzeWithGemini(userName, prompt) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "You are an IELTS speaking examiner and English teacher. Return strict JSON with keys: overallBand, fluencyScore, grammarScore, vocabularyScore, coherenceScore, pronunciationScore, corrections, vocabularySuggestions, summary, nextSteps. corrections items need bad, good, note, category. vocabularySuggestions items need original, better, context, example. Analyze only the target learner.\n\n" +
                `Target learner: ${userName}\n\nTranscript:\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API request failed with status ${response.status}.`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned an empty feedback response.");
  return JSON.parse(text);
}

io.on("connection", (socket) => {
  socket.on("rooms:list", async () => {
    socket.emit("rooms:update", await mergedRooms());
  });

  socket.on("room:create", async (payload, callback) => {
    try {
      const persisted = await createRoomRecord(payload || {});
      const room = await getOrCreateRoom(persisted);
      io.emit("rooms:update", await mergedRooms());
      callback?.(publicRoom(room));
    } catch (error) {
      callback?.({ error: error instanceof Error ? error.message : "Could not create room." });
    }
  });

  socket.on("room:join", async ({ roomId, user }) => {
    const room = await getOrCreateRoom({ id: roomId });
    const participant = {
      id: user.id,
      name: user.name,
      country: user.country,
      level: user.level,
      isMuted: false,
      joinedAt: Date.now(),
      socketId: socket.id,
    };

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.userId = user.id;
    room.participants.set(user.id, participant);

    const existingPeers = [...room.participants.values()]
      .filter((p) => p.id !== user.id)
      .map(({ socketId, ...p }) => p);

    socket.emit("room:peers", existingPeers);
    socket.to(room.id).emit("room:participant-joined", publicParticipant(participant));
    io.emit("rooms:update", await mergedRooms());
  });

  socket.on("signal:offer", ({ to, description }) => emitToUser(to, "signal:offer", { from: socket.data.userId, description }));
  socket.on("signal:answer", ({ to, description }) => emitToUser(to, "signal:answer", { from: socket.data.userId, description }));
  socket.on("signal:ice", ({ to, candidate }) => emitToUser(to, "signal:ice", { from: socket.data.userId, candidate }));

  socket.on("participant:mute", ({ muted }) => {
    const room = rooms.get(socket.data.roomId);
    const participant = room?.participants.get(socket.data.userId);
    if (!room || !participant) return;
    participant.isMuted = Boolean(muted);
    io.to(room.id).emit("room:participants", publicRoom(room).participants);
    mergedRooms().then((next) => io.emit("rooms:update", next)).catch(() => undefined);
  });

  socket.on("transcript:add", (line) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const enriched = { ...line, id: randomUUID(), at: new Date().toISOString() };
    room.transcripts.push(enriched);
    io.to(room.id).emit("transcript:line", enriched);
  });

  socket.on("room:leave", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));
});

function publicParticipant(participant) {
  const { socketId, ...publicData } = participant;
  return publicData;
}

function emitToUser(userId, event, payload) {
  for (const room of rooms.values()) {
    const peer = room.participants.get(userId);
    if (peer) io.to(peer.socketId).emit(event, payload);
  }
}

function leaveRoom(socket) {
  const room = rooms.get(socket.data.roomId);
  if (!room || !socket.data.userId) return;
  room.participants.delete(socket.data.userId);
  socket.to(room.id).emit("room:participant-left", { id: socket.data.userId });
  mergedRooms().then((next) => io.emit("rooms:update", next)).catch(() => undefined);
  socket.data.roomId = null;
  socket.data.userId = null;
}

async function mergedRooms() {
  return (await listRooms()).map((stored) => {
    const live = rooms.get(stored.id);
    return live ? publicRoom({ ...live, ...stored, participants: live.participants }) : stored;
  });
}

async function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  req.accessToken = token;
  try {
    req.user = await getProfileByToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

function authRequired(req, res, next) {
  authOptional(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return res.status(401).json({ error: "Authentication required." });
    next();
  });
}

async function persistFeedback(req, feedback) {
  const saved = await savePracticeSession({
    userId: req.user?.id || null,
    roomId: req.body?.roomId || null,
    roomName: req.body?.roomName || "Practice Room",
    topic: req.body?.topic || "Free Talk",
    duration: req.body?.duration || 0,
    transcript: req.body?.transcript || [],
    feedback,
  }, req.accessToken);
  return { ...feedback, sessionId: saved.id };
}

function buildFallbackFeedback(transcript, userName, reason = "") {
  const ownLines = transcript.filter((line) => line.isYou || line.speakerName === userName);
  const words = ownLines.flatMap((line) => line.text.trim().split(/\s+/)).filter(Boolean);
  const estimatedBand = words.length > 120 ? 6.5 : words.length > 60 ? 6 : 5.5;
  const quotaIssue = reason.includes("429") || reason.toLowerCase().includes("quota") || reason.toLowerCase().includes("billing");

  return {
    overallBand: estimatedBand,
    fluencyScore: estimatedBand,
    grammarScore: Math.max(4.5, estimatedBand - 0.5),
    vocabularyScore: estimatedBand,
    coherenceScore: estimatedBand,
    pronunciationScore: estimatedBand,
    corrections: [],
    vocabularySuggestions: [],
    summary: quotaIssue
      ? "Transcript was captured, but Gemini rejected the request because the API project has no available quota or billing is not active."
      : `Transcript was captured, but real AI analysis could not run${reason ? `: ${reason}` : "."}`,
    nextSteps: quotaIssue
      ? ["Open Google AI Studio or Google Cloud billing and make sure the Gemini API project has available quota.", "Retry after the project has available quota."]
      : ["Check GEMINI_API_KEY and GEMINI_MODEL on the backend.", "Speak for at least two minutes before ending a session."],
  };
}

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: error instanceof Error ? error.message : "Server error." });
});

hydrateRooms()
  .then(() => {
    server.listen(port, () => {
      console.log(`Learner2Learner server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
