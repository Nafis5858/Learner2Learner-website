import cors from "cors";
import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import http from "node:http";
import OpenAI from "openai";
import { Server } from "socket.io";
import {
  createRoomRecord,
  createToken,
  createUser,
  getRoomById,
  getUserByEmail,
  getUserByToken,
  listPracticeSessions,
  listRooms,
  savePracticeSession,
  updateUser,
  verifyPassword,
} from "./db.js";

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 3001);
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json({ limit: "1mb" }));

const io = new Server(server, {
  cors: { origin: [...allowedOrigins], methods: ["GET", "POST"] },
});

const rooms = new Map(listRooms().map((room) => [
  room.id,
  {
    ...room,
    createdAt: Date.now(),
    participants: new Map(),
    transcripts: [],
  },
]));

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

function getOrCreateRoom(data = {}) {
  const id = data.id || randomUUID();
  if (!rooms.has(id)) {
    const persisted = getRoomById(id) || createRoomRecord({ ...data, id });
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
  res.json({ ok: true });
});

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, country, language, level } = req.body || {};
  if (!name || !email || !password || !country || !language || !level) {
    return res.status(400).json({ error: "Missing required signup fields." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const user = createUser({ name, email, password, country, language, level });
  const token = createToken(user.id);
  res.status(201).json({ user, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const row = email ? getUserByEmail(email) : null;
  if (!row || !verifyPassword(password || "", row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const token = createToken(row.id);
  res.json({ user: getUserByToken(token), token });
});

app.get("/api/auth/me", authOptional, (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: req.user });
});

app.patch("/api/users/me", authRequired, (req, res) => {
  const updated = updateUser(req.user.id, req.body || {});
  res.json({ user: updated });
});

app.get("/api/users/me/sessions", authRequired, (req, res) => {
  res.json(listPracticeSessions(req.user.id));
});

app.get("/api/rooms", (_req, res) => {
  res.json(mergedRooms());
});

app.post("/api/rooms", authOptional, (req, res) => {
  const persisted = createRoomRecord(req.body || {}, req.user?.id || null);
  const room = getOrCreateRoom(persisted);
  Object.assign(room, persisted);
  res.status(201).json(publicRoom(room));
});

app.post("/api/feedback/analyze", authOptional, async (req, res) => {
  const transcript = Array.isArray(req.body?.transcript) ? req.body.transcript : [];
  const userName = req.body?.userName || "Learner";

  if (transcript.length === 0) {
    return res.status(400).json({ error: "No transcript lines were captured." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({
      error: "OPENAI_API_KEY is not configured on the server.",
      fallback: persistFeedback(req, buildFallbackFeedback(transcript, userName)),
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = transcript
      .map((line) => `${line.speakerName}${line.isYou ? " (target learner)" : ""}: ${line.text}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_FEEDBACK_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an IELTS speaking examiner and English teacher. Return strict JSON with keys: overallBand, fluencyScore, grammarScore, vocabularyScore, coherenceScore, pronunciationScore, corrections, vocabularySuggestions, summary, nextSteps. corrections items need bad, good, note, category. vocabularySuggestions items need original, better, context, example. Analyze only the target learner.",
        },
        {
          role: "user",
          content: `Target learner: ${userName}\n\nTranscript:\n${prompt}`,
        },
      ],
    });

    const feedback = JSON.parse(response.choices[0]?.message?.content || "{}");
    res.json(persistFeedback(req, feedback));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "AI analysis failed.",
      fallback: persistFeedback(req, buildFallbackFeedback(transcript, userName)),
    });
  }
});

io.on("connection", (socket) => {
  socket.on("rooms:list", () => {
    socket.emit("rooms:update", [...rooms.values()].map(publicRoom));
  });

  socket.on("room:create", (payload, callback) => {
    const persisted = createRoomRecord(payload || {});
    const room = getOrCreateRoom(persisted);
    io.emit("rooms:update", mergedRooms());
    callback?.(publicRoom(room));
  });

  socket.on("room:join", ({ roomId, user }) => {
    const room = getOrCreateRoom({ id: roomId });
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
    io.emit("rooms:update", mergedRooms());
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
    io.emit("rooms:update", mergedRooms());
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
  io.emit("rooms:update", mergedRooms());
  socket.data.roomId = null;
  socket.data.userId = null;
}

function mergedRooms() {
  return listRooms().map((stored) => {
    const live = rooms.get(stored.id);
    return live ? publicRoom({ ...live, ...stored, participants: live.participants }) : stored;
  });
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  req.user = getUserByToken(token);
  next();
}

function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) return res.status(401).json({ error: "Authentication required." });
    next();
  });
}

function persistFeedback(req, feedback) {
  const saved = savePracticeSession({
    userId: req.user?.id || null,
    roomId: req.body?.roomId || null,
    roomName: req.body?.roomName || "Practice Room",
    topic: req.body?.topic || "Free Talk",
    duration: req.body?.duration || 0,
    transcript: req.body?.transcript || [],
    feedback,
  });
  return { ...feedback, sessionId: saved.id };
}

function buildFallbackFeedback(transcript, userName) {
  const ownLines = transcript.filter((line) => line.isYou || line.speakerName === userName);
  const words = ownLines.flatMap((line) => line.text.trim().split(/\s+/)).filter(Boolean);
  const estimatedBand = words.length > 120 ? 6.5 : words.length > 60 ? 6 : 5.5;

  return {
    overallBand: estimatedBand,
    fluencyScore: estimatedBand,
    grammarScore: Math.max(4.5, estimatedBand - 0.5),
    vocabularyScore: estimatedBand,
    coherenceScore: estimatedBand,
    pronunciationScore: estimatedBand,
    corrections: [],
    vocabularySuggestions: [],
    summary:
      "Transcript was captured, but real AI analysis needs OPENAI_API_KEY on the backend. Add the key and run the full app again for grammar corrections and IELTS scoring.",
    nextSteps: ["Set OPENAI_API_KEY in your terminal or .env deployment environment.", "Speak for at least two minutes before ending a session."],
  };
}

server.listen(port, () => {
  console.log(`Learner2Learner server running on http://127.0.0.1:${port}`);
});
