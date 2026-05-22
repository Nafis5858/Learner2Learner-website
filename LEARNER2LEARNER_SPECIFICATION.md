# Learner2Learner - Complete Project Specification

## 🎯 Project Overview

**Learner2Learner** is an English learning platform that combines real-time voice conversations with AI-powered feedback. The unique value proposition is:

> "The ONLY platform where learners practice with REAL people (to overcome fear and build confidence) AND get detailed AI feedback after every call (to identify mistakes and track improvement)."

This solves two major problems:
- **AI apps (ChatGPT, Gemini)**: Safe practice but doesn't overcome fear of real people
- **Random chat apps (HelloTalk, Tandem)**: Real conversations but zero AI feedback

---

## 📁 Project Structure

```
learner2learner/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main app component
│   │   ├── routes.tsx                 # Route definitions
│   │   ├── components/
│   │   │   ├── AppLayout.tsx          # Main layout with sidebar
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx
│   │   │   └── ui/                    # UI components (if any)
│   │   ├── pages/
│   │   │   ├── Landing.tsx            # Public landing page
│   │   │   ├── Auth.tsx               # Signup/Login
│   │   │   ├── Dashboard.tsx          # User dashboard
│   │   │   ├── FindPartner.tsx        # Browse voice rooms
│   │   │   ├── ActiveCall.tsx         # Live voice room
│   │   │   ├── FeedbackReview.tsx     # AI feedback after call
│   │   │   ├── Progress.tsx           # Progress tracking
│   │   │   └── Profile.tsx            # User profile
│   │   ├── lib/
│   │   │   └── auth.ts                # Auth utilities (mock)
│   │   └── styles/
│   │       ├── theme.css              # Design tokens
│   │       ├── fonts.css              # Font imports
│   │       └── global.css             # Global styles
│   └── imports/                       # Static assets (images, logos)
├── package.json
├── tailwind.config.js (v4)
└── vite.config.ts
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts
- **Package Manager**: pnpm

### Fonts
- **Headings**: Fraunces (serif) - Google Fonts
- **Body Text**: Figtree (sans-serif) - Google Fonts
- **Monospace**: JetBrains Mono - Google Fonts

### Backend (To Be Implemented)
- **Authentication**: Supabase Auth or Firebase Auth
- **Database**: PostgreSQL (Supabase) or Firebase Firestore
- **Real-time Voice**: WebRTC + Socket.io OR Agora.io OR Daily.co
- **AI Feedback**: OpenAI GPT-4 API or Claude API
- **Speech-to-Text**: OpenAI Whisper API or AssemblyAI
- **File Storage**: Supabase Storage or AWS S3

---

## 📄 Pages & Features

### 1. Landing Page (`/`)
**Purpose**: Public marketing page to convert visitors into users

**Sections**:
- **Navigation Bar**
  - Logo (Learner2Learner)
  - Value prop badge: "Real People + AI Feedback"
  - Links: Features, How It Works, AI Feedback, Pricing
  - CTA buttons: "Sign in" and "Start for Free"

- **Hero Section**
  - Headline: "Talk to real people. Get AI feedback. Improve faster."
  - Value prop callout box
  - Photo grid (conversation images)
  - CTA button: "Start a Conversation"
  - Stats: 150+ countries, 2.4M+ conversations, 4.9★ rating

- **Stats Bar**
  - 127,440 Active Learners
  - 154 Countries Represented
  - 3.2M Conversations This Month
  - +1.5 Bands Average IELTS Improvement

- **Problem/Solution Section** (MASSIVE)
  - 3-column comparison:
    1. ❌ AI Apps Only (ChatGPT, Gemini, Claude) - explains the problem
    2. ❌ Random Chat Apps (HelloTalk, Tandem, Omegle) - explains the problem
    3. ✅ Learner2Learner - the complete solution
  - Shows why ChatGPT can't overcome fear
  - Shows why HelloTalk can't show mistakes
  - Emphasizes Learner2Learner gives BOTH

- **Features Section**
  - Card 1: "Talk to Real People" - real humans, not AI bots
  - Card 2: "Face Your Fear & Anxiety" - practice with real people
  - Card 3: "Get Detailed Feedback" - AI reviews with IELTS scores
  - Each card has image, icon, description

- **How It Works** (3 steps)
  - Step 1: Find a Partner (match in 30 seconds)
  - Step 2: Have a Real Conversation (10-30 min voice call)
  - Step 3: Get AI Feedback (grammar, vocabulary, IELTS score)

- **AI Feedback Demo**
  - Left: Conversation transcript with highlighted errors
  - Right: Tabbed interface (Corrections, Vocabulary, IELTS Score)
  - Shows real example of AI catching mistakes

- **Testimonials**
  - 3 user stories with photos
  - Each shows: Before/After IELTS band, what they tried before Learner2Learner
  - "Before: Used AI apps only" badges
  - Emphasizes how Learner2Learner solved their problem

- **Final CTA Section**
  - "Stop choosing between safe AI practice and real conversations"
  - Dual value prop: Real people ✓ + AI feedback ✓
  - "Start Your First Real Conversation" button

- **Footer**
  - Logo with value prop badge
  - Links: Product, Company, Support, Legal
  - Copyright info

**Key Features**:
- Smooth scroll animations (slideUp, slideInLeft, slideInRight, float, pulse)
- Sticky navigation with blur on scroll
- Interactive demo tabs for AI feedback
- Responsive grid layouts
- Gradient backgrounds and blob animations

---

### 2. Auth Page (`/auth`)
**Purpose**: User signup and login

**Layout**: 2-column on desktop
- **Left Side** (desktop only): Value proposition panel
  - "Why 127,000+ learners chose Learner2Learner"
  - ❌ AI Apps problem explanation
  - ❌ Random Chat Apps problem explanation
  - ✅ Learner2Learner solution
  - Testimonial from user

- **Right Side**: Auth form
  - Mode toggle: "Create Account" / "Sign In"
  - Signup fields:
    - Full Name
    - Country (dropdown)
    - Native Language (dropdown)
    - Current English Level (A1-C2)
    - Email
    - Password (with show/hide toggle)
  - Login fields:
    - Email
    - Password
  - Submit button with loading state
  - "Continue with Google" button
  - Toggle between signup/login

**Mock Implementation**:
- Currently stores user in localStorage
- No real authentication
- Creates user object with default data

**Real Implementation Needed**:
- Supabase Auth or Firebase Auth
- Email verification
- OAuth (Google Sign-In)
- Password reset flow
- Form validation with error messages
- Rate limiting

---

### 3. Dashboard (`/home`)
**Purpose**: User's main hub after login

**Sections**:
- **Hero Banner**
  - Greeting: "Good morning/afternoon/evening, [Name]!"
  - Streak display if active
  - Large "Start Talking Now" CTA with shimmer effect
  - Background: conversation image with gradient overlay

- **Stats Cards** (4 columns)
  1. Total Sessions - conversation count
  2. Hours Practiced - total minutes converted to hours
  3. Current IELTS Band - with target display
  4. Current Streak - days in a row

- **IELTS Progress Chart** (2/3 width)
  - Line chart showing band score over time
  - Responsive Recharts component
  - Data points: Feb to May (8 points)
  - Custom tooltip on hover

- **Global Reach Card** (1/3 width)
  - Countries spoken with (flag pills)
  - Progress bar to target band
  - "Goal reached!" if target met

- **Recent Sessions List**
  - Last 4 conversations
  - Shows: partner photo, name, country, topic, duration, band score, errors, date
  - Click to view feedback

- **Live Rooms** (sidebar)
  - 4 currently active rooms
  - Shows: room name, topic, participants, level
  - "See All Rooms" button

- **AI Coach Card**
  - Personalized tip based on recent sessions
  - "View tips" link to Progress page

**Data Required**:
- User stats: totalSessions, totalMinutes, currentBand, targetBand, streak
- Countries connected
- Band history over time
- Recent session data
- Live room data (real-time)

---

### 4. Find Partner (`/find-partner`)
**Purpose**: Browse and join voice rooms

**Layout**:
- **Hero Banner**
  - "Find Your Conversation Partner"
  - Value prop badge: "Real People + AI Feedback = Better Results"
  - Active users count: "1,240 learners are practicing right now"

- **Filter Bar**
  - Search by topic
  - Filter by level (A1-C2)
  - Filter by max participants
  - "Create Room" button

- **Room Grid**
  - 8 voice rooms displayed
  - Each room shows:
    - Room name + emoji
    - Topic
    - Host info
    - Participant avatars (stacked)
    - Current/Max participants
    - Level badge
    - "Join Room" button
  - Hover effects

**Room Data Structure**:
```typescript
{
  name: string
  topic: string
  level: string
  participants: Participant[]
  maxParticipants: number
  host: { name: string, flag: string }
}
```

**Features**:
- Real participant photos (Unsplash + user uploads)
- Live participant count updates
- Filter/search functionality
- Create custom room (host mode)

**Real Implementation**:
- WebSocket connection for live room updates
- Real-time participant join/leave events
- Room creation with settings
- Search/filter backend API

---

### 5. Active Call (`/active-call`)
**Purpose**: Live voice room interface

**Layout**:
- **Top Bar**
  - Red "LIVE" indicator (pulsing)
  - Room name, topic, level
  - Participant count
  - Join requests badge (host only)
  - "AI is taking notes" indicator
  - Timer (MM:SS)

- **Main Area**
  - Participants grid (3-6 columns)
  - Each participant:
    - Avatar (photo or emoji)
    - Name
    - Speaking indicator (ring animation + mic badge)
    - Muted indicator if applicable
    - Host crown if applicable
    - Click to kick (host only)

- **Empty Slots**
  - Dashed circles for available spots

- **Topic Suggestion Card** (when active)
  - Suggested conversation topic
  - "Next" button for host to cycle topics
  - Visible to all when host sets

- **Control Bar**
  - Raise Hand button
  - Transcript toggle button (MessageSquare icon)
  - Mute/Unmute button (primary, larger)
  - Leave Room button (red)
  - Topic Suggestion button (host only)
  - Settings button (host only)

- **Live Transcript Panel** (right sidebar, toggle-able)
  - Header: "Live Transcript"
  - Error count badge
  - Scrolling message feed
  - Each message shows:
    - Speaker name + flag
    - Message text
    - Highlighted errors (underlined in amber)
    - Error corrections below (bad → good)
    - Grammar note
  - Bottom stats: Your mistakes, People in room

**Features**:
- Simulated speaking rotation (cycles through participants)
- Real-time transcript updates
- Error highlighting in real-time
- Host controls: accept/reject join requests, kick participants, suggest topics
- Smooth animations for all state changes
- Auto-scroll transcript
- Ending animation → redirect to feedback

**Real Implementation Needed**:
- WebRTC for peer-to-peer audio
- OR use Agora.io / Daily.co / Twilio for managed voice
- Socket.io for signaling and room state
- Speech-to-text (OpenAI Whisper API or AssemblyAI)
- Real-time grammar checking (stream to GPT-4 for live analysis)
- Room permissions (host vs participant)
- Audio visualization (sound wave bars)

---

### 6. Feedback Review (`/feedback`)
**Purpose**: Show AI analysis after conversation

**Sections**:
- **Header**
  - Partner info (name, flag, country)
  - Duration
  - IELTS band score (large display)

- **Tabbed Interface**
  1. **Overview Tab**
     - Summary stats cards
     - Fluency score, Grammar score, Vocabulary score
     - Top mistakes preview

  2. **Corrections Tab**
     - List of all mistakes
     - Each shows: bad → good, grammar note
     - Organized by type (verb tense, plurals, etc.)

  3. **Vocabulary Tab**
     - Original word/phrase → Better suggestion
     - Context explanation
     - Example sentence

  4. **IELTS Breakdown Tab**
     - Overall band score
     - Radar chart (5 dimensions)
     - 4 sub-scores with progress bars:
       - Fluency & Coherence
       - Lexical Resource
       - Grammatical Range & Accuracy
       - Pronunciation

  5. **Transcript Tab**
     - Full conversation playback
     - Both speakers' messages
     - Errors highlighted
     - Timestamps

- **Value Prop Reminder Section**
  - "This is why Learner2Learner works"
  - Explains: practiced with real person + got AI feedback
  - ❌ AI-only apps comparison
  - ❌ Random chat apps comparison

- **Action Buttons**
  - Save to Progress
  - Practice Again
  - Share Results

**Real Implementation**:
- OpenAI GPT-4 API call with conversation transcript
- Prompt engineering for:
  - Grammar error detection
  - Vocabulary suggestions
  - IELTS band estimation
  - Fluency analysis
  - Pronunciation feedback (if audio analyzed)
- Store feedback in database
- Export/share functionality

---

### 7. Progress Page (`/progress`)
**Purpose**: Track improvement over time

**Sections**:
- **Header**
  - Overall IELTS band (large)
  - Improvement since start
  - Total sessions, hours, streak

- **Band Progress Chart**
  - Line chart over months
  - Shows steady improvement
  - Target line overlay

- **Session History**
  - List of all past conversations
  - Filter by date, partner, topic
  - Click to review feedback

- **Error Patterns Analysis**
  - Most common mistakes
  - Improvement trends
  - Grammar categories needing work

- **Countries Map** (optional)
  - Visual map of countries practiced with
  - Click to filter sessions by country

- **Value Prop Reminder**
  - "This progress is ONLY possible with Learner2Learner"
  - Reinforces dual benefit

**Real Implementation**:
- Aggregate user session data
- Calculate trends and statistics
- Data visualization (charts, graphs)
- Export progress report

---

### 8. Profile Page (`/profile`)
**Purpose**: User settings and account management

**Sections**:
- Personal info (name, country, native language)
- Current English level
- Target IELTS band
- Learning goals
- Account settings (email, password)
- Notification preferences
- Privacy settings
- Delete account

---

## 🎨 Design System

### Colors (CSS Variables in theme.css)
```css
--background: #040810 (dark blue-black)
--foreground: #E5E9F0 (off-white)
--card: #0D1428 (dark blue)
--primary: #4B7EFA (blue)
--accent: #00D8A6 (teal/green)
--secondary: #141E38 (muted blue)
--muted-foreground: #6B80A8 (blue-gray)
--border: rgba(255, 255, 255, 0.08)
--destructive: (red for errors)
```

### Typography
- Headings: `font-family: 'Fraunces', serif`
- Body: `font-family: 'Figtree', sans-serif`
- Code/Data: `font-family: 'JetBrains Mono', monospace`

### Spacing & Layout
- Max content width: 1280px (max-w-7xl)
- Standard padding: px-6 lg:px-8
- Card border radius: 16px-24px (rounded-2xl, rounded-3xl)
- Standard gap between elements: 4-6 (gap-4, gap-6)

### Animations
```css
@keyframes slideUp
@keyframes slideInLeft
@keyframes slideInRight
@keyframes scaleIn
@keyframes float
@keyframes pulse
@keyframes shimmer
@keyframes speakPing
@keyframes soundBar
@keyframes blobDrift1/2/3
```

### UI Patterns
- Glass morphism: `backdrop-blur-lg` with semi-transparent backgrounds
- Gradient overlays on images
- Floating action buttons
- Stacked avatars for participants
- Badge components for status
- Skeleton loading states
- Toast notifications (to be added)

---

## 📊 Data Models

### User
```typescript
{
  id: string
  name: string
  email: string
  country: string
  language: string
  level: string (A1-C2)
  currentBand: number (1-9)
  targetBand: number (1-9)
  totalSessions: number
  totalMinutes: number
  streak: number
  countriesConnected: string[]
  joinedAt: Date
}
```

### Session
```typescript
{
  id: string
  userId: string
  partnerId: string
  roomId: string
  startTime: Date
  endTime: Date
  duration: number (minutes)
  topic: string
  transcript: Message[]
  feedback: Feedback
  bandScore: number
}
```

### Message
```typescript
{
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: Date
  errors?: Error[]
}
```

### Error
```typescript
{
  bad: string
  good: string
  note: string
  type: string (e.g., "verb tense", "plural", "article")
}
```

### Feedback
```typescript
{
  sessionId: string
  overallBand: number
  fluencyScore: number
  grammarScore: number
  vocabularyScore: number
  coherenceScore: number
  pronunciationScore: number
  corrections: Error[]
  vocabularySuggestions: VocabSuggestion[]
  summary: string
}
```

### VocabSuggestion
```typescript
{
  original: string
  better: string
  context: string
  example: string
}
```

### Room
```typescript
{
  id: string
  name: string
  topic: string
  level: string
  hostId: string
  participants: Participant[]
  maxParticipants: number
  isActive: boolean
  createdAt: Date
}
```

### Participant
```typescript
{
  id: string
  name: string
  flag: string
  country: string
  isHost: boolean
  isMuted: boolean
  photo?: string
}
```

---

## 🔐 Authentication Flow

### Current (Mock)
1. User fills signup form
2. Data stored in localStorage as JSON
3. On login, check localStorage
4. User object retrieved for session

### Real Implementation

**Signup Flow**:
1. User submits form
2. Validate input (client + server)
3. Create account with Supabase Auth
4. Send verification email
5. User verifies email
6. Create user profile in database
7. Redirect to dashboard

**Login Flow**:
1. User enters email/password
2. Authenticate with Supabase
3. Check email verified
4. Fetch user profile from database
5. Store session token
6. Redirect to dashboard

**OAuth Flow** (Google):
1. User clicks "Continue with Google"
2. Redirect to Google OAuth
3. Google returns with token
4. Create/update user profile
5. Store session
6. Redirect to dashboard

**Session Management**:
- JWT tokens stored in httpOnly cookies
- Refresh token rotation
- Auto-logout on expiry
- "Remember me" option

---

## 🗣️ Voice Room Implementation

### WebRTC Architecture

**Option 1: Peer-to-Peer (Harder)**
- Use WebRTC directly
- Implement STUN/TURN servers
- Mesh topology for small groups
- Signaling server with Socket.io

**Option 2: Managed Service (Recommended)**
- **Agora.io**: Professional, scales well, recording built-in
- **Daily.co**: Simple API, good for MVP
- **Twilio Programmable Voice**: Enterprise-grade
- **LiveKit**: Open-source alternative

### Recommended: Agora.io

**Setup**:
1. Create Agora account
2. Get App ID and Token
3. Install Agora SDK
4. Implement join/leave room
5. Handle mute/unmute
6. Manage participants
7. Record audio for transcription

**Flow**:
1. User clicks "Join Room"
2. Backend generates Agora token for room
3. Frontend joins Agora channel with token
4. Audio streams to all participants
5. Record audio stream to cloud storage
6. On call end, send audio to transcription

---

## 🤖 AI Features Implementation

### Speech-to-Text

**Option 1: OpenAI Whisper API**
```javascript
// Send audio file to Whisper
const transcript = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "en",
  response_format: "verbose_json",
  timestamp_granularities: ["word"]
})
```

**Option 2: AssemblyAI**
- Better for real-time transcription
- Speaker diarization (who said what)
- Word-level timestamps

### Grammar & Feedback Analysis

**GPT-4 Prompt Example**:
```
You are an expert English teacher and IELTS examiner. 

