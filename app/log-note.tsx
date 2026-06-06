import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, NOTE_CATEGORIES, EDIT_WINDOW_DAYS, isWithinEditWindow } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { createNoteLog, updateNoteLog } from '@/services/database';
import { NoteCategory, NoteLog } from '@/types/database';
import DateTimePicker from '@/components/DateTimePicker';

export default function LogNoteScreen() {
  const { user } = useAuth();
  const { id, entry: entryParam } = useLocalSearchParams<{ id?: string; entry?: string }>();
  const isEdit = !!id;
  const editEntry: NoteLog | null = entryParam ? JSON.parse(entryParam) : null;

  const [category, setCategory] = useState<NoteCategory>((editEntry?.category as NoteCategory) ?? 'other');
  const [timestamp, setTimestamp] = useState(() =>
    editEntry ? new Date(editEntry.timestamp) : new Date()
  );
  const [content, setContent] = useState(editEntry?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    if (isEdit && editEntry && !isWithinEditWindow(editEntry.timestamp)) {
      setError(`Entries older than ${EDIT_WINDOW_DAYS} days cannot be edited.`);
      return;
    }
    if (!content.trim()) {
      setError('Please add some content to your note.');
      return;
    }
    setError(null);
    setSaving(true);

    let success = false;
    if (isEdit && id) {
      const result = await updateNoteLog(id, {
        content: content.trim(),
        category,
        timestamp: timestamp.toISOString(),
      });
      success = !!result;
    } else {
      const result = await createNoteLog(user.id, content.trim(), category, timestamp);
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

      <Text style={styles.title}>{isEdit ? 'Edit Note' : 'Add a Note'}</Text>
      <Text style={styles.subtitle}>Context that may affect how you feel</Text>

      <DateTimePicker
        label="When did this happen?"
        value={timestamp}
        onChange={setTimestamp}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipContainer}>
        {NOTE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.chip, category === cat.value && styles.chipSelected]}
            onPress={() => setCategory(cat.value)}
          >
            <Text style={[styles.chipText, category === cat.value && styles.chipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Poor sleep last night, took ibuprofen, stressful meeting"
        placeholderTextColor={COLORS.textTertiary}
        value={content}
        onChangeText={setContent}
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Note'}
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
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10, marginTop: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  chipTextSelected: { color: COLORS.textInverse },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: 15,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, minHeight: 120, textAlignVertical: 'top',
  },
  error: { color: COLORS.error, fontSize: 14, textAlign: 'center', marginTop: 12 },
  saveButton: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 24 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.textInverse, fontSize: 16, fontWeight: '600' },
});
