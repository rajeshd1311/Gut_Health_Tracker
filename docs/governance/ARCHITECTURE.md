# GutSense — Architecture Reference

**Last Updated:** June 7, 2026

> **AI DEVELOPMENT RULE**: Read this file in full before generating any new code, modifying any existing module, or adding a dependency. Every decision here reflects a deliberate constraint. Violating these boundaries introduces tight coupling and regression risk.

---

## 1. Tech Stack & Core Libraries

### Runtime & Framework

| Layer | Library | Version | Role |
|---|---|---|---|
| JS Runtime | React | 19.1.0 | UI rendering |
| Mobile framework | React Native | 0.81.4 | Cross-platform native primitives |
| App framework | Expo SDK | 54 | Managed workflow, camera, image picker, fonts |
| Router | Expo Router | 6 | File-system based routing (tabs + stack + modals) |
| Navigation | React Navigation (bottom-tabs, native) | 7 | Underlying tab/stack navigator primitives |

### Backend & Data

| Library | Version | Role |
|---|---|---|
| @supabase/supabase-js | 2.58.x | Database queries, Auth, RLS-scoped access |
| @react-native-async-storage/async-storage | 3.x | Persist Supabase auth session + welcome flag |
| react-native-url-polyfill | 2.x | Required by Supabase in React Native environments |

### UI & Utilities

| Library | Version | Role |
|---|---|---|
| lucide-react-native | 0.544.x | All icons throughout the app |
| @lucide/lab | 0.1.x | Extended/experimental icon set |
| react-native-svg | 15.x | SVG rendering required by lucide |
| react-native-reanimated | 4.x | Preferred animation library (over Animated API) |
| react-native-gesture-handler | 2.x | Native-side gesture recognition |
| react-native-safe-area-context | 5.x | Safe area insets |
| react-native-screens | 4.x | Native screen containers |
| expo-linear-gradient | 15.x | Gradient backgrounds |
| expo-camera | 17.x | Camera access for meal photo capture |
| expo-image-picker | 16.x | Gallery access for meal photos |

### Testing

| Library | Version | Role |
|---|---|---|
| jest | 29.x | Test runner |
| jest-expo | 56.x | Expo-aware Jest preset |
| @testing-library/react-native | 13.x | Component rendering + interaction assertions |
| react-test-renderer | 19.x | Underlying renderer for RTL |

> **Known peer dependency constraint**: `jest-expo@56` requires `@react-native/jest-preset@^0.85.0` which pulls `react@^19.2.3`. The project currently pins `react@19.1.0`. Do not upgrade jest-expo independently without also upgrading React. Tests pass at runtime despite the npm install warning.

---

## 2. Infrastructure & Vendor Dependencies

### Supabase (Primary Backend — CRITICAL for portability)

GutSense has **no self-hosted backend**. All data persistence, authentication, and authorization run through a Supabase project. Porting to any other environment requires provisioning a Supabase project (or equivalent) and applying all migrations.

#### Required Environment Variables

These must exist in `.env` at the project root (Expo reads `EXPO_PUBLIC_*` at build time):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

The anon key is safe to expose client-side — it has no elevated privileges. Row Level Security (see below) enforces that users can only access their own data.

> There is no `SUPABASE_SERVICE_ROLE_KEY` in client code. If an Edge Function is ever added, the service role key must only be used server-side (never shipped in the mobile bundle).

#### Supabase Services in Use

| Service | Usage |
|---|---|
| PostgreSQL | All application data (5 tables) |
| Supabase Auth | Email/password sign-up and sign-in, persistent JWT sessions |
| Row Level Security | All 5 tables enforce `auth.uid() = user_id` policies |
| Supabase Migrations | Schema managed via `/supabase/migrations/` SQL files |

#### Database Schema Summary