Analyze this conversation transcript between English learners:

[TRANSCRIPT]
Speaker A (Native: Spanish): "Last week I go to the beach..."
Speaker B (Native: Japanese): "That sounds fun! Did you swimming?"

For Speaker A only:
1. Identify ALL grammar errors
2. For each error, provide:
   - Incorrect phrase
   - Correct phrase
   - Brief explanation
3. Suggest 3-5 vocabulary upgrades
4. Estimate IELTS speaking band (1-9) with subscores:
   - Fluency & Coherence
   - Lexical Resource
   - Grammatical Range & Accuracy
   - Pronunciation (estimate from text if possible)

Return JSON format.
```

**Response Processing**:
```typescript
const feedback = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: transcript }
  ],
  response_format: { type: "json_object" }
})

const analysis = JSON.parse(feedback.choices[0].message.content)
```

---

## 🗄️ Database Schema (PostgreSQL)

### Tables

**users**
```sql
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  topic TEXT,
  band_score DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**session_participants**
```sql
CREATE TABLE session_participants (
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  role TEXT, -- 'host' or 'participant'
  PRIMARY KEY (session_id, user_id)
);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**errors**
```sql
CREATE TABLE errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  incorrect_text TEXT NOT NULL,
  correct_text TEXT NOT NULL,
  note TEXT,
  error_type TEXT, -- 'verb_tense', 'plural', etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

