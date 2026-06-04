# GutSense - Product Requirements Document

## Overview

GutSense is a mobile-first IBS (Irritable Bowel Syndrome) diary app that helps users identify food triggers by logging meals, symptoms, and contextual notes. The app applies a temporal correlation algorithm to surface patterns between dietary choices and digestive symptoms, empowering users to have more informed conversations with their healthcare providers.

---

## Problem Statement

People with IBS face a frustrating cycle: symptoms appear without clear cause, dietary advice is generic, and elimination diets are exhausting without objective tracking. Most users cannot recall what they ate 48 hours ago, let alone correlate it with symptoms that appeared hours later. Existing health apps focus on calorie counting or generic wellness -- none provide IBS-specific pattern recognition with minimal logging friction.

---

## Target Users

- Adults (18-55) diagnosed with or suspecting IBS/digestive sensitivity
- People who have tried elimination diets but struggle with consistency
- Users seeking data to share with gastroenterologists or dietitians
- Health-conscious individuals who want to understand their body's reactions

---

## Core Value Propositions

1. **Automated pattern recognition** -- the app does the correlation work so users do not need to remember or analyze manually
2. **Minimal friction logging** -- a meal can be logged in 3 taps, a symptom in 2-3 taps
3. **Personalized trigger tracking** -- users define their own suspected triggers and custom categories
4. **Medical-grade responsibility** -- prominent disclaimers, no diagnosis claims, designed to supplement (not replace) professional guidance
5. **Visual clarity** -- charts and confidence-tiered insights make complex data digestible

---

## Features

### 1. Authentication

| Attribute | Detail |
|-----------|--------|
| Method | Email/password via Supabase Auth |
| Confirmation | Disabled (instant access) |
| Session | Persistent across app restarts |
| Security | Row Level Security on all database tables |

---

### 2. Onboarding

**Welcome Carousel (4 slides)**
- Introduces the problem, solution, and value proposition
- Skippable; viewed-state persisted to AsyncStorage
- Final slide leads to authentication

**Profile Setup (3 steps)**

| Step | Data Collected | Required |
|------|---------------|----------|
| Basics | Gender, age, height (cm), weight (kg) | No (all optional) |
| Goals | Primary concerns (bloating, pain, acidity, stool changes, brain fog, fatigue, other) | At least 1 |
| Triggers | Suspected food triggers + custom free-text triggers | At least 1 |

---

### 3. Meal Logging

| Field | Type | Required |
|-------|------|----------|
| Meal type | breakfast, lunch, dinner, snack, drink | Yes |
| Description | Free text | Yes |
| Timestamp | Date + time picker (defaults to now) | Yes |
| Trigger categories | Multi-select tags (dairy, wheat/gluten, spicy, fried, onion/garlic, caffeine, alcohol, legumes, artificial sweeteners, high-FODMAP, other) | No |
| Portion note | Free text | No |
| Photo | Camera/gallery capture | No |
| Voice transcript | Voice-to-text | No |
| Notes | Free text | No |

---

### 4. Symptom Logging

| Field | Type | Required |
|-------|------|----------|
| Symptoms | Multi-select (bloating, abdominal pain, gas, acidity/reflux, diarrhea, constipation, nausea, brain fog, fatigue, low mood/anxiety) | At least 1 |
| Severity | 0-10 scale with visual slider | Yes |
| Timestamp | Date + time picker (defaults to now) | Yes |
| Notes | Free text | No |

---

### 5. Note Logging

| Field | Type | Required |
|-------|------|----------|
| Category | stress, sleep, medication, other | Yes |
| Content | Free text | Yes |
| Timestamp | Date + time picker (defaults to now) | Yes |

---

### 6. Today Dashboard (Home Tab)

- Current date display
- 3 quick-action cards: Log Meal, Log Symptom, Add Note
- Daily progress summary showing count of meals, symptoms, and notes logged
- Recent activity feed: last 3 meals and last 3 symptoms with timestamps
- Motivational message (rotates daily from 8 messages)
- Empty state with guidance for first-time users
- Pull-to-refresh

---

### 7. Timeline Tab

- Chronological feed of all entries logged today (newest first)
- Cards differentiated by type (color-coded left border):
  - Meals: green
  - Symptoms: orange
  - Notes: blue
- Inline edit and delete actions on all entries
- Pull-to-refresh
- Empty state when no entries exist

---

### 8. History Tab

- **Mini-calendar grid** showing the current month with navigation arrows
  - Dot indicators on days that have at least one entry
  - Selectable date range: last 90 days through today
  - Today highlighted with ring, selected date with filled circle
- **Day entries list** below the calendar for the selected date
  - All entry types (meals, symptoms, notes) sorted newest-first
  - Same card styling as Timeline
- **7-day edit/delete window**: entries older than 7 days are read-only
- **Locked timestamp on edit**: editing from History locks the original timestamp (content-only edits)
- **"Edited" badge**: entries modified after creation show a subtle indicator
- Empty state per day when no entries exist