| Table | Primary Key | FK | Purpose |
|---|---|---|---|
| `user_profiles` | `id` (uuid) | `auth.users.id` | Onboarding data, goals, suspected triggers |
| `meal_logs` | `id` (uuid) | `user_id → auth.users` | Meal entries with trigger categories |
| `symptom_logs` | `id` (uuid) | `user_id → auth.users` | Symptom entries with severity (0–10) |
| `note_logs` | `id` (uuid) | `user_id → auth.users` | Contextual notes (stress, sleep, medication) |
| `trigger_hypotheses` | `id` (uuid) | `user_id → auth.users` | Computed correlation results |

Performance indexes exist on `(user_id, timestamp DESC)` for all three log tables.

#### Applying the Schema in a New Environment

```bash
# Using Supabase MCP tool (preferred in Bolt)
apply_migration <filename> <sql_content>

# Or manually: run each file in /supabase/migrations/ in chronological order
# 20260531110947_create_ibs_diary_schema.sql
# 20260531123633_add_profile_basics_and_custom_triggers.sql
# 20260531182501_add_note_logs_updated_at_and_update_policy.sql
```

#### RLS Policy Pattern (enforced on every table)

```sql
-- SELECT
USING (auth.uid() = user_id)
-- INSERT
WITH CHECK (auth.uid() = user_id)
-- UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
-- DELETE
USING (auth.uid() = user_id)
```

Never write a policy with `USING (true)` — that defeats RLS.

### AsyncStorage (Local Device)

Used for two purposes only:
1. Supabase auth session persistence (`auth.storage` config in `lib/supabase.ts`)
2. Welcome carousel "seen" flag (`gutsense_has_seen_welcome` key in `app/index.tsx`)

No other application state is persisted to device storage.

### No LLM / AI Vendor Dependencies

GutSense does **not** call any external AI/LLM API. The correlation engine (`services/correlations.ts`) is a deterministic, in-process algorithm. No API key, no network call.

---

## 3. Folder Structure

```
/
├── app/                         # Expo Router — every file here is a route
│   ├── _layout.tsx              # Root layout: AuthProvider wrap + Stack navigator
│   ├── index.tsx                # Entry gate: routing logic (welcome / auth / onboarding / tabs)
│   ├── welcome.tsx              # 4-slide onboarding carousel
│   ├── auth.tsx                 # Sign-in / sign-up screen
│   ├── onboarding.tsx           # 3-step profile setup (goals, triggers, basics)
│   ├── log-meal.tsx             # Modal: create or edit a meal log
│   ├── log-symptom.tsx          # Modal: create or edit a symptom log
│   ├── log-note.tsx             # Modal: create or edit a note log
│   ├── +not-found.tsx           # 404 fallback
│   └── (tabs)/
│       ├── _layout.tsx          # Tab bar configuration (4 tabs)
│       ├── index.tsx            # Today tab: full 24-hour log feed with edit/delete
│       ├── timeline.tsx         # Timeline tab: monthly calendar + day detail modal
│       ├── insights.tsx         # Insights tab: trigger hypothesis cards
│       └── charts.tsx           # Charts tab: 7-day bar/horizontal bar charts
│
├── components/                  # Reusable, stateless UI components
│   ├── DateTimePicker.tsx       # Date + time picker used on all log forms
│   ├── MonthCalendar.tsx        # Outlook-style monthly calendar grid
│   └── DayLogsModal.tsx         # Bottom-sheet modal showing logs for a selected date
│
├── services/                    # Business logic — no UI, no React
│   ├── database.ts              # All Supabase CRUD functions (single source of truth)
│   └── correlations.ts          # In-process correlation algorithm (no network calls)
│
├── lib/                         # App-wide singletons and configuration
│   ├── supabase.ts              # Supabase client singleton (created once)
│   ├── auth.tsx                 # AuthContext + AuthProvider + useAuth hook
│   └── constants.ts             # COLORS, domain enumerations, reward messages
│
├── types/
│   └── database.ts              # All TypeScript interfaces and union types
│
├── hooks/
│   └── useFrameworkReady.ts     # Required Expo hook — do not modify or remove
│
├── __tests__/
│   ├── helpers/
│   │   ├── auth-mock.tsx        # Reusable auth context mock
│   │   ├── database-mock.ts     # All jest.fn() mocks for services/database.ts
│   │   └── navigation-mock.ts   # expo-router mock (router.push, useLocalSearchParams)
│   ├── components/
│   │   └── DateTimePicker.test.tsx
│   ├── lib/
│   │   └── auth.test.tsx
│   ├── screens/                 # One test file per route/screen
│   │   ├── home.test.tsx
│   │   ├── timeline.test.tsx
│   │   ├── auth.test.tsx
│   │   ├── charts.test.tsx
│   │   ├── index.test.tsx
│   │   ├── insights.test.tsx
│   │   ├── log-meal.test.tsx
│   │   ├── log-note.test.tsx
│   │   ├── log-symptom.test.tsx
│   │   ├── onboarding.test.tsx
│   │   └── welcome.test.tsx
│   └── services/
│       ├── database.test.ts
│       └── correlations.test.ts
│
├── supabase/
│   └── migrations/              # SQL migration files — apply in timestamp order
│
├── assets/images/               # Static image assets
├── dist/                        # Web build output (do not edit manually)
├── .env                         # Local env vars (not committed)
├── app.json                     # Expo project config
├── babel.config.js              # Babel transform config
├── jest.config.js               # Jest + jest-expo preset config
├── jest.setup.ts                # Global test setup
├── tsconfig.json                # TypeScript config (path alias: @/ = root)
├── PRD.md                       # Product requirements document
└── ARCHITECTURE.md              # This file
```

