import { supabase } from '@/lib/supabase';
import { MealLog, SymptomLog, NoteLog, UserProfile, TriggerHypothesis, MealType, TriggerCategory, Symptom, Goal, NoteCategory, Gender } from '@/types/database';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function createUserProfile(
  userId: string,
  goals: Goal[],
  suspectedTriggers: TriggerCategory[],
  basics?: {
    gender?: Gender;
    age?: number;
    height_cm?: number;
    weight_kg?: number;
  },
  customTriggers?: string[]
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      goals,
      suspected_triggers: suspectedTriggers,
      custom_triggers: customTriggers || [],
      gender: basics?.gender || null,
      age: basics?.age || null,
      height_cm: basics?.height_cm || null,
      weight_kg: basics?.weight_kg || null,
      onboarding_completed: true,
    })
    .select()
    .maybeSingle();
  return data;
}

export async function createMealLog(
  userId: string,
  mealType: MealType,
  description: string,
  triggerCategories: TriggerCategory[],
  portionNote?: string,
  photoUri?: string,
  voiceTranscript?: string,
  notes?: string,
  timestamp?: Date
): Promise<MealLog | null> {
  const { data } = await supabase
    .from('meal_logs')
    .insert({
      user_id: userId,
      meal_type: mealType,
      description,
      trigger_categories: triggerCategories,
      portion_note: portionNote || '',
      photo_uri: photoUri || '',
      voice_transcript: voiceTranscript || '',
      notes: notes || '',
      timestamp: (timestamp || new Date()).toISOString(),
    })
    .select()
    .maybeSingle();
  return data;
}

export async function updateMealLog(
  id: string,
  updates: Partial<Omit<MealLog, 'id' | 'user_id' | 'created_at'>>
): Promise<MealLog | null> {
  const { data } = await supabase
    .from('meal_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  return data;
}

export async function deleteMealLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('meal_logs').delete().eq('id', id);
  return !error;
}

export async function createSymptomLog(
  userId: string,
  symptoms: Symptom[],
  severity: number,
  notes?: string,
  timestamp?: Date
): Promise<SymptomLog | null> {
  const { data } = await supabase
    .from('symptom_logs')
    .insert({
      user_id: userId,
      symptoms,
      severity,
      notes: notes || '',
      timestamp: (timestamp || new Date()).toISOString(),
    })
    .select()
    .maybeSingle();
  return data;
}

export async function updateSymptomLog(
  id: string,
  updates: Partial<Omit<SymptomLog, 'id' | 'user_id' | 'created_at'>>
): Promise<SymptomLog | null> {
  const { data } = await supabase
    .from('symptom_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  return data;
}

export async function deleteSymptomLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('symptom_logs').delete().eq('id', id);
  return !error;
}

export async function createNoteLog(
  userId: string,
  content: string,
  category: NoteCategory,
  timestamp?: Date
): Promise<NoteLog | null> {
  const { data } = await supabase
    .from('note_logs')
    .insert({
      user_id: userId,
      content,
      category,
      timestamp: (timestamp || new Date()).toISOString(),
    })
    .select()
    .maybeSingle();
  return data;
}

export async function deleteNoteLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('note_logs').delete().eq('id', id);
  return !error;
}

export async function updateNoteLog(
  id: string,
  updates: { content?: string; category?: NoteCategory; timestamp?: string }
): Promise<NoteLog | null> {
  const { data } = await supabase
    .from('note_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  return data;
}

export async function getTodayLogs(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [meals, symptoms, notes] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true }),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true }),
    supabase
      .from('note_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true }),
  ]);

  return {
    meals: (meals.data || []) as MealLog[],
    symptoms: (symptoms.data || []) as SymptomLog[],
    notes: (notes.data || []) as NoteLog[],
  };
}

export async function getLogsForDate(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const [meals, symptoms, notes] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())
      .order('timestamp', { ascending: false }),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())
      .order('timestamp', { ascending: false }),
    supabase
      .from('note_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())
      .order('timestamp', { ascending: false }),
  ]);

  return {
    meals: (meals.data || []) as MealLog[],
    symptoms: (symptoms.data || []) as SymptomLog[],
    notes: (notes.data || []) as NoteLog[],
  };
}

export async function getLogsForDateRange(userId: string, startDate: Date, endDate: Date) {
  const [meals, symptoms] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true }),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true }),
  ]);

  return {
    meals: (meals.data || []) as MealLog[],
    symptoms: (symptoms.data || []) as SymptomLog[],
  };
}

export async function getHypotheses(userId: string): Promise<TriggerHypothesis[]> {
  const { data } = await supabase
    .from('trigger_hypotheses')
    .select('*')
    .eq('user_id', userId)
    .order('occurrences', { ascending: false });
  return (data || []) as TriggerHypothesis[];
}

export async function upsertHypothesis(hypothesis: Omit<TriggerHypothesis, 'id' | 'created_at' | 'updated_at'>): Promise<TriggerHypothesis | null> {
  const { data: existing } = await supabase
    .from('trigger_hypotheses')
    .select('id')
    .eq('user_id', hypothesis.user_id)
    .eq('trigger_category', hypothesis.trigger_category)
    .eq('symptom', hypothesis.symptom)
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from('trigger_hypotheses')
      .update({
        ...hypothesis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    return data;
  }

  const { data } = await supabase
    .from('trigger_hypotheses')
    .insert(hypothesis)
    .select()
    .maybeSingle();
  return data;
}
