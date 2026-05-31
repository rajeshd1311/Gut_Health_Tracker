export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

export type TriggerCategory =
  | 'dairy'
  | 'wheat_gluten'
  | 'spicy'
  | 'fried'
  | 'onion_garlic'
  | 'caffeine'
  | 'alcohol'
  | 'legumes'
  | 'artificial_sweeteners'
  | 'high_fodmap'
  | 'not_sure'
  | 'other';

export type Symptom =
  | 'bloating'
  | 'abdominal_pain'
  | 'gas'
  | 'acidity_reflux'
  | 'diarrhea'
  | 'constipation'
  | 'nausea'
  | 'brain_fog'
  | 'fatigue'
  | 'low_mood_anxiety';

export type Goal =
  | 'bloating'
  | 'pain'
  | 'acidity'
  | 'stool_changes'
  | 'brain_fog'
  | 'fatigue'
  | 'other';

export type NoteCategory = 'stress' | 'sleep' | 'medication' | 'other';

export type Confidence = 'low' | 'medium' | 'high';

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface UserProfile {
  id: string;
  goals: Goal[];
  suspected_triggers: TriggerCategory[];
  custom_triggers: string[];
  gender: Gender | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  timestamp: string;
  meal_type: MealType;
  description: string;
  portion_note: string;
  trigger_categories: TriggerCategory[];
  photo_uri: string;
  voice_transcript: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  timestamp: string;
  symptoms: Symptom[];
  severity: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface NoteLog {
  id: string;
  user_id: string;
  timestamp: string;
  content: string;
  category: NoteCategory;
  created_at: string;
}

export interface TriggerHypothesis {
  id: string;
  user_id: string;
  trigger_category: TriggerCategory;
  symptom: Symptom;
  confidence: Confidence;
  occurrences: number;
  supporting_meal_ids: string[];
  supporting_symptom_ids: string[];
  explanation: string;
  disclaimer: string;
  created_at: string;
  updated_at: string;
}

export type TimelineEntry =
  | { type: 'meal'; data: MealLog }
  | { type: 'symptom'; data: SymptomLog }
  | { type: 'note'; data: NoteLog };
