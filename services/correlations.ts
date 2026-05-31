import { MealLog, SymptomLog, TriggerCategory, Symptom, Confidence, TriggerHypothesis } from '@/types/database';
import { TRIGGER_CATEGORIES, SYMPTOMS } from '@/lib/constants';
import { upsertHypothesis } from '@/services/database';

interface CorrelationResult {
  triggerCategory: TriggerCategory;
  symptom: Symptom;
  occurrences: number;
  confidence: Confidence;
  supportingMealIds: string[];
  supportingSymptomIds: string[];
  explanation: string;
}

const HOURS_WINDOW = 6;

function getConfidence(occurrences: number): Confidence {
  if (occurrences >= 5) return 'high';
  if (occurrences >= 3) return 'medium';
  return 'low';
}

function getTriggerLabel(category: TriggerCategory): string {
  return TRIGGER_CATEGORIES.find(t => t.value === category)?.label || category;
}

function getSymptomLabel(symptom: Symptom): string {
  return SYMPTOMS.find(s => s.value === symptom)?.label || symptom;
}

export function analyzeCorrelations(meals: MealLog[], symptoms: SymptomLog[]): CorrelationResult[] {
  const correlations: Map<string, CorrelationResult> = new Map();

  for (const symptomLog of symptoms) {
    const symptomTime = new Date(symptomLog.timestamp).getTime();

    for (const meal of meals) {
      const mealTime = new Date(meal.timestamp).getTime();
      const hoursDiff = (symptomTime - mealTime) / (1000 * 60 * 60);

      if (hoursDiff > 0 && hoursDiff <= HOURS_WINDOW) {
        for (const trigger of meal.trigger_categories) {
          for (const symptom of symptomLog.symptoms) {
            const key = `${trigger}::${symptom}`;
            const existing = correlations.get(key);

            if (existing) {
              if (!existing.supportingMealIds.includes(meal.id)) {
                existing.occurrences++;
                existing.supportingMealIds.push(meal.id);
                existing.supportingSymptomIds.push(symptomLog.id);
                existing.confidence = getConfidence(existing.occurrences);
                existing.explanation = buildExplanation(trigger, symptom, existing.occurrences);
              }
            } else {
              correlations.set(key, {
                triggerCategory: trigger as TriggerCategory,
                symptom: symptom as Symptom,
                occurrences: 1,
                confidence: 'low',
                supportingMealIds: [meal.id],
                supportingSymptomIds: [symptomLog.id],
                explanation: buildExplanation(trigger as TriggerCategory, symptom as Symptom, 1),
              });
            }
          }
        }
      }
    }
  }

  return Array.from(correlations.values())
    .filter(c => c.occurrences >= 2)
    .sort((a, b) => b.occurrences - a.occurrences);
}

function buildExplanation(trigger: TriggerCategory, symptom: Symptom, occurrences: number): string {
  const triggerLabel = getTriggerLabel(trigger);
  const symptomLabel = getSymptomLabel(symptom);
  return `${triggerLabel} appeared before ${symptomLabel.toLowerCase()} in ${occurrences} recent log${occurrences > 1 ? 's' : ''}. This may be worth watching.`;
}

export async function generateAndSaveHypotheses(
  userId: string,
  meals: MealLog[],
  symptoms: SymptomLog[]
): Promise<TriggerHypothesis[]> {
  const correlations = analyzeCorrelations(meals, symptoms);
  const results: TriggerHypothesis[] = [];

  for (const correlation of correlations) {
    const hypothesis = await upsertHypothesis({
      user_id: userId,
      trigger_category: correlation.triggerCategory,
      symptom: correlation.symptom,
      confidence: correlation.confidence,
      occurrences: correlation.occurrences,
      supporting_meal_ids: correlation.supportingMealIds,
      supporting_symptom_ids: correlation.supportingSymptomIds,
      explanation: correlation.explanation,
      disclaimer: 'Correlation only. Not a diagnosis. Discuss with a doctor or dietitian.',
    });
    if (hypothesis) results.push(hypothesis);
  }

  return results;
}