---

## 4. Component & Module Responsibilities

### `app/_layout.tsx`
Root of the navigation tree. Wraps the entire app in `AuthProvider`. Contains `RootLayoutNav` which shows a loading spinner while auth resolves, then renders the `Stack` navigator. All modal routes (`log-meal`, `log-symptom`, `log-note`) are declared here with `presentation: 'modal'`.

**Must not**: contain data fetching, business logic, or routing decisions.

---

### `app/index.tsx`
The entry gate. Reads the Supabase session, the user profile, and the local `hasSeenWelcome` flag, then issues a `<Redirect>` to one of four destinations: `/welcome`, `/auth`, `/onboarding`, or `/(tabs)`. Renders only a loading spinner — no visible UI of its own.

**Must not**: render any content screens. One responsibility: decide where to route the user.

---

### `app/(tabs)/_layout.tsx`
Declares the 4-tab bar (Today, Timeline, Insights, Charts) with icons from lucide-react-native. Tab order is significant — do not reorder without updating the PRD.

---

### `app/(tabs)/index.tsx` — Today Tab
Loads all logs (meals, symptoms, notes) for the current calendar day using `getTodayLogs`. Renders quick-action buttons, daily progress stats, a motivational reward card (when logs exist), and a full sorted entry feed with inline edit (pencil) and delete (trash) on every card. Refreshes via `useFocusEffect` on every tab focus and via pull-to-refresh.

**Must not**: reach into `getLogsForDateRange` or `getLogsForDate`. Today-only scope is intentional.

---

### `app/(tabs)/timeline.tsx` — Timeline Tab
Monthly calendar history view. Loads dot markers for the visible month via `getLogsForDateRange`. When a date cell is tapped, opens `DayLogsModal` and loads that day's entries via `getLogsForDate`. Handles edit (navigate to log modal) and delete (remove from day state, remove dot if last entry). Refreshes markers on focus and on month navigation.

**Must not**: show today's live feed — that is the Today tab's sole responsibility.

---

### `app/(tabs)/insights.tsx` — Insights Tab
Triggers `generateAndSaveHypotheses` using the last 14 days of data. Displays confidence-tiered hypothesis cards with disclaimers. Contains expandable detail rows.