**feedback**
```sql
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
  created_at TIMESTAMP DEFAULT NOW()
);
```

**vocabulary_suggestions**
```sql
CREATE TABLE vocabulary_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback(id),
  original TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  context TEXT,
  example TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**rooms**
```sql
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
```

---

## 🔄 API Endpoints Needed

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/sessions` - Get user session history

### Rooms
- `GET /api/rooms` - List active rooms (with filters)
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/leave` - Leave room
- `DELETE /api/rooms/:id` - Close room (host only)

### Sessions
- `POST /api/sessions` - Start new session
- `PATCH /api/sessions/:id` - End session
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/transcript` - Get transcript

### Feedback
- `POST /api/feedback/analyze` - Analyze conversation (calls AI)
- `GET /api/feedback/:sessionId` - Get feedback for session
- `GET /api/users/:id/feedback` - Get all feedback for user

### WebRTC/Voice
- `POST /api/voice/token` - Get Agora token for room
- `POST /api/voice/start-recording` - Start recording session
- `POST /api/voice/stop-recording` - Stop recording

### Transcription
- `POST /api/transcription/process` - Send audio for transcription
- `GET /api/transcription/:sessionId` - Get transcription status

---

## 🚀 Deployment Architecture

### Frontend
- **Platform**: Vercel or Netlify
- **Build**: `pnpm build`
- **Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_AGORA_APP_ID`
  - `VITE_API_URL`

### Backend
- **Platform**: Railway, Render, or AWS
- **Runtime**: Node.js (Express) or Next.js API routes
- **Environment Variables**:
  - `DATABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `OPENAI_API_KEY`
  - `AGORA_APP_ID`
  - `AGORA_APP_CERTIFICATE`
  - `ASSEMBLYAI_API_KEY`

