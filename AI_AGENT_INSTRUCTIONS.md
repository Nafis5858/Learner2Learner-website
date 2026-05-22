# AI Agent Build Instructions for Learner2Learner

## Quick Start Guide for AI Developers/Agents

This document provides step-by-step instructions for rebuilding Learner2Learner as a fully functional platform.

---

## What You're Building

**Product**: Learner2Learner - English learning platform combining:
1. **Real-time voice conversations** with learners worldwide
2. **AI-powered feedback** after each call (grammar, vocabulary, IELTS scores)

**Unique Value**: The ONLY platform giving both real human practice AND AI feedback

---

## Tech Stack Requirements

### Must Use
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Backend**: Node.js + Express (or Next.js API routes)
- **Database**: PostgreSQL (via Supabase recommended)
- **Auth**: Supabase Auth or Firebase Auth
- **Voice**: Agora.io (recommended) or Daily.co or Twilio
- **AI**: OpenAI API (Whisper + GPT-4) or Claude API
- **Real-time**: Socket.io for room state

### Package Versions
```json
{
  "react": "^18.3.1",
  "react-router": "^7.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "recharts": "^2.0.0",
  "lucide-react": "latest",
  "socket.io-client": "^4.0.0"
}
```

---

## Build Priority Order

### Step 1: Setup Foundation (Day 1)
```bash
# 1. Initialize project
npm create vite@latest learner2learner -- --template react-ts
cd learner2learner
npm install

# 2. Install dependencies
npm install react-router tailwindcss postcss autoprefixer
npm install lucide-react recharts
npm install socket.io-client

# 3. Setup Tailwind v4
npx tailwindcss init -p

# 4. Setup Supabase
npm install @supabase/supabase-js
```

**Create**:
- `/src/lib/supabase.ts` - Supabase client
- `/src/lib/auth.ts` - Auth utilities
- `/src/styles/theme.css` - Design tokens (copy from current project)
- `/src/styles/fonts.css` - Font imports

### Step 2: Build Authentication (Day 2)

**Database Setup** (Supabase SQL Editor):
```sql
-- Run this in Supabase SQL Editor
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  native_language TEXT NOT NULL,
  current_level TEXT NOT NULL,
  current_band DECIMAL DEFAULT 5.0,
  target_band DECIMAL DEFAULT 7.0,
  total_sessions INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_session_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

**Build Auth Pages**:
- Copy `/src/app/pages/Auth.tsx` from current project
- Update to use real Supabase auth:
```typescript
// src/lib/auth.ts
import { supabase } from './supabase'

export async function signUp(email: string, password: string, userData: any) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (authError) throw authError
  
  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      ...userData
    })
    
  if (profileError) throw profileError
  
  return authData.user
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data.user
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return profile
}
```

### Step 3: Build Voice Infrastructure (Day 3-4)

**Setup Agora.io**:
1. Create account at agora.io
2. Create project, get App ID and Certificate
3. Install SDK:
```bash
npm install agora-rtc-sdk-ng
```

**Implement Voice Room**:
```typescript
// src/lib/agora.ts
import AgoraRTC from 'agora-rtc-sdk-ng'

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

export async function joinRoom(
  appId: string,
  channel: string,
  token: string,
  uid: string
) {
  await client.join(appId, channel, token, uid)
  
  // Create local audio track
  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
  
  // Publish to channel
  await client.publish([localAudioTrack])
  
  // Listen for remote users
  client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType)
    if (mediaType === 'audio') {
      user.audioTrack?.play()
    }
  })
  
  return { client, localAudioTrack }
}

export async function leaveRoom(client: any, localAudioTrack: any) {
  localAudioTrack?.close()
  await client.leave()
}
```

**Backend API** for tokens:
```typescript
// api/voice/token.ts
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

export async function generateAgoraToken(
  channelName: string,
  uid: string
) {
  const appId = process.env.AGORA_APP_ID!
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!
  const role = RtcRole.PUBLISHER
  const expirationTimeInSeconds = 3600
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
  
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  )
  
  return token
}
```

### Step 4: Build Real-time Room State (Day 5)

**Backend Socket.io Server**:
```typescript
// server.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// Store active rooms in memory (use Redis in production)
const rooms = new Map()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  socket.on('join-room', ({ roomId, userId, userName, userFlag }) => {
    socket.join(roomId)
    
    // Add user to room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: [] })
    }
    
    const room = rooms.get(roomId)
    room.participants.push({ id: userId, name: userName, flag: userFlag, socketId: socket.id })
    
    // Notify others
    io.to(roomId).emit('user-joined', { userId, userName, userFlag })
    
    // Send current participants
    socket.emit('room-state', room)
  })
  
  socket.on('leave-room', ({ roomId, userId }) => {
    socket.leave(roomId)
    
    const room = rooms.get(roomId)
    if (room) {
      room.participants = room.participants.filter(p => p.id !== userId)
      io.to(roomId).emit('user-left', { userId })
    }
  })
  
  socket.on('send-message', ({ roomId, message }) => {
    io.to(roomId).emit('new-message', message)
  })
  
  socket.on('disconnect', () => {
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      const participant = room.participants.find(p => p.socketId === socket.id)
      if (participant) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id)
        io.to(roomId).emit('user-left', { userId: participant.id })
      }
    })
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.io server running on port 3001')
})
```

**Frontend Socket.io Client**:
```typescript
// src/lib/socket.ts
import { io } from 'socket.io-client'