---

### `app/(tabs)/charts.tsx` — Charts Tab
Displays four read-only charts over a 7-day window. Uses `getLogsForDateRange`. No edit actions.

---

### `app/log-meal.tsx` / `log-symptom.tsx` / `log-note.tsx`
Modal forms. Accept optional URL params `id` and `entry` (JSON-encoded existing record) for edit mode. In create mode, call `createMealLog` / `createSymptomLog` / `createNoteLog`. In edit mode, call the corresponding `update*` function. On success, dismiss the modal (`router.back()`).

**Must not**: contain routing logic beyond `router.back()`. Must not call delete functions.

---

### `components/MonthCalendar.tsx`
Purely presentational calendar grid. Receives `year`, `month`, `markedDates: Set<string>`, `onMonthChange`, and `onDayPress` as props. Has no internal state beyond static date math. Disables future dates and the forward-navigation button when at the current month.

**Must not**: fetch data, hold state about selected dates, or know anything about log types.

---

### `components/DayLogsModal.tsx`
Slide-up bottom-sheet `Modal`. Receives fully resolved `meals`, `symptoms`, `notes` arrays as props plus `loading`, `onEdit`, `onDelete`, `onClose`. Applies the 7-day edit lock rule (`isEditLocked`): locked entries show a Lock icon and the edit button is inert. Delete is always active.

**Must not**: call database functions directly. All side effects are delegated to the parent via callbacks.

---

### `components/DateTimePicker.tsx`
Inline date + time picker component used on all three log forms. Accepts `value: Date` and `onChange: (date: Date) => void`.

---

### `services/database.ts`
**The single source of truth for all Supabase data access.** Every function returns typed data or `null`/`boolean`. No React, no hooks, no navigation. This is the only module that imports from `lib/supabase.ts`.

Key functions:

| Function | Description |
|---|---|
| `getUserProfile(userId)` | Fetch user profile by ID |
| `createUserProfile(...)` | Insert new profile after onboarding |
| `createMealLog(...)` | Insert a new meal entry |
| `updateMealLog(id, updates)` | Partial update a meal entry |
| `deleteMealLog(id)` | Delete a meal entry; returns `boolean` |
| `createSymptomLog(...)` | Insert a new symptom entry |
| `updateSymptomLog(id, updates)` | Partial update a symptom entry |
| `deleteSymptomLog(id)` | Delete a symptom entry |
| `createNoteLog(...)` | Insert a new note entry |
| `updateNoteLog(id, updates)` | Partial update a note entry |
| `deleteNoteLog(id)` | Delete a note entry |
| `getTodayLogs(userId)` | All three log types for the current calendar day |
| `getLogsForDate(userId, date)` | All three log types for a specific date |
| `getLogsForDateRange(userId, start, end)` | Meals + symptoms for a date range (used by Charts, Insights, Timeline calendar markers) |
| `getHypotheses(userId)` | Fetch stored hypotheses |
| `upsertHypothesis(hypothesis)` | Insert or update a hypothesis |

**Must not**: perform correlation logic (that belongs in `services/correlations.ts`). Must not import React or any UI component.

---

### `services/correlations.ts`
Pure in-process algorithm. No network calls, no Supabase access, no React. Exports two functions:
- `analyzeCorrelations(meals, symptoms)` — returns `CorrelationResult[]` (2+ occurrence threshold, 6-hour temporal window)
- `generateAndSaveHypotheses(userId, meals, symptoms)` — wraps `analyzeCorrelations` and persists results via `upsertHypothesis`

**Must not**: fetch data. Data is always passed in by the caller.

---

### `lib/supabase.ts`
Creates and exports the singleton Supabase client. Configures `AsyncStorage` as the session storage backend. This file is the **only** place the Supabase URL and anon key are read from environment variables.

**Must not**: be imported from any file other than `lib/auth.tsx` and `services/database.ts`.

---

