import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Mic } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, MEAL_TYPES, TRIGGER_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { createMealLog } from '@/services/database';
import { MealType, TriggerCategory } from '@/types/database';
import DateTimePicker from '@/components/DateTimePicker';

export default function LogMealScreen() {
  const { user } = useAuth();
  const [mealType, setMealType] = useState<MealType>('snack');
  const [timestamp, setTimestamp] = useState(() => new Date());
  const [description, setDescription] = useState('');
  const [portionNote, setPortionNote] = useState('');
  const [triggers, setTriggers] = useState<TriggerCategory[]>([]);
  const [notes, setNotes] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTrigger = (trigger: TriggerCategory) => {
    setTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!description.trim()) {
      setError('Please describe what you ate or drank.');
      return;
    }
    setError(null);
    setSaving(true);
    const result = await createMealLog(
      user.id,
      mealType,
      description.trim(),
      triggers,
      portionNote.trim(),
      photoUri,
      voiceTranscript.trim(),
      notes.trim(),
      timestamp
    );
    setSaving(false);
    if (result) {
      router.back();
    } else {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color={COLORS.text} size={24} />
      </TouchableOpacity>

      <Text style={styles.title}>Log a Meal</Text>
      <Text style={styles.subtitle}>What did you eat or drink?</Text>

      <DateTimePicker
        label="When did you eat this?"
        value={timestamp}
        onChange={setTimestamp}
      />

      <Text style={styles.label}>Meal Type</Text>
      <View style={styles.typeRow}>
        {MEAL_TYPES.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[styles.typeChip, mealType === type.value && styles.typeChipSelected]}
            onPress={() => setMealType(type.value)}
          >
            <Text style={[styles.typeChipText, mealType === type.value && styles.typeChipTextSelected]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Cheese sandwich with coffee"
        placeholderTextColor={COLORS.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Portion / Quantity (optional)</Text>
      <TextInput
        style={styles.inputSmall}
        placeholder="e.g., 2 slices, large cup"
        placeholderTextColor={COLORS.textTertiary}
        value={portionNote}
        onChangeText={setPortionNote}
      />

      <Text style={styles.label}>Suspected Trigger Categories</Text>
      <Text style={styles.hint}>Select any that might apply to this meal</Text>
      <View style={styles.chipContainer}>
        {TRIGGER_CATEGORIES.map(trigger => (
          <TouchableOpacity
            key={trigger.value}
            style={[styles.chip, triggers.includes(trigger.value) && styles.chipSelected]}
            onPress={() => toggleTrigger(trigger.value)}
          >
            <Text style={[styles.chipText, triggers.includes(trigger.value) && styles.chipTextSelected]}>
              {trigger.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mediaRow}>
        <TouchableOpacity style={styles.mediaButton} onPress={handlePickImage}>
          <Camera color={COLORS.textSecondary} size={20} />
          <Text style={styles.mediaButtonText}>{photoUri ? 'Photo added' : 'Add Photo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mediaButton} onPress={() => {}}>
          <Mic color={COLORS.textSecondary} size={20} />
          <Text style={styles.mediaButtonText}>Voice Note</Text>
        </TouchableOpacity>
      </View>

      {!voiceTranscript && (
        <>
          <Text style={styles.label}>Voice Transcript (type if no mic)</Text>
          <TextInput
            style={styles.inputSmall}
            placeholder="Type what you would say..."
            placeholderTextColor={COLORS.textTertiary}
            value={voiceTranscript}
            onChangeText={setVoiceTranscript}
          />
        </>
      )}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.inputSmall}
        placeholder="e.g., Ate quickly, was stressed"
        placeholderTextColor={COLORS.textTertiary}
        value={notes}
        onChangeText={setNotes}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Meal'}</Text>
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
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeChipTextSelected: {
    color: COLORS.textInverse,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputSmall: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