### Database
- **Platform**: Supabase (includes auth + storage)
- **Backup**: Daily automated backups
- **Migrations**: Use Prisma or Supabase CLI

### File Storage
- **Platform**: Supabase Storage or AWS S3
- **Use**: Store audio recordings before transcription
- **Retention**: Delete after 30 days (or per user preference)

### Real-time Infrastructure
- **WebSockets**: Socket.io on separate server (or Railway)
- **Voice**: Agora.io (managed service)
- **Scaling**: Auto-scale Socket.io server based on connections

---

## 📱 Mobile Considerations

Current implementation is responsive but web-only.

For native mobile apps:
- React Native version
- Use same backend APIs
- Agora React Native SDK for voice
- Native audio recording permissions
- Push notifications for:
  - Someone joined your room
  - Feedback is ready
  - Streak reminder

---

## 🔍 SEO & Marketing

### Landing Page SEO
- Title: "Learner2Learner - Practice English with Real People + AI Feedback"
- Description: "The only platform combining real voice conversations with AI-powered grammar feedback and IELTS scoring. Overcome your fear of speaking while tracking improvement."
- Keywords: English speaking practice, IELTS preparation, language exchange, AI feedback, English conversation partners

### Meta Tags
```html
<meta property="og:title" content="Learner2Learner" />
<meta property="og:description" content="Practice English with real people and get AI feedback" />
<meta property="og:image" content="/og-image.png" />
```