### `lib/auth.tsx`
Defines `AuthContext`, `AuthProvider`, and `useAuth`. Manages `session`, `profile`, and `loading` state globally. Listens to `onAuthStateChange` to keep state synchronized with Supabase. Exposes `signUp`, `signIn`, `signOut`, and `refreshProfile`.

**Must not**: contain routing decisions. Routing based on auth state lives in `app/index.tsx`.

---

### `lib/constants.ts`
Static configuration. Exports `COLORS` (design token map), domain option arrays (`GOALS`, `TRIGGER_CATEGORIES`, `SYMPTOMS`, `MEAL_TYPES`, `NOTE_CATEGORIES`, `GENDER_OPTIONS`), and `REWARD_MESSAGES`. These arrays are the canonical source for all UI dropdowns and form fields.

**Must not**: contain component logic, async code, or side effects of any kind.

---

### `types/database.ts`
TypeScript-only file. Exports all domain types and interfaces: `MealLog`, `SymptomLog`, `NoteLog`, `UserProfile`, `TriggerHypothesis`, `TimelineEntry` (discriminated union), plus all enum string union types.

**Must not**: import from any application module. This is a leaf node in the dependency graph.

---

### `__tests__/helpers/database-mock.ts`
Exports individual `jest.fn()` mocks for every function in `services/database.ts`, plus `getDatabaseMockModule()` and `resetAllDatabaseMocks()`. Every screen test that touches the database uses this helper rather than defining its own mocks.

**Rule**: when a new function is added to `services/database.ts`, add the corresponding mock here before writing any test that needs it.

---

## 5. State Management

GutSense uses **no global state library** (no Redux, no Zustand, no MobX). All state is either React Context or local component state.

### Global State: `AuthContext` (`lib/auth.tsx`)

| Field | Type | Description |
|---|---|---|
| `session` | `Session \| null` | Active Supabase JWT session |
| `user` | `User \| null` | Derived from `session.user` |
| `profile` | `UserProfile \| null` | Fetched from `user_profiles` table on auth change |
| `loading` | `boolean` | True until initial session check + profile fetch resolves |

Provided at the root via `<AuthProvider>` in `app/_layout.tsx`. Consumed via `useAuth()` in every screen that needs identity context.

### Local Screen State

Each tab and each modal form manages its own data via `useState`. State is not shared between tabs.

| Screen | Key Local State |
|---|---|
| `app/(tabs)/index.tsx` | `meals`, `symptoms`, `notes`, `refreshing` |
| `app/(tabs)/timeline.tsx` | `currentYear`, `currentMonth`, `markedDates`, `modalVisible`, `selectedDate`, `dayMeals`, `daySymptoms`, `dayNotes`, `loadingDay`, `refreshing` |
| `app/(tabs)/insights.tsx` | `hypotheses`, `loading`, `expandedId` |
| `app/(tabs)/charts.tsx` | `meals`, `symptoms`, `loading`, `refreshing` |
| `app/log-meal.tsx` | All form field values, `saving`, `isEdit` flag |
| `app/log-symptom.tsx` | All form field values, `saving`, `isEdit` flag |
| `app/log-note.tsx` | All form field values, `saving`, `isEdit` flag |

### Data Refresh Pattern

Screens use `useFocusEffect(useCallback(() => { loadData(); }, [loadData]))` to reload data whenever the screen regains focus (e.g., after returning from a log modal). This ensures the feed is always current without requiring a global event bus.

Pull-to-refresh is available on all tabs via `<RefreshControl>`.

### AsyncStorage (Persistent Local State)

| Key | Type | Owner | Purpose |
|---|---|---|---|
| `gutsense_has_seen_welcome` | `'true' \| null` | `app/index.tsx` | Skip carousel on return visits |
| Supabase session keys | Internal | `lib/supabase.ts` | Persist JWT across app restarts |

---

## 6. Navigation Architecture

