import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SYMPTOMS, EDIT_WINDOW_DAYS, isWithinEditWindow } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { createSymptomLog, updateSymptomLog } from '@/services/database';
import { Symptom, SymptomLog } from '@/types/database';
import DateTimePicker from '@/components/DateTimePicker';

export default function LogSymptomScreen() {
  const { user } = useAuth();
  const { id, entry: entryParam } = useLocalSearchParams<{ id?: string; entry?: string }>();
  const isEdit = !!id;
  const editEntry: SymptomLog | null = entryParam ? JSON.parse(entryParam) : null;

  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>(
    (editEntry?.symptoms as Symptom[]) ?? []
  );
  const [timestamp, setTimestamp] = useState(() =>
    editEntry ? new Date(editEntry.timestamp) : new Date()
  );
  const [severity, setSeverity] = useState(editEntry?.severity ?? 5);
  const [notes, setNotes] = useState(editEntry?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (symptom: Symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    if (isEdit && editEntry && !isWithinEditWindow(editEntry.timestamp)) {
      setError(`Entries older than ${EDIT_WINDOW_DAYS} days cannot be edited.`);
      return;
    }
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }
    setError(null);
    setSaving(true);

    let success = false;
    if (isEdit && id) {
      const result = await updateSymptomLog(id, {
        symptoms: selectedSymptoms,
        severity,
        notes: notes.trim(),
        timestamp: timestamp.toISOString(),
      });
      success = !!result;
    } else {
      const result = await createSymptomLog(user.id, selectedSymptoms, severity, notes.trim(), timestamp);
      success = !!result;
    }

    setSaving(false);
    if (success) {
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

      <Text style={styles.title}>{isEdit ? 'Edit Symptoms' : 'Log Symptoms'}</Text>
      <Text style={styles.subtitle}>How are you feeling?</Text>

      <DateTimePicker
        label="When did symptoms start?"
        value={timestamp}
        onChange={setTimestamp}
      />

      <Text style={styles.label}>Select Symptoms</Text>
      <View style={styles.chipContainer}>
        {SYMPTOMS.map(symptom => (
          <TouchableOpacity
            key={symptom.value}
            style={[styles.chip, selectedSymptoms.includes(symptom.value) && styles.chipSelected]}
            onPress={() => toggleSymptom(symptom.value)}
          >
            <Text style={[styles.chipText, selectedSymptoms.includes(symptom.value) && styles.chipTextSelected]}>
              {symptom.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Severity: {severity}/10</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Mild</Text>
        <View style={styles.sliderTrack}>
          {Array.from({ length: 11 }, (_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.sliderDot,
                i <= severity && styles.sliderDotActive,
                i === severity && styles.sliderDotCurrent,
              ]}
              onPress={() => setSeverity(i)}
            />
          ))}
        </View>
        <Text style={styles.sliderLabel}>Severe</Text>
      </View>
      <View style={styles.severityNumbers}>
        {Array.from({ length: 11 }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => setSeverity(i)} style={styles.severityNumberTouch}>
            <Text style={[styles.severityNumber, i === severity && styles.severityNumberActive]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Started 2 hours after lunch"
        placeholderTextColor={COLORS.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Symptoms'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backButton: { marginBottom: 16, width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10, marginTop: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  chipTextSelected: { color: COLORS.textInverse },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderTrack: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', height: 40,
  },
  sliderDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.border },
  sliderDotActive: { backgroundColor: COLORS.warningLight },
  sliderDotCurrent: { backgroundColor: COLORS.warning, width: 22, height: 22, borderRadius: 11 },
  sliderLabel: { fontSize: 11, color: COLORS.textTertiary },
  severityNumbers: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 36, marginTop: 4 },
  severityNumberTouch: { padding: 4 },
  severityNumber: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center' },
  severityNumberActive: { color: COLORS.warning, fontWeight: '700' },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, minHeight: 60, textAlignVertical: 'top',
  },
  error: { color: COLORS.error, fontSize: 14, textAlign: 'center', marginTop: 12 },
  saveButton: { backgroundColor: COLORS.warning, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 24 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.textInverse, fontSize: 16, fontWeight: '600' },
});
