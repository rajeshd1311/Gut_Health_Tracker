/*
  # Add updated_at column and UPDATE policy to note_logs

  1. Modified Tables
    - `note_logs`
      - `updated_at` (timestamptz) - tracks when a note was last edited

  2. Security
    - Add UPDATE policy so authenticated users can edit their own notes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'note_logs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE note_logs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'note_logs' AND policyname = 'Users can update own note logs'
  ) THEN
    CREATE POLICY "Users can update own note logs"
      ON note_logs FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