### Sitemap
- `/` - Landing
- `/auth` - Signup
- `/pricing` - Pricing page
- `/blog` - Blog (future)

---

## 💰 Monetization Strategy

### Freemium Model (Recommended)

**Free Tier**:
- 5 conversations per month
- Basic AI feedback
- Access to public rooms
- IELTS band estimate

**Pro Tier** ($9.99/month):
- Unlimited conversations
- Detailed AI feedback with vocabulary suggestions
- Create private rooms
- Advanced analytics
- Priority matching
- Download feedback reports

**Premium Tier** ($19.99/month):
- Everything in Pro
- 1-on-1 sessions with native speakers
- Personalized learning plan from AI
- Video calls (not just voice)
- Priority customer support

---

## 🧪 Testing Strategy

### Unit Tests
- Utility functions (auth, formatting)
- Component logic
- Data transformations

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests (Playwright)
- User signup flow
- Join room flow
- Complete conversation flow
- Feedback generation flow

### Load Testing
- WebSocket connection limits
- Concurrent voice sessions
- AI API rate limits

---

## 📈 Analytics & Monitoring

### User Analytics
- **Tool**: Mixpanel or PostHog
- **Events to Track**:
  - User signup
  - Room joined
  - Session completed
  - Feedback viewed
  - Streak milestone reached