const socket = io(process.env.VITE_SOCKET_URL || 'http://localhost:3001')

export function joinRoom(roomId: string, userId: string, userName: string, userFlag: string) {
  socket.emit('join-room', { roomId, userId, userName, userFlag })
}

export function leaveRoom(roomId: string, userId: string) {
  socket.emit('leave-room', { roomId, userId })
}

export function sendMessage(roomId: string, message: any) {
  socket.emit('send-message', { roomId, message })
}

export function onUserJoined(callback: (data: any) => void) {
  socket.on('user-joined', callback)
}

export function onUserLeft(callback: (data: any) => void) {
  socket.on('user-left', callback)
}

export function onNewMessage(callback: (data: any) => void) {
  socket.on('new-message', callback)
}

export default socket
```

### Step 5: Implement AI Features (Day 6-7)

**Speech-to-Text (Whisper API)**:
```typescript
// api/transcription/transcribe.ts
import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(audioFilePath: string) {
  const transcript = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  })
  
  return transcript
}
```

**Grammar Analysis & IELTS Scoring**:
```typescript
// api/feedback/analyze.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function analyzeConversation(userId: string, transcript: string) {
  const systemPrompt = `You are an expert IELTS examiner and English teacher.

Analyze this conversation transcript and provide detailed feedback for the user.

Return a JSON object with this structure:
{
  "overallBand": 6.5,
  "subscores": {
    "fluency": 7.0,
    "grammar": 6.0,
    "vocabulary": 6.5,
    "coherence": 7.0,
    "pronunciation": 6.5
  },
  "errors": [
    {
      "incorrect": "I go to the beach",
      "correct": "I went to the beach",
      "note": "Use simple past tense for completed actions",
      "type": "verb_tense"
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "very delicious",
      "better": "exquisite",
      "context": "More sophisticated word for fine food",
      "example": "The pasta was exquisite."
    }
  ],
  "summary": "Your fluency is strong, but focus on consistent past tense usage."
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this transcript:\n\n${transcript}` }
    ],
    response_format: { type: 'json_object' }
  })
  
  const feedback = JSON.parse(response.choices[0].message.content!)
  
  // Save to database
  await saveFeedbackToDatabase(userId, feedback)
  
  return feedback
}
```

### Step 6: Database Schema (All Tables)

**Run in Supabase SQL Editor**:
```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  room_id UUID,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  topic TEXT,
  band_score DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Errors table
CREATE TABLE errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  incorrect_text TEXT NOT NULL,
  correct_text TEXT NOT NULL,
  note TEXT,
  error_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  overall_band DECIMAL,
  fluency_score DECIMAL,
  grammar_score DECIMAL,
  vocabulary_score DECIMAL,
  coherence_score DECIMAL,
  pronunciation_score DECIMAL,
  summary TEXT,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary suggestions table
CREATE TABLE vocabulary_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback(id),
  original TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  context TEXT,
  example TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  host_id UUID REFERENCES users(id),
  max_participants INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Add policies (users can read their own data)
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
```

### Step 7: Copy UI Components (Day 8)

Copy these files AS-IS from the current project:
- All pages in `/src/app/pages/`
- All components in `/src/app/components/`
- All styles in `/src/app/styles/`
- Logo and images from `/src/imports/`

Then update to use real APIs instead of mock data.

---

## Critical Integration Points

### 1. Recording Audio During Call

**Option A: Record on Backend** (Recommended)
```typescript
// When user joins room, start recording via Agora Recording SDK
// Save to S3/Supabase Storage
// When call ends, send to Whisper API
```

**Option B: Record on Frontend**
```typescript
// Use MediaRecorder API
const recorder = new MediaRecorder(stream)
recorder.ondataavailable = (e) => {
  chunks.push(e.data)
}
recorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' })
  await uploadToServer(blob)
}
```

### 2. Real-time Transcript in Active Call

**Approach**: Stream audio chunks to backend every 5 seconds
```typescript
// Frontend: Send audio chunks via Socket.io
socket.emit('audio-chunk', { roomId, chunk: audioBlob })

