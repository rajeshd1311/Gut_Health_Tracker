import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { UtensilsCrossed, Activity, StickyNote, Trash2 } from 'lucide-react-native';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getTodayLogs, deleteMealLog, deleteSymptomLog, deleteNoteLog } from '@/services/database';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';

export default function TimelineScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const data = await getTodayLogs(user.id);
    const combined: TimelineEntry[] = [
      ...data.meals.map(m => ({ type: 'meal' as const, data: m })),
      ...data.symptoms.map(s => ({ type: 'symptom' as const, data: s })),
      ...data.notes.map(n => ({ type: 'note' as const, data: n })),
    ].sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());
    setEntries(combined);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (entry: TimelineEntry) => {
    let success = false;
    if (entry.type === 'meal') {
      success = await deleteMealLog(entry.data.id);
    } else if (entry.type === 'symptom') {
      success = await deleteSymptomLog(entry.data.id);
    } else {
      success = await deleteNoteLog(entry.data.id);
    }
    if (success) {
      setEntries(prev => prev.filter(e => e.data.id !== entry.data.id));
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const renderEntry = (entry: TimelineEntry) => {
    if (entry.type === 'meal') {
      const meal = entry.data as MealLog;
      return (
        <View key={meal.id} style={[styles.card, { borderLeftColor: COLORS.primary }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <UtensilsCrossed color={COLORS.primary} size={18} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>{meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</Text>
              <Text style={styles.cardTime}>{formatTime(meal.timestamp)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.deleteButton}>
              <Trash2 color={COLORS.textTertiary} size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDescription}>{meal.description}</Text>
          {meal.trigger_categories.length > 0 && (
            <View style={styles.tagRow}>
              {meal.trigger_categories.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}
          {meal.notes ? <Text style={styles.cardNotes}>{meal.notes}</Text> : null}
        </View>
      );
    }

    if (entry.type === 'symptom') {
      const symptom = entry.data as SymptomLog;
      return (
        <View key={symptom.id} style={[styles.card, { borderLeftColor: COLORS.warning }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: COLORS.symptomCard }]}>
              <Activity color={COLORS.warning} size={18} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>Symptoms</Text>
              <Text style={styles.cardTime}>{formatTime(symptom.timestamp)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.deleteButton}>
              <Trash2 color={COLORS.textTertiary} size={16} />
            </TouchableOpacity>
          </View>
          <View style={styles.tagRow}>
            {symptom.symptoms.map(s => (
              <View key={s} style={[styles.tag, { backgroundColor: COLORS.symptomCard }]}>
                <Text style={[styles.tagText, { color: COLORS.warning }]}>{s.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.cardDescription}>Severity: {symptom.severity}/10</Text>
          {symptom.notes ? <Text style={styles.cardNotes}>{symptom.notes}</Text> : null}
        </View>
      );
    }

    const note = entry.data as NoteLog;
    return (
      <View key={note.id} style={[styles.card, { borderLeftColor: COLORS.secondary }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.noteCard }]}>
            <StickyNote color={COLORS.secondary} size={18} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardType}>{note.category.charAt(0).toUpperCase() + note.category.slice(1)}</Text>
            <Text style={styles.cardTime}>{formatTime(note.timestamp)}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.deleteButton}>
            <Trash2 color={COLORS.textTertiary} size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDescription}>{note.content}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No entries yet today</Text>
          <Text style={styles.emptyText}>Your meals, symptoms, and notes will appear here in chronological order.</Text>
        </View>
      ) : (
        entries.map(renderEntry)
      )}
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
    paddingTop: 60,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.mealCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  deleteButton: {
    padding: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardNotes: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.mealCard,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
