import { Goal, TriggerCategory, Symptom, MealType, NoteCategory, Gender } from '@/types/database';

export const GOALS: { value: Goal; label: string }[] = [
  { value: 'bloating', label: 'Bloating' },
  { value: 'pain', label: 'Abdominal Pain' },
  { value: 'acidity', label: 'Acidity / Reflux' },
  { value: 'stool_changes', label: 'Stool Changes' },
  { value: 'brain_fog', label: 'Brain Fog' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'other', label: 'Other' },
];

export const TRIGGER_CATEGORIES: { value: TriggerCategory; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'wheat_gluten', label: 'Wheat / Gluten' },
  { value: 'spicy', label: 'Spicy Food' },
  { value: 'fried', label: 'Fried Food' },
  { value: 'onion_garlic', label: 'Onion / Garlic' },
  { value: 'caffeine', label: 'Caffeine' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'artificial_sweeteners', label: 'Artificial Sweeteners' },
  { value: 'high_fodmap', label: 'High-FODMAP' },
  { value: 'not_sure', label: 'Not Sure' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const SYMPTOMS: { value: Symptom; label: string }[] = [
  { value: 'bloating', label: 'Bloating' },
  { value: 'abdominal_pain', label: 'Abdominal Pain' },
  { value: 'gas', label: 'Gas' },
  { value: 'acidity_reflux', label: 'Acidity / Reflux' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'constipation', label: 'Constipation' },
  { value: 'nausea', label: 'Nausea' },
  { value: 'brain_fog', label: 'Brain Fog' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'low_mood_anxiety', label: 'Low Mood / Anxiety' },
];

export const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { value: 'lunch', label: 'Lunch', icon: 'sun' },
  { value: 'dinner', label: 'Dinner', icon: 'sunset' },
  { value: 'snack', label: 'Snack', icon: 'cookie' },
  { value: 'drink', label: 'Drink', icon: 'coffee' },
];

export const NOTE_CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: 'stress', label: 'Stress' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'medication', label: 'Medication' },
  { value: 'other', label: 'Other' },
];

export const COLORS = {
  primary: '#2B7A5F',
  primaryLight: '#3D9B78',
  primaryDark: '#1F5C47',
  secondary: '#5BA3C9',
  secondaryLight: '#7BBDE0',
  accent: '#E8A838',
  accentLight: '#F0C060',
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  error: '#E53935',
  errorLight: '#EF5350',
  background: '#F8FAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8E5',
  borderLight: '#F0F4F2',
  text: '#1A2B23',
  textSecondary: '#5A6B63',
  textTertiary: '#8A9B93',
  textInverse: '#FFFFFF',
  mealCard: '#EBF5F0',
  symptomCard: '#FFF3E0',
  noteCard: '#E3F2FD',
  hypothesisCard: '#FFF8E1',
};

export const REWARD_MESSAGES = [
  'Great job logging today. Every entry helps you build a clearer picture.',
  'Consistent tracking is the foundation of understanding your body better.',
  'You are building evidence that may help identify patterns over time.',
  'Each log is a data point. The more you track, the more you can learn.',
  'Well done. Small daily habits lead to big insights over time.',
  'Your future self will thank you for these observations.',
  'Tracking is the first step toward understanding. Keep going.',
  'You are doing something valuable for your health today.',
];