```
Stack (app/_layout.tsx)
├── app/index.tsx                  — Entry gate, no UI
├── app/welcome.tsx                — Full-screen carousel
├── app/auth.tsx                   — Sign in / sign up
├── app/onboarding.tsx             — 3-step profile setup
├── app/(tabs)/                    — Main app shell (tab bar)
│   ├── index.tsx                  Today tab
│   ├── timeline.tsx               Timeline / History tab
│   ├── insights.tsx               Insights tab
│   └── charts.tsx                 Charts tab
├── app/log-meal.tsx               ← modal presentation
├── app/log-symptom.tsx            ← modal presentation
└── app/log-note.tsx               ← modal presentation
```

Log screens are pushed as native modals (`presentation: 'modal'`) from both the Today tab (quick-action buttons) and the Timeline tab (edit actions in `DayLogsModal`). On success or cancel, they call `router.back()` to dismiss.

The `DayLogsModal` inside the Timeline tab is a React Native `Modal` component (slide-up sheet) — it is not an Expo Router route. It manages its own `visible` state internally to the timeline screen.

---

## 7. Business Rules (Enforced in Code)

| Rule | Location |
|---|---|
| 7-day edit lock | `components/DayLogsModal.tsx` → `isEditLocked(timestamp)` |
| Onboarding gate | `app/index.tsx` → redirects to `/onboarding` if `!profile?.onboarding_completed` |
| Correlation threshold (≥ 2 occurrences) | `services/correlations.ts` → `.filter(c => c.occurrences >= 2)` |
| 6-hour temporal window for correlations | `services/correlations.ts` → `HOURS_WINDOW = 6` |
| 14-day rolling window for analysis | `app/(tabs)/insights.tsx` (date range passed to `getLogsForDateRange`) |
| Today = midnight-to-23:59:59 in local time | `services/database.ts` → `getTodayLogs`, `getLogsForDate` |
| RLS: users access only their own data | Supabase migration SQL policies |

---

## 8. Testing Strategy

Tests live in `__tests__/` and mirror the source directory structure. The Jest preset is `jest-expo`.

**Path alias**: `@/` resolves to the project root (configured in `jest.config.js` via `moduleNameMapper`).

### Mocking Conventions

- **Supabase**: always mocked entirely at the `@/lib/supabase` module boundary. No test ever reaches a real database.
- **Database service**: mocked using `__tests__/helpers/database-mock.ts`. Import `getDatabaseMockModule()` into `jest.mock('@/services/database', ...)`.
- **Auth**: mocked using `__tests__/helpers/auth-mock.tsx`. Use `mockUseAuth.mockReturnValue({ user: { id: 'u1' } })`.
- **expo-router**: mocked using `__tests__/helpers/navigation-mock.ts`. Provides `router.push`, `router.back`, `useLocalSearchParams`, `useFocusEffect`.
- **lucide-react-native**: mocked with a `Proxy` that renders a plain `<View testID={props.testID}>` for any icon component.

### Coverage Scope

Coverage is collected from `services/**`, `lib/**`, and `components/**`. Screen tests (`__tests__/screens/`) validate user-facing behavior (rendering, navigation, data loading, edit/delete interactions).

---

## 9. Environment Setup Checklist (New Environment)

If porting this project away from the hosted Bolt environment, complete the following before running the app:

- [ ] Create a Supabase project at https://supabase.com
- [ ] Copy the Project URL and anon key into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Enable email/password auth in the Supabase dashboard (Auth → Providers → Email)
- [ ] Disable email confirmation (Auth → Settings → Email Confirm = off)
- [ ] Apply all three SQL migration files in `/supabase/migrations/` in chronological order
- [ ] Verify RLS is enabled on all 5 tables
- [ ] Run `npm install` (note the jest-expo peer dependency warning — see Section 1)
- [ ] Run `npm run typecheck` to verify TypeScript is satisfied
- [ ] Run `npm test` to verify the test suite passes
