// All Supabase interactions are mocked. The factory below prevents
// lib/supabase.ts from running (and importing AsyncStorage / url-polyfill).
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import {
  createMealLog,
  updateMealLog,
  deleteMealLog,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
  createNoteLog,
  updateNoteLog,
  deleteNoteLog,
  getTodayLogs,
  getLogsForDate,
  getLogsForDateRange,
  getUserProfile,
  createUserProfile,
  upsertHypothesis,
} from '@/services/database';
import { MealLog, SymptomLog, NoteLog, UserProfile, TriggerHypothesis } from '@/types/database';

const mockFrom = supabase.from as jest.Mock;

// ---------------------------------------------------------------------------
// Chain builder helpers
// ---------------------------------------------------------------------------

function selectChain(data: any, error: any = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

function insertChain(data: any, error: any = null) {
  const chain: any = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

function updateChain(data: any, error: any = null) {
  const chain: any = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

function deleteChain(error: any = null) {
  return {
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2024-03-10T12:00:00.000Z');

const mockMeal: MealLog = {
  id: 'm1',
  user_id: 'u1',
  timestamp: NOW.toISOString(),
  meal_type: 'lunch',
  description: 'Pasta',
  portion_note: 'large',
  trigger_categories: ['dairy'],
  photo_uri: '',
  voice_transcript: '',
  notes: 'felt heavy',
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

const mockSymptom: SymptomLog = {
  id: 's1',
  user_id: 'u1',
  timestamp: NOW.toISOString(),
  symptoms: ['bloating'],
  severity: 6,
  notes: '',
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

const mockNote: NoteLog = {
  id: 'n1',
  user_id: 'u1',
  timestamp: NOW.toISOString(),
  content: 'Feeling stressed',
  category: 'stress',
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

const mockProfile: UserProfile = {
  id: 'u1',
  goals: ['bloating'],
  suspected_triggers: ['dairy'],
  custom_triggers: [],
  gender: null,
  age: null,
  height_cm: null,
  weight_kg: null,
  onboarding_completed: true,
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

// ---------------------------------------------------------------------------
// createMealLog
// ---------------------------------------------------------------------------

describe('createMealLog', () => {
  test('sends correct payload and returns the created log', async () => {
    const chain = insertChain(mockMeal);
    mockFrom.mockReturnValueOnce(chain);

    const result = await createMealLog('u1', 'lunch', 'Pasta', ['dairy'], 'large', '', '', 'felt heavy', NOW);

    expect(mockFrom).toHaveBeenCalledWith('meal_logs');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        meal_type: 'lunch',
        description: 'Pasta',
        trigger_categories: ['dairy'],
        timestamp: NOW.toISOString(),
      })
    );
    expect(result).toEqual(mockMeal);
  });

  test('defaults timestamp to now when not provided', async () => {
    const chain = insertChain(mockMeal);
    mockFrom.mockReturnValueOnce(chain);
    const before = Date.now();
    await createMealLog('u1', 'snack', 'Apple', []);
    const after = Date.now();

    const payload = chain.insert.mock.calls[0][0];
    const ts = new Date(payload.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  test('defaults optional string fields to empty strings', async () => {
    const chain = insertChain(mockMeal);
    mockFrom.mockReturnValueOnce(chain);
    await createMealLog('u1', 'breakfast', 'Eggs', []);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.portion_note).toBe('');
    expect(payload.photo_uri).toBe('');
    expect(payload.voice_transcript).toBe('');
    expect(payload.notes).toBe('');
  });

  test('returns null when supabase returns null data', async () => {
    mockFrom.mockReturnValueOnce(insertChain(null));
    const result = await createMealLog('u1', 'dinner', 'Pizza', ['wheat_gluten']);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateMealLog
// ---------------------------------------------------------------------------

describe('updateMealLog', () => {
  test('sends updates including updated_at and returns updated log', async () => {
    const chain = updateChain(mockMeal);
    mockFrom.mockReturnValueOnce(chain);

    const result = await updateMealLog('m1', { description: 'Updated pasta' });

    expect(mockFrom).toHaveBeenCalledWith('meal_logs');
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Updated pasta',
        updated_at: expect.any(String),
      })
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'm1');
    expect(result).toEqual(mockMeal);
  });

  test('updated_at is a valid ISO date string', async () => {
    const chain = updateChain(mockMeal);
    mockFrom.mockReturnValueOnce(chain);
    const before = Date.now();
    await updateMealLog('m1', { description: 'x' });
    const after = Date.now();

    const payload = chain.update.mock.calls[0][0];
    const ts = new Date(payload.updated_at).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// deleteMealLog
// ---------------------------------------------------------------------------

describe('deleteMealLog', () => {
  test('returns true when delete succeeds (no error)', async () => {
    mockFrom.mockReturnValueOnce(deleteChain(null));
    expect(await deleteMealLog('m1')).toBe(true);
  });

  test('returns false when delete fails', async () => {
    mockFrom.mockReturnValueOnce(deleteChain({ message: 'not found' }));
    expect(await deleteMealLog('nonexistent')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSymptomLog
// ---------------------------------------------------------------------------

describe('createSymptomLog', () => {
  test('sends correct payload with explicit timestamp', async () => {
    const chain = insertChain(mockSymptom);
    mockFrom.mockReturnValueOnce(chain);

    const result = await createSymptomLog('u1', ['bloating'], 6, '', NOW);

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        symptoms: ['bloating'],
        severity: 6,
        timestamp: NOW.toISOString(),
      })
    );
    expect(result).toEqual(mockSymptom);
  });

  test('defaults timestamp to now when not provided', async () => {
    const chain = insertChain(mockSymptom);
    mockFrom.mockReturnValueOnce(chain);
    const before = Date.now();
    await createSymptomLog('u1', ['gas'], 3);
    const after = Date.now();

    const payload = chain.insert.mock.calls[0][0];
    const ts = new Date(payload.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  test('notes defaults to empty string', async () => {
    const chain = insertChain(mockSymptom);
    mockFrom.mockReturnValueOnce(chain);
    await createSymptomLog('u1', ['nausea'], 4);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.notes).toBe('');
  });
});

// ---------------------------------------------------------------------------
// updateSymptomLog
// ---------------------------------------------------------------------------

describe('updateSymptomLog', () => {
  test('includes updated_at in the update payload', async () => {
    const chain = updateChain(mockSymptom);
    mockFrom.mockReturnValueOnce(chain);

    await updateSymptomLog('s1', { severity: 8 });

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 8, updated_at: expect.any(String) })
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 's1');
  });
});

// ---------------------------------------------------------------------------
// deleteSymptomLog
// ---------------------------------------------------------------------------

describe('deleteSymptomLog', () => {
  test('returns true on success', async () => {
    mockFrom.mockReturnValueOnce(deleteChain(null));
    expect(await deleteSymptomLog('s1')).toBe(true);
  });

  test('returns false on error', async () => {
    mockFrom.mockReturnValueOnce(deleteChain({ message: 'error' }));
    expect(await deleteSymptomLog('s1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createNoteLog
// ---------------------------------------------------------------------------

describe('createNoteLog', () => {
  test('sends correct payload with explicit timestamp', async () => {
    const chain = insertChain(mockNote);
    mockFrom.mockReturnValueOnce(chain);

    const result = await createNoteLog('u1', 'Feeling stressed', 'stress', NOW);

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        content: 'Feeling stressed',
        category: 'stress',
        timestamp: NOW.toISOString(),
      })
    );
    expect(result).toEqual(mockNote);
  });

  test('passes through the exact timestamp provided without modification', async () => {
    const chain = insertChain(mockNote);
    mockFrom.mockReturnValueOnce(chain);
    const customTime = new Date('2024-01-15T08:30:00.000Z');

    await createNoteLog('u1', 'Morning note', 'sleep', customTime);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.timestamp).toBe(customTime.toISOString());
  });
});

// ---------------------------------------------------------------------------
// updateNoteLog
// ---------------------------------------------------------------------------

describe('updateNoteLog', () => {
  test('includes updated_at in the update payload', async () => {
    const chain = updateChain(mockNote);
    mockFrom.mockReturnValueOnce(chain);

    await updateNoteLog('n1', { content: 'Updated content', category: 'medication' });

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Updated content',
        category: 'medication',
        updated_at: expect.any(String),
      })
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'n1');
  });
});

// ---------------------------------------------------------------------------
// deleteNoteLog
// ---------------------------------------------------------------------------

describe('deleteNoteLog', () => {
  test('returns true on success', async () => {
    mockFrom.mockReturnValueOnce(deleteChain(null));
    expect(await deleteNoteLog('n1')).toBe(true);
  });

  test('returns false on error', async () => {
    mockFrom.mockReturnValueOnce(deleteChain({ message: 'error' }));
    expect(await deleteNoteLog('n1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTodayLogs
// ---------------------------------------------------------------------------

describe('getTodayLogs', () => {
  function todayQueryChain(data: any[]) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data, error: null }),
    };
  }

  test('queries all three tables and returns combined result', async () => {
    mockFrom
      .mockReturnValueOnce(todayQueryChain([mockMeal]))   // meal_logs
      .mockReturnValueOnce(todayQueryChain([mockSymptom])) // symptom_logs
      .mockReturnValueOnce(todayQueryChain([mockNote]));   // note_logs

    const result = await getTodayLogs('u1');

    expect(mockFrom).toHaveBeenCalledWith('meal_logs');
    expect(mockFrom).toHaveBeenCalledWith('symptom_logs');
    expect(mockFrom).toHaveBeenCalledWith('note_logs');
    expect(result.meals).toEqual([mockMeal]);
    expect(result.symptoms).toEqual([mockSymptom]);
    expect(result.notes).toEqual([mockNote]);
  });

  test('returns empty arrays when data is null', async () => {
    mockFrom
      .mockReturnValueOnce(todayQueryChain([]))
      .mockReturnValueOnce(todayQueryChain([]))
      .mockReturnValueOnce(todayQueryChain([]));

    const result = await getTodayLogs('u1');
    expect(result.meals).toEqual([]);
    expect(result.symptoms).toEqual([]);
    expect(result.notes).toEqual([]);
  });

  test('filters by user_id', async () => {
    const mealChain = todayQueryChain([]);
    const symptomChain = todayQueryChain([]);
    const noteChain = todayQueryChain([]);
    mockFrom
      .mockReturnValueOnce(mealChain)
      .mockReturnValueOnce(symptomChain)
      .mockReturnValueOnce(noteChain);

    await getTodayLogs('u1');

    expect(mealChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(symptomChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(noteChain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  test('queries timestamps within today (start and end of day)', async () => {
    const mealChain = todayQueryChain([]);
    const symptomChain = todayQueryChain([]);
    const noteChain = todayQueryChain([]);
    mockFrom
      .mockReturnValueOnce(mealChain)
      .mockReturnValueOnce(symptomChain)
      .mockReturnValueOnce(noteChain);

    const callTime = new Date();
    await getTodayLogs('u1');

    const startOfDay = new Date(callTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(callTime);
    endOfDay.setHours(23, 59, 59, 999);

    expect(mealChain.gte).toHaveBeenCalledWith('timestamp', startOfDay.toISOString());
    expect(mealChain.lte).toHaveBeenCalledWith('timestamp', endOfDay.toISOString());
  });
});

// ---------------------------------------------------------------------------
// getLogsForDateRange
// ---------------------------------------------------------------------------

describe('getLogsForDateRange', () => {
  function rangeChain(data: any[]) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data, error: null }),
    };
  }

  test('passes startDate and endDate to both meal and symptom queries', async () => {
    const start = new Date('2024-03-01T00:00:00.000Z');
    const end = new Date('2024-03-07T23:59:59.999Z');
    const mealChain = rangeChain([]);
    const symptomChain = rangeChain([]);
    mockFrom.mockReturnValueOnce(mealChain).mockReturnValueOnce(symptomChain);

    await getLogsForDateRange('u1', start, end);

    expect(mealChain.gte).toHaveBeenCalledWith('timestamp', start.toISOString());
    expect(mealChain.lte).toHaveBeenCalledWith('timestamp', end.toISOString());
    expect(symptomChain.gte).toHaveBeenCalledWith('timestamp', start.toISOString());
    expect(symptomChain.lte).toHaveBeenCalledWith('timestamp', end.toISOString());
  });
});

// ---------------------------------------------------------------------------
// getLogsForDate
// ---------------------------------------------------------------------------

describe('getLogsForDate', () => {
  function dateQueryChain(data: any[]) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data, error: null }),
    };
  }

  test('queries all three tables and returns combined result', async () => {
    mockFrom
      .mockReturnValueOnce(dateQueryChain([mockMeal]))    // meal_logs
      .mockReturnValueOnce(dateQueryChain([mockSymptom])) // symptom_logs
      .mockReturnValueOnce(dateQueryChain([mockNote]));   // note_logs

    const targetDate = new Date('2024-03-10');
    const result = await getLogsForDate('u1', targetDate);

    expect(mockFrom).toHaveBeenCalledWith('meal_logs');
    expect(mockFrom).toHaveBeenCalledWith('symptom_logs');
    expect(mockFrom).toHaveBeenCalledWith('note_logs');
    expect(result.meals).toEqual([mockMeal]);
    expect(result.symptoms).toEqual([mockSymptom]);
    expect(result.notes).toEqual([mockNote]);
  });

  test('queries timestamps within the given date (start and end of day)', async () => {
    const mealChain = dateQueryChain([]);
    const symptomChain = dateQueryChain([]);
    const noteChain = dateQueryChain([]);
    mockFrom
      .mockReturnValueOnce(mealChain)
      .mockReturnValueOnce(symptomChain)
      .mockReturnValueOnce(noteChain);

    const targetDate = new Date('2024-03-10');
    await getLogsForDate('u1', targetDate);

    const expectedStart = new Date('2024-03-10');
    expectedStart.setHours(0, 0, 0, 0);
    const expectedEnd = new Date('2024-03-10');
    expectedEnd.setHours(23, 59, 59, 999);

    expect(mealChain.gte).toHaveBeenCalledWith('timestamp', expectedStart.toISOString());
    expect(mealChain.lte).toHaveBeenCalledWith('timestamp', expectedEnd.toISOString());
  });

  test('filters by user_id on all three tables', async () => {
    const mealChain = dateQueryChain([]);
    const symptomChain = dateQueryChain([]);
    const noteChain = dateQueryChain([]);
    mockFrom
      .mockReturnValueOnce(mealChain)
      .mockReturnValueOnce(symptomChain)
      .mockReturnValueOnce(noteChain);

    await getLogsForDate('u1', new Date('2024-03-10'));

    expect(mealChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(symptomChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(noteChain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  test('returns empty arrays when tables have no data', async () => {
    mockFrom
      .mockReturnValueOnce(dateQueryChain([]))
      .mockReturnValueOnce(dateQueryChain([]))
      .mockReturnValueOnce(dateQueryChain([]));

    const result = await getLogsForDate('u1', new Date('2024-03-10'));
    expect(result.meals).toEqual([]);
    expect(result.symptoms).toEqual([]);
    expect(result.notes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------

describe('getUserProfile', () => {
  test('returns profile when found', async () => {
    mockFrom.mockReturnValueOnce(selectChain(mockProfile));
    const result = await getUserProfile('u1');
    expect(result).toEqual(mockProfile);
  });

  test('returns null when no profile found', async () => {
    mockFrom.mockReturnValueOnce(selectChain(null));
    const result = await getUserProfile('u1');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createUserProfile
// ---------------------------------------------------------------------------

describe('createUserProfile', () => {
  test('inserts profile with onboarding_completed = true', async () => {
    const chain = insertChain(mockProfile);
    mockFrom.mockReturnValueOnce(chain);

    await createUserProfile('u1', ['bloating'], ['dairy']);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.onboarding_completed).toBe(true);
    expect(payload.id).toBe('u1');
    expect(payload.goals).toEqual(['bloating']);
    expect(payload.suspected_triggers).toEqual(['dairy']);
  });

  test('sets optional basics fields to null when not provided', async () => {
    const chain = insertChain(mockProfile);
    mockFrom.mockReturnValueOnce(chain);

    await createUserProfile('u1', ['pain'], []);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.gender).toBeNull();
    expect(payload.age).toBeNull();
    expect(payload.height_cm).toBeNull();
    expect(payload.weight_kg).toBeNull();
  });

  test('includes basics when provided', async () => {
    const chain = insertChain(mockProfile);
    mockFrom.mockReturnValueOnce(chain);

    await createUserProfile('u1', ['fatigue'], [], { gender: 'female', age: 30 });

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.gender).toBe('female');
    expect(payload.age).toBe(30);
  });

  test('defaults custom_triggers to empty array', async () => {
    const chain = insertChain(mockProfile);
    mockFrom.mockReturnValueOnce(chain);

    await createUserProfile('u1', ['bloating'], []);

    const payload = chain.insert.mock.calls[0][0];
    expect(payload.custom_triggers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// upsertHypothesis
// ---------------------------------------------------------------------------

describe('upsertHypothesis', () => {
  const baseHypothesis = {
    user_id: 'u1',
    trigger_category: 'dairy' as const,
    symptom: 'bloating' as const,
    confidence: 'low' as const,
    occurrences: 2,
    supporting_meal_ids: ['m1', 'm2'],
    supporting_symptom_ids: ['s1', 's2'],
    explanation: 'Dairy appeared before bloating in 2 logs.',
    disclaimer: 'Correlation only.',
  };

  test('performs INSERT when no existing hypothesis found', async () => {
    // First from() call: select existing → returns null
    mockFrom.mockReturnValueOnce(selectChain(null));
    // Second from() call: insert new
    const insertC = insertChain({ id: 'h1', ...baseHypothesis, created_at: NOW.toISOString(), updated_at: NOW.toISOString() });
    mockFrom.mockReturnValueOnce(insertC);

    const result = await upsertHypothesis(baseHypothesis);

    expect(insertC.insert).toHaveBeenCalledWith(baseHypothesis);
    expect(result).not.toBeNull();
  });

  test('performs UPDATE when existing hypothesis found', async () => {
    // First from() call: select returns existing id
    mockFrom.mockReturnValueOnce(selectChain({ id: 'h1' }));
    // Second from() call: update
    const updateC = updateChain({ id: 'h1', ...baseHypothesis, created_at: NOW.toISOString(), updated_at: NOW.toISOString() });
    mockFrom.mockReturnValueOnce(updateC);

    await upsertHypothesis(baseHypothesis);

    expect(updateC.update).toHaveBeenCalledWith(
      expect.objectContaining({ ...baseHypothesis, updated_at: expect.any(String) })
    );
    expect(updateC.eq).toHaveBeenCalledWith('id', 'h1');
  });
});