### Error Monitoring
- **Tool**: Sentry
- **Track**: Frontend errors, API errors, failed AI calls

### Performance Monitoring
- **Tool**: Vercel Analytics or New Relic
- **Metrics**: Page load time, API response time, Voice latency

### Infrastructure Monitoring
- **Tool**: Grafana + Prometheus
- **Metrics**: CPU, Memory, Database connections, Socket.io connections

---

## 🎯 MVP Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Supabase project
- [ ] Implement real authentication
- [ ] Setup PostgreSQL database with schema
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend API to Railway/Render

### Phase 2: Voice Infrastructure (Week 3-4)
- [ ] Integrate Agora.io
- [ ] Implement join room functionality
- [ ] Add mute/unmute controls
- [ ] Test voice quality with multiple users
- [ ] Add room creation

### Phase 3: AI Features (Week 5-6)
- [ ] Integrate OpenAI Whisper for transcription
- [ ] Implement GPT-4 feedback analysis
- [ ] Build feedback UI components
- [ ] Test accuracy of error detection
- [ ] Calculate IELTS band scores

### Phase 4: Polish & Launch (Week 7-8)
- [ ] Add real user photos
- [ ] Implement progress tracking
- [ ] Add analytics
- [ ] Write documentation
- [ ] Beta testing with 20-50 users
- [ ] Launch publicly

