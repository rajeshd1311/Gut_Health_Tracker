/*
  # Create IBS Diary Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `goals` (text array) - user's main health goals
      - `suspected_triggers` (text array) - user's suspected food triggers
      - `onboarding_completed` (boolean) - whether user completed onboarding
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meal_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz) - when the meal was consumed
      - `meal_type` (text) - breakfast, lunch, dinner, snack, drink
      - `description` (text) - food/drink description
      - `portion_note` (text) - optional quantity/portion notes
      - `trigger_categories` (text array) - suspected trigger categories
      - `photo_uri` (text) - optional photo URI
      - `voice_transcript` (text) - optional voice transcript
      - `notes` (text) - optional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `symptom_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz) - when symptoms occurred
      - `symptoms` (text array) - list of symptoms
      - `severity` (integer) - 0 to 10 scale
      - `notes` (text) - optional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `note_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz)
      - `content` (text) - note content
      - `category` (text) - stress, sleep, medication, other
      - `created_at` (timestamptz)

    - `trigger_hypotheses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `trigger_category` (text) - the suspected trigger food category
      - `symptom` (text) - the associated symptom
      - `confidence` (text) - low, medium, high
      - `occurrences` (integer) - number of times pattern observed
      - `supporting_meal_ids` (uuid array) - meal log IDs supporting this hypothesis
      - `supporting_symptom_ids` (uuid array) - symptom log IDs supporting this hypothesis
      - `explanation` (text) - cautious explanation text
      - `disclaimer` (text) - always present disclaimer text
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data only
*/

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  goals text[] DEFAULT '{}',
  suspected_triggers text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Meal Logs
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  meal_type text NOT NULL DEFAULT 'snack',
  description text NOT NULL DEFAULT '',
  portion_note text DEFAULT '',
  trigger_categories text[] DEFAULT '{}',
  photo_uri text DEFAULT '',
  voice_transcript text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Symptom Logs
CREATE TABLE IF NOT EXISTS symptom_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  symptoms text[] NOT NULL DEFAULT '{}',
  severity integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own symptom logs"
  ON symptom_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptom logs"
  ON symptom_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptom logs"
  ON symptom_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptom logs"
  ON symptom_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Note Logs
CREATE TABLE IF NOT EXISTS note_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  content text NOT NULL DEFAULT '',
  category text DEFAULT 'other',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE note_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note logs"
  ON note_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note logs"
  ON note_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own note logs"
  ON note_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note logs"
  ON note_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger Hypotheses
CREATE TABLE IF NOT EXISTS trigger_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  trigger_category text NOT NULL,
  symptom text NOT NULL,
  confidence text NOT NULL DEFAULT 'low',
  occurrences integer NOT NULL DEFAULT 0,
  supporting_meal_ids uuid[] DEFAULT '{}',
  supporting_symptom_ids uuid[] DEFAULT '{}',
  explanation text NOT NULL DEFAULT '',
  disclaimer text NOT NULL DEFAULT 'Correlation only. Not a diagnosis. Discuss with a doctor or dietitian.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trigger_hypotheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hypotheses"
  ON trigger_hypotheses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hypotheses"
  ON trigger_hypotheses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hypotheses"
  ON trigger_hypotheses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hypotheses"
  ON trigger_hypotheses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_timestamp ON meal_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_timestamp ON symptom_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_note_logs_user_timestamp ON note_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_hypotheses_user ON trigger_hypotheses(user_id);
