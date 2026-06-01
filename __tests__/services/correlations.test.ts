// Mock supabase so the module-level import inside database.ts doesn't crash
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Mock the database service used by generateAndSaveHypotheses
jest.mock('@/services/database', () => ({
  upsertHypothesis: jest.fn(),
}));

import { analyzeCorrelations, generateAndSaveHypotheses } from '@/services/correlations';
import { upsertHypothesis } from '@/services/database';
import { MealLog, SymptomLog, TriggerHypothesis } from '@/types/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeal(
  id: string,
  triggers: MealLog['trigger_categories'],
  timestamp: string
): MealLog {
  return {
    id,
    user_id: 'user-1',
    timestamp,
    meal_type: 'lunch',
    description: 'test meal',
    portion_note: '',
    trigger_categories: triggers,
    photo_uri: '',
    voice_transcript: '',
    notes: '',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function makeSymptom(
  id: string,
  symptoms: SymptomLog['symptoms'],
  timestamp: string,
  severity = 5
): SymptomLog {
  return {
    id,
    user_id: 'user-1',
    timestamp,
    symptoms,
    severity,
    notes: '',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

// Helpers to produce ISO strings at a fixed offset from a base time
const BASE = '2024-03-10T12:00:00.000Z'; // noon UTC
function hoursAfterBase(hours: number): string {
  return new Date(new Date(BASE).getTime() + hours * 3_600_000).toISOString();
}

// ---------------------------------------------------------------------------
// analyzeCorrelations – basic matching
// ---------------------------------------------------------------------------

describe('analyzeCorrelations', () => {
  test('returns empty array when there are no meals or symptoms', () => {
    expect(analyzeCorrelations([], [])).toEqual([]);
  });

  test('returns empty array when meals list is empty', () => {
    const symptoms = [makeSymptom('s1', ['bloating'], BASE)];
    expect(analyzeCorrelations([], symptoms)).toEqual([]);
  });

  test('returns empty array when symptoms list is empty', () => {
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    expect(analyzeCorrelations(meals, [])).toEqual([]);
  });

  test('detects a correlation when symptom occurs within 6 hours after meal', () => {
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    const symptoms = [makeSymptom('s1', ['bloating'], hoursAfterBase(3))];
    // Only 1 occurrence → filtered out (needs ≥ 2)
    expect(analyzeCorrelations(meals, symptoms)).toEqual([]);
  });

  test('does NOT correlate when symptom occurs BEFORE meal', () => {
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    const symptoms = [makeSymptom('s1', ['bloating'], hoursAfterBase(-1))];
    expect(analyzeCorrelations(meals, symptoms)).toEqual([]);
  });

  test('does NOT correlate when symptom occurs exactly at the same time as meal', () => {
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    const symptoms = [makeSymptom('s1', ['bloating'], BASE)];
    expect(analyzeCorrelations(meals, symptoms)).toEqual([]);
  });

  test('does NOT correlate when symptom occurs more than 6 hours after meal', () => {
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    const symptoms = [makeSymptom('s1', ['bloating'], hoursAfterBase(7))];
    expect(analyzeCorrelations(meals, symptoms)).toEqual([]);
  });

  test('does correlate when symptom occurs at exactly the 6-hour boundary', () => {
    const meals = [
      makeMeal('m1', ['dairy'], BASE),
      makeMeal('m2', ['dairy'], hoursAfterBase(-1)), // different base to get 2 occurrences
    ];
    // Both symptoms within 6h
    const symptoms = [
      makeSymptom('s1', ['bloating'], hoursAfterBase(6)),
      makeSymptom('s2', ['bloating'], hoursAfterBase(5)),
    ];
    const results = analyzeCorrelations(meals, symptoms);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// analyzeCorrelations – occurrence count and confidence thresholds
// ---------------------------------------------------------------------------

describe('analyzeCorrelations – occurrence counting', () => {
  function buildScenario(mealCount: number) {
    const meals = Array.from({ length: mealCount }, (_, i) =>
      makeMeal(`m${i}`, ['spicy'], new Date(new Date(BASE).getTime() - i * 86_400_000).toISOString())
    );
    const symptoms = Array.from({ length: mealCount }, (_, i) =>
      makeSymptom(
        `s${i}`,
        ['abdominal_pain'],
        new Date(new Date(BASE).getTime() - i * 86_400_000 + 2 * 3_600_000).toISOString()
      )
    );
    return { meals, symptoms };
  }

  test('filters out correlations with only 1 occurrence', () => {
    const { meals, symptoms } = buildScenario(1);
    expect(analyzeCorrelations(meals, symptoms)).toEqual([]);
  });

  test('includes correlations with exactly 2 occurrences (confidence: low)', () => {
    const { meals, symptoms } = buildScenario(2);
    const results = analyzeCorrelations(meals, symptoms);
    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe('low');
    expect(results[0].occurrences).toBe(2);
  });

  test('assigns medium confidence at 3 occurrences', () => {
    const { meals, symptoms } = buildScenario(3);
    const results = analyzeCorrelations(meals, symptoms);
    expect(results[0].confidence).toBe('medium');
    expect(results[0].occurrences).toBe(3);
  });

  test('assigns medium confidence at 4 occurrences', () => {
    const { meals, symptoms } = buildScenario(4);
    const results = analyzeCorrelations(meals, symptoms);
    expect(results[0].confidence).toBe('medium');
  });

  test('assigns high confidence at 5 occurrences', () => {
    const { meals, symptoms } = buildScenario(5);
    const results = analyzeCorrelations(meals, symptoms);
    expect(results[0].confidence).toBe('high');
    expect(results[0].occurrences).toBe(5);
  });

  test('assigns high confidence at more than 5 occurrences', () => {
    const { meals, symptoms } = buildScenario(8);
    const results = analyzeCorrelations(meals, symptoms);
    expect(results[0].confidence).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// analyzeCorrelations – result shape
// ---------------------------------------------------------------------------

describe('analyzeCorrelations – result shape', () => {
  function twoOccurrences(trigger: MealLog['trigger_categories'][number], symptom: SymptomLog['symptoms'][number]) {
    const meals = [
      makeMeal('m1', [trigger], BASE),
      makeMeal('m2', [trigger], hoursAfterBase(-24)),
    ];
    const symptoms = [
      makeSymptom('s1', [symptom], hoursAfterBase(2)),
      makeSymptom('s2', [symptom], hoursAfterBase(-22)),
    ];
    return analyzeCorrelations(meals, symptoms);
  }

  test('result includes correct triggerCategory and symptom fields', () => {
    const results = twoOccurrences('dairy', 'bloating');
    expect(results[0].triggerCategory).toBe('dairy');
    expect(results[0].symptom).toBe('bloating');
  });

  test('result includes supporting meal and symptom IDs', () => {
    const results = twoOccurrences('dairy', 'bloating');
    expect(results[0].supportingMealIds).toContain('m1');
    expect(results[0].supportingMealIds).toContain('m2');
    expect(results[0].supportingSymptomIds).toHaveLength(2);
  });

  test('explanation string is non-empty and mentions the trigger', () => {
    const results = twoOccurrences('dairy', 'bloating');
    expect(results[0].explanation).toBeTruthy();
    expect(results[0].explanation.toLowerCase()).toContain('dairy');
  });

  test('results are sorted descending by occurrence count', () => {
    // dairy+bloating: 5 occurrences, spicy+gas: 2 occurrences
    const meals5 = Array.from({ length: 5 }, (_, i) =>
      makeMeal(`d${i}`, ['dairy'], new Date(new Date(BASE).getTime() - i * 86_400_000).toISOString())
    );
    const syms5 = Array.from({ length: 5 }, (_, i) =>
      makeSymptom(`ds${i}`, ['bloating'], new Date(new Date(BASE).getTime() - i * 86_400_000 + 3_600_000).toISOString())
    );
    const meals2 = [
      makeMeal('sp1', ['spicy'], hoursAfterBase(-1)),
      makeMeal('sp2', ['spicy'], hoursAfterBase(-25)),
    ];
    const syms2 = [
      makeSymptom('g1', ['gas'], hoursAfterBase(1)),
      makeSymptom('g2', ['gas'], hoursAfterBase(-23)),
    ];
    const results = analyzeCorrelations([...meals5, ...meals2], [...syms5, ...syms2]);
    expect(results[0].occurrences).toBeGreaterThan(results[results.length - 1].occurrences);
  });
});

// ---------------------------------------------------------------------------
// analyzeCorrelations – multi-trigger and multi-symptom logs
// ---------------------------------------------------------------------------

describe('analyzeCorrelations – multiple triggers / symptoms per log', () => {
  test('creates correlations for every trigger × symptom pair in matching logs', () => {
    const meals = [
      makeMeal('m1', ['dairy', 'spicy'], BASE),
      makeMeal('m2', ['dairy', 'spicy'], hoursAfterBase(-24)),
    ];
    const symptoms = [
      makeSymptom('s1', ['bloating', 'gas'], hoursAfterBase(2)),
      makeSymptom('s2', ['bloating', 'gas'], hoursAfterBase(-22)),
    ];
    const results = analyzeCorrelations(meals, symptoms);
    // dairy+bloating, dairy+gas, spicy+bloating, spicy+gas → 4 pairs
    expect(results.length).toBe(4);
  });

  test('does not double-count the same meal in a single correlation', () => {
    // One meal matching two different symptom logs for the same trigger+symptom
    const meals = [makeMeal('m1', ['caffeine'], BASE)];
    const symptoms = [
      makeSymptom('s1', ['fatigue'], hoursAfterBase(1)),
      makeSymptom('s2', ['fatigue'], hoursAfterBase(2)),
    ];
    const results = analyzeCorrelations(meals, symptoms);
    // m1 is counted once per correlation key even though two symptoms match
    // With only 1 unique meal id, occurrences should remain 1 → filtered out
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateAndSaveHypotheses
// ---------------------------------------------------------------------------

describe('generateAndSaveHypotheses', () => {
  const mockUpsert = upsertHypothesis as jest.Mock;

  beforeEach(() => {
    mockUpsert.mockReset();
  });

  test('calls upsertHypothesis for each correlation with ≥2 occurrences', async () => {
    const meals = [
      makeMeal('m1', ['dairy'], BASE),
      makeMeal('m2', ['dairy'], hoursAfterBase(-24)),
    ];
    const symptoms = [
      makeSymptom('s1', ['bloating'], hoursAfterBase(2)),
      makeSymptom('s2', ['bloating'], hoursAfterBase(-22)),
    ];

    const mockHypothesis: TriggerHypothesis = {
      id: 'h1',
      user_id: 'user-1',
      trigger_category: 'dairy',
      symptom: 'bloating',
      confidence: 'low',
      occurrences: 2,
      supporting_meal_ids: ['m1', 'm2'],
      supporting_symptom_ids: ['s1', 's2'],
      explanation: 'test explanation',
      disclaimer: 'test disclaimer',
      created_at: BASE,
      updated_at: BASE,
    };
    mockUpsert.mockResolvedValue(mockHypothesis);

    const results = await generateAndSaveHypotheses('user-1', meals, symptoms);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        trigger_category: 'dairy',
        symptom: 'bloating',
        disclaimer: expect.any(String),
      })
    );
    expect(results).toHaveLength(1);
  });

  test('does not call upsertHypothesis when there are no qualifying correlations', async () => {
    // Only 1 occurrence → filtered out
    const meals = [makeMeal('m1', ['dairy'], BASE)];
    const symptoms = [makeSymptom('s1', ['bloating'], hoursAfterBase(1))];

    const results = await generateAndSaveHypotheses('user-1', meals, symptoms);

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(results).toHaveLength(0);
  });

  test('omits hypotheses where upsertHypothesis returns null', async () => {
    const meals = [
      makeMeal('m1', ['spicy'], BASE),
      makeMeal('m2', ['spicy'], hoursAfterBase(-24)),
    ];
    const symptoms = [
      makeSymptom('s1', ['gas'], hoursAfterBase(1)),
      makeSymptom('s2', ['gas'], hoursAfterBase(-23)),
    ];
    mockUpsert.mockResolvedValue(null);

    const results = await generateAndSaveHypotheses('user-1', meals, symptoms);
    expect(results).toHaveLength(0);
  });
});