---

### 9. Insights Tab

**Correlation Engine**
- Analyzes 14-day rolling window of meal and symptom logs
- Temporal matching: symptoms appearing within 6 hours after a tagged meal
- Minimum threshold: 2 occurrences required to surface a hypothesis
- Confidence tiers:
  - High: 5+ correlated occurrences
  - Medium: 3-4 occurrences
  - Low: 2 occurrences

**Hypothesis Cards**
- Trigger category and correlated symptom
- Confidence badge (color-coded: green/amber/gray)
- Human-readable explanation
- Expandable details with occurrence count and supporting evidence
- Medical disclaimer on each card

**Safeguards**
- Prominent "not a diagnosis" disclaimer banner
- Each hypothesis includes individual disclaimer text
- Results sorted by occurrence frequency (strongest patterns first)

---

### 10. Charts Tab

- **7-day rolling window** for all visualizations
- **Meals Per Day**: vertical bar chart showing daily meal logging frequency
- **Symptom Logs Per Day**: vertical bar chart showing daily symptom frequency
- **Top Symptoms**: horizontal bar chart of 5 most-logged symptoms
- **Top Trigger Categories**: horizontal bar chart of 5 most-tagged triggers
- Pull-to-refresh
- Empty states per chart when insufficient data

---

## Data Architecture

### Database Tables (Supabase/PostgreSQL)

| Table | Purpose | RLS |
|-------|---------|-----|
| profiles | User demographics and onboarding data | Owner-only CRUD |
| meal_logs | Food/drink entries with trigger tags | Owner-only CRUD |
| symptom_logs | Symptom entries with severity | Owner-only CRUD |
| note_logs | Contextual notes (stress, sleep, etc.) | Owner-only CRUD |
| trigger_hypotheses | Computed correlation results | Owner-only CRUD |

### Key Relationships

- All log tables link to `auth.users` via `user_id`
- `trigger_hypotheses` stores `supporting_meal_ids[]` and `supporting_symptom_ids[]` for evidence trails
- Timestamps on all tables (`created_at`, `updated_at`) enable edit-tracking and audit

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54, Expo Router 4) |
| Platform | Web-first, iOS/Android compatible |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| State | React hooks + Supabase real-time |
| Styling | StyleSheet.create (no NativeWind) |
| Icons | lucide-react-native |
| Testing | Jest + React Testing Library |
| Navigation | Tab-based (5 tabs) + Stack for modals |

---

## Design System

| Token | Value |
|-------|-------|
| Primary | #2B7A5F (green) |
| Secondary | #5BA3C9 (blue) |
| Accent | #E8A838 (gold) |
| Warning | #FF9800 (orange) |
| Error | #E53935 (red) |
| Success | #4CAF50 (green) |
| Background | #F8FAF9 |
| Surface | #FFFFFF |
| Text | #1A2E23 |
| Border radius | 12px (cards), 20px (chips) |
| Spacing | 8px system |

---

## User Flows

### New User
```
Welcome Carousel -> Sign Up -> Onboarding (3 steps) -> Home Dashboard
```

### Returning User (Daily)
```
Open App -> Home (see summary) -> Log Meal/Symptom/Note -> Check Timeline -> Pull-to-refresh
```

### Pattern Discovery (Weekly)
```
Insights Tab -> Review hypotheses -> Tap for details -> Note trigger for discussion with doctor
```

### Retrospective Review
```
History Tab -> Navigate calendar -> Select past date -> Review entries -> Edit if within 7 days
```

---

## Business Rules

1. **Edit window**: Entries can only be edited/deleted within 7 days of their timestamp
2. **Timestamp lock**: Editing historical entries preserves the original timestamp
3. **Correlation threshold**: Minimum 2 co-occurrences within 6-hour window to generate a hypothesis
4. **Onboarding gate**: Users cannot access main app until onboarding is completed
5. **No data export**: Currently no export mechanism (future consideration)
6. **No push notifications**: Currently no reminders (future consideration)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily active logging (meals) | 2+ meals/day after first week |
| Symptom logging rate | 80%+ of symptomatic days captured |
| Retention (Day 7) | 40%+ |
| Retention (Day 30) | 25%+ |
| Time to first insight | Under 7 days of consistent logging |
| Correlation accuracy (user-validated) | 60%+ users confirm at least 1 hypothesis |

---

## Future Considerations

- Push notification reminders for meal/symptom logging
- Data export (PDF/CSV) for sharing with healthcare providers
- Photo-based meal recognition (AI-assisted description)
- Low-FODMAP diet phase tracking (elimination, reintroduction, maintenance)
- Integration with wearables (sleep data, stress indicators)
- Multi-language support
- Offline-first with sync
- Social/community features (anonymous pattern sharing)

---

## Non-Goals

- This app does NOT provide medical diagnoses
- This app does NOT replace professional dietary guidance
- This app does NOT track calories, macros, or weight loss
- This app is NOT a general wellness/fitness tracker
