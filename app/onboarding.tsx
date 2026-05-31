import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, GOALS, TRIGGER_CATEGORIES, GENDER_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { createUserProfile } from '@/services/database';
import { Goal, TriggerCategory, Gender } from '@/types/database';
import { Plus, X } from 'lucide-react-native';

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerCategory[]>([]);
  const [customTriggers, setCustomTriggers] = useState<string[]>([]);
  const [customTriggerInput, setCustomTriggerInput] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (goal: Goal) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleTrigger = (trigger: TriggerCategory) => {
    if (trigger === 'not_sure') {
      setSelectedTriggers(['not_sure']);
      return;
    }
    setSelectedTriggers(prev => {
      const filtered = prev.filter(t => t !== 'not_sure');
      return filtered.includes(trigger)
        ? filtered.filter(t => t !== trigger)
        : [...filtered, trigger];
    });
  };

  const addCustomTrigger = () => {
    const trimmed = customTriggerInput.trim();
    if (trimmed && !customTriggers.includes(trimmed)) {
      setCustomTriggers(prev => [...prev, trimmed]);
      setCustomTriggerInput('');
      setSelectedTriggers(prev => prev.filter(t => t !== 'not_sure'));
    }
  };

  const removeCustomTrigger = (trigger: string) => {
    setCustomTriggers(prev => prev.filter(t => t !== trigger));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const basics = {
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      height_cm: heightCm ? parseFloat(heightCm) : undefined,
      weight_kg: weightKg ? parseFloat(weightKg) : undefined,
    };

    const result = await createUserProfile(
      user.id,
      selectedGoals,
      selectedTriggers,
      basics,
      customTriggers
    );

    if (!result) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
    router.replace('/(tabs)');
  };

  // Step 0: Welcome / Get Started with explanation + basics
  if (step === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Let's get you set up</Text>
          <Text style={styles.title}>A little about you</Text>
          <Text style={styles.subtitle}>
            We ask for a few basics so the app can provide more relevant insights. For example, age and gender can influence how your gut responds to certain foods. This data stays private and is never shared.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gender</Text>
          <View style={styles.chipContainer}>
            {GENDER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, gender === option.value && styles.chipSelected]}
                onPress={() => setGender(option.value)}
              >
                <Text style={[styles.chipText, gender === option.value && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 32"
            placeholderTextColor={COLORS.textTertiary}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.cardTitle}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 170"
                placeholderTextColor={COLORS.textTertiary}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.cardTitle}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 68"
                placeholderTextColor={COLORS.textTertiary}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <Text style={styles.optionalNote}>
          All fields are optional. You can skip any you are not comfortable sharing.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(1)}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 1: Goals
  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
          <Text style={styles.title}>Your main concerns</Text>
          <Text style={styles.subtitle}>What symptoms affect your daily life? This helps us prioritize which patterns to look for.</Text>
        </View>

        <View style={styles.chipContainer}>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal.value}
              style={[styles.chip, selectedGoals.includes(goal.value) && styles.chipSelected]}
              onPress={() => toggleGoal(goal.value)}
            >
              <Text style={[styles.chipText, selectedGoals.includes(goal.value) && styles.chipTextSelected]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, selectedGoals.length === 0 && styles.buttonDisabled]}
          onPress={() => setStep(2)}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep(0)} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 2: Suspected triggers
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step 2 of 2</Text>
        <Text style={styles.title}>Suspected triggers</Text>
        <Text style={styles.subtitle}>
          Which foods do you think might be causing issues? Select all that apply, or choose "Not Sure" if you are still figuring it out.
        </Text>
      </View>

      <View style={styles.chipContainer}>
        {TRIGGER_CATEGORIES.map(trigger => (
          <TouchableOpacity
            key={trigger.value}
            style={[styles.chip, selectedTriggers.includes(trigger.value) && styles.chipSelected]}
            onPress={() => toggleTrigger(trigger.value)}
          >
            <Text style={[styles.chipText, selectedTriggers.includes(trigger.value) && styles.chipTextSelected]}>
              {trigger.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customTriggerSection}>
        <Text style={styles.customTriggerLabel}>Add your own suspected triggers</Text>
        <View style={styles.customTriggerRow}>
          <TextInput
            style={styles.customTriggerInput}
            placeholder="e.g. Citrus, Soy, Corn..."
            placeholderTextColor={COLORS.textTertiary}
            value={customTriggerInput}
            onChangeText={setCustomTriggerInput}
            onSubmitEditing={addCustomTrigger}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, !customTriggerInput.trim() && styles.addButtonDisabled]}
            onPress={addCustomTrigger}
            disabled={!customTriggerInput.trim()}
          >
            <Plus size={20} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>

        {customTriggers.length > 0 && (
          <View style={styles.customChipContainer}>
            {customTriggers.map(trigger => (
              <View key={trigger} style={styles.customChip}>
                <Text style={styles.customChipText}>{trigger}</Text>
                <TouchableOpacity onPress={() => removeCustomTrigger(trigger)} style={styles.removeButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Setting up...' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  optionalNote: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
  },
  customTriggerSection: {
    marginBottom: 32,
  },
  customTriggerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  customTriggerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customTriggerInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  customChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mealCard,
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 6,
  },
  customChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  removeButton: {
    padding: 4,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
