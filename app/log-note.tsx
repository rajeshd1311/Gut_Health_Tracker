import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, NOTE_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { createNoteLog } from '@/services/database';
import { NoteCategory } from '@/types/database';

export default function LogNoteScreen() {
  const { user } = useAuth();
  const [category, setCategory] = useState<NoteCategory>('other');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim()) {
      setError('Please add some content to your note.');
      return;
    }
    setError(null);
    setSaving(true);
    const result = await createNoteLog(user.id, content.trim(), category);
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

      <Text style={styles.title}>Add a Note</Text>
      <Text style={styles.subtitle}>Context that may affect how you feel</Text>

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
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Note'}</Text>
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
    marginBottom: 10,
    marginTop: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: COLORS.secondary,
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
