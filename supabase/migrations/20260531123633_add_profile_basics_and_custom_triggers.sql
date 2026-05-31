/*
  # Add user basics and custom triggers to profiles

  1. Modified Tables
    - `user_profiles`
      - `gender` (text) - user's gender (male, female, non_binary, prefer_not_to_say)
      - `age` (integer) - user's age in years
      - `height_cm` (numeric) - user's height in centimeters
      - `weight_kg` (numeric) - user's weight in kilograms
      - `custom_triggers` (text array) - user-defined custom trigger items

  2. Notes
    - All new columns are nullable to avoid breaking existing profiles
    - custom_triggers allows users to add their own trigger items beyond the preset list
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN height_cm numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'weight_kg'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN weight_kg numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'custom_triggers'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_triggers text[] DEFAULT '{}';
  END IF;
END $$;