### Phase 5: Growth Features (Post-Launch)
- [ ] Mobile apps
- [ ] Video calls
- [ ] Private rooms
- [ ] 1-on-1 matching
- [ ] Payment integration
- [ ] Referral program

---

## 🐛 Known Issues & Future Improvements

### Current Limitations (Mock Version)
- No real authentication
- No real voice calls
- No real AI feedback
- No data persistence (localStorage only)
- No real-time updates
- Static room data

### Future Enhancements
- Video support
- Screen sharing for presentations
- Whiteboard for collaborative learning
- Pronunciation analysis (phoneme-level)
- Custom learning paths
- Community features (friends, follow users)
- Leaderboards
- Achievements/badges
- Export progress as PDF report
- Integration with other language learning tools

---

## 📚 Resources & Documentation

### Design Resources
- Figma Design File: [Link if available]
- Logo Assets: `src/imports/905ec848-acf3-4d5a-8933-c18c0010c52a-removebg-preview.png`
- User Photos: Stored in `src/imports/`

### External Services Documentation
- Supabase: https://supabase.com/docs
- Agora.io: https://docs.agora.io
- OpenAI API: https://platform.openai.com/docs
- AssemblyAI: https://www.assemblyai.com/docs
- Recharts: https://recharts.org

### Code Style
- TypeScript for all new code
- ESLint + Prettier for formatting
- Tailwind for styling (no CSS modules)
- Functional React components (no classes)
- Custom hooks for reusable logic

---

## 🤝 Contributing Guidelines

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] No console.logs in production
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design tested
- [ ] Accessibility checked (ARIA labels)
- [ ] Performance optimized (lazy loading)

### Git Workflow
```bash
# Feature branch
git checkout -b feature/voice-rooms

# Commit with conventional commits
git commit -m "feat: add voice room joining"
git commit -m "fix: resolve audio mute bug"
git commit -m "docs: update API documentation"

# Push and create PR
git push origin feature/voice-rooms
```

---

## 🎓 Learning Path for Developers

If building this from scratch, learn in this order:

1. **React & TypeScript Basics**
   - Functional components
   - Hooks (useState, useEffect, useRef)
   - TypeScript interfaces
   - React Router

2. **Tailwind CSS**
   - Utility classes
   - Responsive design
   - Custom animations
   - Dark mode

3. **Supabase Fundamentals**
   - Authentication
   - Database queries
   - Realtime subscriptions
   - Row-level security

4. **WebRTC Basics** OR **Agora.io SDK**
   - Audio streaming
   - Room management
   - Participant state

5. **OpenAI API**
   - Whisper for transcription
   - GPT-4 for analysis
   - Prompt engineering
   - Token management

6. **Real-time with Socket.io**
   - Event emission
   - Room management
   - Scalability considerations

---

## 🎯 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average sessions per user per week
- Average session duration
- Retention rate (Day 1, Day 7, Day 30)

### Platform Health
- Average time to match with partner
- Voice call quality (packet loss, latency)
- AI feedback accuracy (user ratings)
- Error rate in transcription

### Business Metrics
- Conversion rate (free → paid)
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)

---

## 📞 Support & Contact

For questions about this specification:
- Technical: [Your email or support channel]
- Business: [Business email]
- Bug Reports: GitHub Issues

---

**Last Updated**: May 22, 2026
**Version**: 1.0
**Status**: Ready for Development

---

Good luck building Learner2Learner! 🚀
