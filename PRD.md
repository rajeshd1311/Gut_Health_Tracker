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
- Daily progress summary showing count of meals, symptoms, and notes logged for the current calendar day
- **Full day feed**: all meals, symptoms, and notes logged within the current 24-hour window, sorted newest-first
  - Cards differentiated by type (color-coded left border): meals = green, symptoms = orange, notes = blue
  - Each card shows entry type, formatted timestamp, description, trigger tags, and optional notes
  - **Inline edit** (pencil icon) and **delete** (trash icon) action buttons on every card
  - Tapping edit navigates to the appropriate log screen pre-populated with the existing entry
  - Tapping delete removes the entry immediately from the UI and the database
- Motivational message (rotates daily from a pool of messages), shown only when at least one entry exists
- Empty state with guidance for first-time users, shown only when no entries exist for the day
- Pull-to-refresh

---

### 7. Timeline Tab (History Calendar)

- Outlook-style **monthly calendar grid** showing one month at a time
  - Previous/next month navigation arrows; forward navigation disabled at the current month
  - Day-of-week column headers (Sun–Sat)
  - Today's date cell highlighted with a filled primary-color circle and white number
  - Future dates greyed out and non-interactive
  - **Green dot indicator** beneath any date cell that has at least one logged entry (meal or symptom)
- Tapping any past or current date opens a **bottom-sheet modal** for that day
  - Slide-up animation, semi-transparent backdrop (tap backdrop to dismiss)
  - Header: formatted date, total entry count, close (X) button
  - Loading spinner while data is being fetched
  - Empty state if no entries exist for the selected day
  - All entry types (meals, symptoms, notes) displayed newest-first using the same card styling as the Today tab
  - **7-day edit/delete window**: entries older than 7 days show a Lock icon instead of the pencil; the lock hint text "Edits locked after 7 days" is displayed on the card
  - Within the 7-day window, tapping the pencil closes the modal and navigates to the appropriate log screen pre-populated with the existing entry
  - Delete is always available regardless of entry age
  - Deleting the last entry for a day removes the green dot from that calendar cell immediately
- Calendar dot markers refresh when the tab regains focus (e.g., returning from an edit) and when the month changes
- Pull-to-refresh reloads the current month's dot markers

---

### 8. Insights Tab

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

### 9. Charts Tab

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
| Navigation | Tab-based (4 tabs) + Stack for modals |

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
Open App -> Home (see full day feed) -> Log Meal/Symptom/Note -> Edit/delete inline -> Pull-to-refresh
```

### Pattern Discovery (Weekly)
```
Insights Tab -> Review hypotheses -> Tap for details -> Note trigger for discussion with doctor
```

### Retrospective Review
```
Timeline Tab -> Navigate to past month -> Tap a date -> Review entries in bottom sheet -> Edit if within 7 days
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