// Backend: Accumulate and transcribe
socket.on('audio-chunk', async ({ roomId, chunk }) => {
  // Transcribe chunk with Whisper
  const text = await transcribeChunk(chunk)
  
  // Send back to room
  io.to(roomId).emit('new-transcript', { text, timestamp: Date.now() })
})
```

### 3. Linking Everything Together

**Complete User Flow**:
```
1. User signs up → Supabase Auth → User profile created in DB
2. User joins room → Socket.io connects → Agora joins voice channel
3. Audio streams → Agora handles → Backend records
4. Every 5s → Audio chunk sent → Whisper transcribes → Transcript shown live
5. User leaves → Recording stops → Full audio sent to Whisper
6. Full transcript sent to GPT-4 → Analysis returned → Saved to DB
7. User sees feedback → Rendered from DB data
```

---

## Environment Variables

Create `.env` file:
```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Agora
VITE_AGORA_APP_ID=abc123
AGORA_APP_CERTIFICATE=def456

# OpenAI
OPENAI_API_KEY=sk-xxx

# AssemblyAI (alternative to Whisper)
ASSEMBLYAI_API_KEY=xxx

# Socket.io
VITE_SOCKET_URL=http://localhost:3001

# Backend API
VITE_API_URL=http://localhost:3000
```

---

## Deployment Checklist

### Frontend (Vercel)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Create new service
2. Connect to GitHub repo
3. Add environment variables
4. Set start command: `node server.js`
5. Deploy

### Database (Supabase)
1. Already handled if using Supabase
2. Enable connection pooling for production
3. Set up daily backups

### Voice (Agora)
1. Enable recording in Agora console
2. Set up S3 bucket for recordings
3. Configure webhook for recording completion

---

## Testing the Build

### Manual Test Checklist
- [ ] Sign up new user
- [ ] Log in existing user
- [ ] Create a voice room
- [ ] Join voice room with 2+ users
- [ ] Hear other participants
- [ ] See live transcript appear
- [ ] Leave room
- [ ] View AI feedback
- [ ] Check IELTS score accuracy
- [ ] Check error corrections
- [ ] View progress page
- [ ] All charts render correctly

### Load Test
```bash
# Test 100 concurrent users
npx artillery quick --count 100 --num 10 http://localhost:3000/api/rooms
```

---

## Common Issues & Solutions

### Issue: Audio not working
**Solution**: Check Agora token generation, ensure HTTPS in production

### Issue: Transcription slow
**Solution**: Use AssemblyAI real-time API instead of Whisper batch processing

### Issue: Socket.io disconnects
**Solution**: Implement reconnection logic:
```typescript
socket.on('disconnect', () => {
  setTimeout(() => socket.connect(), 1000)
})
```

### Issue: High OpenAI costs
**Solution**: 
- Cache common corrections
- Use GPT-3.5-turbo for simple tasks
- Batch multiple sessions before analysis

---

## Cost Estimation

### Monthly Costs (1000 active users)
- **Supabase**: $25/month (Pro plan)
- **Agora.io**: ~$50-100/month (10,000 minutes free, then $0.99/1000 min)
- **OpenAI API**: ~$150/month (Whisper $0.006/min + GPT-4 $0.03/1k tokens)
- **Hosting**: $20-50/month (Vercel + Railway)
- **Total**: ~$250-325/month

### At Scale (10,000 users)
- **Agora**: ~$500/month
- **OpenAI**: ~$1,500/month
- **Infrastructure**: ~$200/month
- **Total**: ~$2,200/month

---

## Success Criteria

### MVP is Complete When:
- [ ] Users can sign up and log in
- [ ] Users can join voice rooms
- [ ] Voice quality is acceptable (< 200ms latency)
- [ ] Transcription accuracy > 85%
- [ ] AI feedback is generated within 60 seconds of call ending
- [ ] IELTS scores are reasonably accurate
- [ ] UI is responsive on mobile
- [ ] No critical bugs in production

---

## Next Steps After MVP

1. **Beta Launch**: 50-100 users for 2 weeks
2. **Collect Feedback**: Survey + analytics
3. **Iterate**: Fix bugs, improve AI accuracy
4. **Add Payments**: Stripe integration
5. **Marketing**: Launch on Product Hunt
6. **Scale**: Optimize infrastructure
7. **Mobile Apps**: React Native versions

---

## Support

If stuck, refer to:
- Main spec: `LEARNER2LEARNER_SPECIFICATION.md`
- Agora docs: https://docs.agora.io
- Supabase docs: https://supabase.com/docs
- OpenAI docs: https://platform.openai.com/docs

---

**Remember**: Build iteratively. Don't try to do everything at once. Focus on getting voice calls + basic transcription working first, then add AI features.

Good luck! 🚀
