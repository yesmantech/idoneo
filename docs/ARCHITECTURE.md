# Architecture

> System design documentation for the Idoneo platform

This document provides an in-depth look at the architecture, major components, data flow, and key design decisions of the Idoneo application.

---

## Table of Contents

- [System Overview](#system-overview)
- [Major Components](#major-components)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Authentication Model](#authentication-model)
- [Error Handling Strategy](#error-handling-strategy)
- [Observability & Logging](#observability--logging)
- [Key Design Decisions](#key-design-decisions)

---

## System Overview

```mermaid
flowchart TB
    subgraph Users["End Users"]
        Web["Web Browser (PWA)"]
        Mobile["iOS App"]
    end
    
    subgraph Frontend["Frontend (React SPA)"]
        Router["React Router"]
        Pages["Page Components"]
        Components["UI Components"]
        Contexts["Context Providers"]
        Services["Service Layer"]
        Hooks["Custom Hooks"]
    end
    
    subgraph Native["Native Layer (Capacitor)"]
        Haptics["Haptics API"]
        Push["Push Notifications"]
        StatusBar["Status Bar"]
        Keyboard["Keyboard"]
    end
    
    subgraph Backend["Supabase Backend"]
        Auth["Supabase Auth"]
        DB["PostgreSQL"]
        RLS["Row Level Security"]
        Storage["File Storage"]
        Triggers["Database Triggers"]
        Functions["Edge Functions"]
    end
    
    subgraph Offline["Offline Layer"]
        IDB["IndexedDB"]
        SW["Service Worker"]
    end
    
    Users --> Frontend
    Mobile --> Native
    Frontend --> Services
    Services --> Backend
    Services --> Offline
    Native --> Services
```

### Architecture Principles

1. **Offline-First**: Core quiz functionality works without network connectivity
2. **Mobile-First**: UI designed for touch devices, responsive to desktop
3. **Progressive Enhancement**: PWA features enhance the experience on capable devices
4. **Server-Side Security**: All data access controlled by PostgreSQL RLS policies

---

## Major Components

### Frontend Layer

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **App.tsx** | `src/App.tsx` | Route definitions, provider hierarchy |
| **Context Providers** | `src/context/` | Global state (auth, theme, sidebar, onboarding) |
| **Page Components** | `src/app/` | Route-specific UI and data fetching |
| **Shared Components** | `src/components/` | Reusable UI building blocks |
| **Services** | `src/lib/` | Business logic, API calls, algorithms |
| **Hooks** | `src/hooks/` | Reusable stateful logic |

### Service Layer (`src/lib/`)

```mermaid
graph LR
    subgraph Core["Core Services"]
        Supabase["supabaseClient"]
        Errors["supabaseErrors"]
    end
    
    subgraph Quiz["Quiz Domain"]
        Smart["quiz-smart-selection"]
        Offline["offlineService"]
    end
    
    subgraph Gamification["Gamification"]
        XP["xpService"]
        Streak["streakService"]
        Badge["badgeService"]
    end
    
    subgraph Analytics["Analytics & Stats"]
        Stats["statsService"]
        Insight["insightService"]
        Leaderboard["leaderboardService"]
    end
    
    subgraph Social["Social"]
        Friend["friendService"]
        Account["accountService"]
    end
    
    Core --> Quiz
    Core --> Gamification
    Core --> Analytics
    Core --> Social
```

### Context Provider Hierarchy

```tsx
<ThemeProvider>           // Dark/light mode
  <AuthProvider>          // User session & profile
    <SidebarProvider>     // Mobile sidebar state
      <OnboardingProvider>// First-time user tour
        <SpotlightProvider>// Feature highlights
          <App />
        </SpotlightProvider>
      </OnboardingProvider>
    </SidebarProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## Data Flow

### Quiz Attempt Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as QuizRunnerPage
    participant S as Supabase
    participant T as DB Trigger
    participant L as Leaderboard
    
    U->>R: Start Quiz
    R->>S: Create quiz_attempt (status: in_progress)
    
    loop For each question
        U->>R: Select answer
        R->>R: Store in local state
    end
    
    U->>R: Submit Quiz
    R->>S: Update quiz_attempt (answers, score, finished_at)
    S->>T: After UPDATE trigger fires
    T->>L: Update concorso_leaderboard
    T->>L: Award XP to leaderboard_xp
    R->>U: Show results page
```

### Leaderboard Score Calculation

The `concorso_leaderboard` table stores a composite score calculated from 5 factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Volume** | 20% | Total correct answers |
| **Accuracy** | 25% | Correct / Total ratio |
| **Recency** | 20% | More weight to recent attempts |
| **Coverage** | 20% | Subject diversity |
| **Reliability** | 15% | Consistency over time |

```sql
-- Calculated by database trigger on quiz_attempts insert/update
composite_score = (
    volume_score * 0.20 +
    accuracy_score * 0.25 +
    recency_score * 0.20 +
    coverage_score * 0.20 +
    reliability_score * 0.15
)
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    categories ||--o{ roles : contains
    roles ||--o{ quizzes : has
    roles ||--o{ role_resources : has
    quizzes ||--o{ subjects : has
    quizzes ||--o{ quiz_subject_rules : configures
    subjects ||--o{ questions : contains
    quizzes ||--o{ quiz_attempts : generates
    
    profiles ||--o{ quiz_attempts : makes
    profiles ||--o{ xp_events : earns
    profiles ||--o{ user_badges : unlocks
    profiles ||--o{ friendships : has
    
    seasons ||--o{ leaderboard_xp : tracks
    quizzes ||--o{ concorso_leaderboard : ranks
    
    categories {
        uuid id PK
        string slug
        string title
        boolean is_featured
        boolean is_new
    }
    
    roles {
        uuid id PK
        uuid category_id FK
        string slug
        string title
        string available_positions
    }
    
    quizzes {
        uuid id PK
        uuid role_id FK
        string title
        string slug
        boolean is_official
        integer year
    }
    
    questions {
        uuid id PK
        uuid quiz_id FK
        uuid subject_id FK
        text text
        string correct_option
        text explanation
    }
    
    quiz_attempts {
        uuid id PK
        uuid quiz_id FK
        uuid user_id FK
        integer score
        jsonb answers
        boolean is_idoneo
        integer xp
    }
    
    profiles {
        uuid id PK
        string nickname
        integer streak_current
        integer streak_max
        timestamp last_active_at
    }
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `categories` | Top-level contest categories (Polizia, Carabinieri, etc.) |
| `roles` | Specific roles within categories (Allievo Agente, Maresciallo, etc.) |
| `quizzes` | Individual quiz/exam definitions |
| `subjects` | Subject areas within a quiz (Italiano, Storia, etc.) |
| `questions` | Multiple choice questions with explanations |
| `quiz_attempts` | User's quiz session with answers and score |
| `profiles` | Extended user profile with gamification data |
| `concorso_leaderboard` | Per-quiz skill rankings |
| `leaderboard_xp` | Global XP rankings by season |
| `seasons` | Weekly XP season definitions |

---

## Authentication Model

### Supabase Auth + RLS

```mermaid
flowchart LR
    subgraph Client
        Login["LoginPage"]
        AuthCtx["AuthContext"]
    end
    
    subgraph Supabase
        Auth["Supabase Auth"]
        JWT["JWT Token"]
        RLS["RLS Policies"]
    end
    
    Login -->|"signInWithOtp(email)"| Auth
    Auth -->|"Magic Link"| User
    User -->|"Click Link"| Auth
    Auth -->|"JWT"| AuthCtx
    AuthCtx -->|"JWT in headers"| RLS
    RLS -->|"Filter by user_id"| Data
```

### Access Control

| Role | Description | Access |
|------|-------------|--------|
| **Anonymous** | Not logged in | Read public data (categories, quizzes, questions) |
| **Authenticated** | Logged in user | Own attempts, profile, leaderboard participation |
| **Admin** | `profiles.role = 'admin'` | Full CRUD on all tables |

### RLS Policy Example

```sql
-- Users can only see their own attempts
CREATE POLICY "Users can view own attempts"
ON quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can create own attempts"
ON quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Error Handling Strategy

### Client-Side Error Boundaries

```tsx
// Wrap app in ErrorBoundary to catch React errors
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Supabase Error Handling

```typescript
// src/lib/supabaseErrors.ts
export function handleSupabaseError(error: PostgrestError): string {
  // Map database errors to user-friendly messages
  switch (error.code) {
    case '23505': return 'This record already exists';
    case '23503': return 'Referenced record not found';
    case 'PGRST116': return 'No data found';
    default: return 'An unexpected error occurred';
  }
}
```

### Error Categories

| Category | Handling |
|----------|----------|
| **Network Errors** | Retry with exponential backoff, show offline indicator |
| **Auth Errors** | Redirect to login, clear session |
| **Database Errors** | Log to console, show user-friendly message |
| **Validation Errors** | Show inline field errors |

---

## Observability & Logging

### Analytics (Google Analytics 4)

```typescript
// src/lib/analytics.ts
analytics.trackEvent('quiz_completed', {
  quiz_id: quizId,
  score: score,
  duration_seconds: duration,
  is_idoneo: isPassing
});
```

### Tracked Events

| Event | Description |
|-------|-------------|
| `page_view` | Page navigation |
| `quiz_started` | User begins a quiz |
| `quiz_completed` | User finishes a quiz |
| `question_answered` | Individual question response |
| `badge_earned` | User unlocks achievement |
| `streak_updated` | Daily streak changed |

### Console Logging

- **Development**: Verbose logging enabled
- **Production**: Errors only, no sensitive data

---

## Key Design Decisions

### 1. Vite over Next.js

**Decision**: Migrated from Next.js to Vite + React SPA

**Rationale**:
- Simpler deployment (static files)
- Better Capacitor integration for iOS
- Faster development builds
- No need for SSR (content is user-specific)

**Tradeoffs**:
- Lose built-in SSR/SSG
- Manual route code-splitting

---

### 2. Supabase as Backend

**Decision**: Use Supabase instead of custom backend

**Rationale**:
- Built-in auth with magic links
- PostgreSQL with RLS for security
- Real-time subscriptions
- Generous free tier

**Tradeoffs**:
- Vendor lock-in
- Limited compute for complex logic (use triggers)

---

### 3. Offline-First with IndexedDB

**Decision**: Cache questions in IndexedDB, sync attempts later

**Rationale**:
- Users may have poor connectivity
- Exams should work offline
- Data persists across sessions

**Tradeoffs**:
- Complex sync logic
- Potential data conflicts

---

### 4. Database Triggers for Score Calculation

**Decision**: Calculate leaderboard scores via PostgreSQL triggers

**Rationale**:
- Atomic updates (no race conditions)
- Single source of truth
- Offload compute from client

**Tradeoffs**:
- Harder to debug
- Requires migration for changes

---

### 5. CSS Variables + Tailwind

**Decision**: Use CSS custom properties for theming, Tailwind for utilities

**Rationale**:
- Dynamic theme switching
- Consistent design tokens
- Rapid UI development

**Tradeoffs**:
- Larger CSS bundle
- Learning curve for custom properties

---

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variables
