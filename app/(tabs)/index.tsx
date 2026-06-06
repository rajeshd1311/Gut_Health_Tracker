import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { UtensilsCrossed, Activity, StickyNote, Pencil, Trash2 } from 'lucide-react-native';
import { COLORS, REWARD_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getTodayLogs, deleteMealLog, deleteSymptomLog, deleteNoteLog } from '@/services/database';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [notes, setNotes] = useState<NoteLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const data = await getTodayLogs(user.id);
    setMeals(data.meals);
    setSymptoms(data.symptoms);
    setNotes(data.notes);
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

  const handleEdit = (entry: TimelineEntry) => {
    const params = { id: entry.data.id, entry: JSON.stringify(entry.data) };
    if (entry.type === 'meal') router.push({ pathname: '/log-meal', params });
    else if (entry.type === 'symptom') router.push({ pathname: '/log-symptom', params });
    else router.push({ pathname: '/log-note', params });
  };

  const handleDelete = async (entry: TimelineEntry) => {
    if (entry.type === 'meal') {
      const ok = await deleteMealLog(entry.data.id);
      if (ok) setMeals(prev => prev.filter(m => m.id !== entry.data.id));
    } else if (entry.type === 'symptom') {
      const ok = await deleteSymptomLog(entry.data.id);
      if (ok) setSymptoms(prev => prev.filter(s => s.id !== entry.data.id));
    } else {
      const ok = await deleteNoteLog(entry.data.id);
      if (ok) setNotes(prev => prev.filter(n => n.id !== entry.data.id));
    }
  };

  const todayReward = REWARD_MESSAGES[new Date().getDate() % REWARD_MESSAGES.length];
  const totalLogs = meals.length + symptoms.length + notes.length;
  const hasLogs = totalLogs > 0;

  const allEntries: TimelineEntry[] = [
    ...meals.map(m => ({ type: 'meal' as const, data: m })),
    ...symptoms.map(s => ({ type: 'symptom' as const, data: s })),
    ...notes.map(n => ({ type: 'note' as const, data: n })),
  ].sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());

  const renderEntry = (entry: TimelineEntry) => {
    if (entry.type === 'meal') {
      const meal = entry.data as MealLog;
      return (
        <View key={meal.id} style={[styles.card, { borderLeftColor: COLORS.primary }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <UtensilsCrossed color={COLORS.primary} size={16} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>
                {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
              </Text>
              <Text style={styles.cardTime}>{formatTime(meal.timestamp)}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(entry)}
                style={styles.actionButton}
                accessibilityLabel="Edit meal"
              >
                <Pencil color={COLORS.textTertiary} size={14} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(entry)}
                style={styles.actionButton}
                accessibilityLabel="Delete meal"
              >
                <Trash2 color={COLORS.textTertiary} size={14} />
              </TouchableOpacity>
            </View>
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
          {!!meal.notes && <Text style={styles.cardNotes}>{meal.notes}</Text>}
        </View>
      );
    }

    if (entry.type === 'symptom') {
      const symptom = entry.data as SymptomLog;
      return (
        <View key={symptom.id} style={[styles.card, { borderLeftColor: COLORS.warning }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: COLORS.symptomCard }]}>
              <Activity color={COLORS.warning} size={16} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>Symptoms</Text>
              <Text style={styles.cardTime}>{formatTime(symptom.timestamp)}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(entry)}
                style={styles.actionButton}
                accessibilityLabel="Edit symptom"
              >
                <Pencil color={COLORS.textTertiary} size={14} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(entry)}
                style={styles.actionButton}
                accessibilityLabel="Delete symptom"
              >
                <Trash2 color={COLORS.textTertiary} size={14} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.tagRow}>
            {symptom.symptoms.map(s => (
              <View key={s} style={[styles.tag, { backgroundColor: COLORS.symptomCard }]}>
                <Text style={[styles.tagText, { color: COLORS.warning }]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.cardDescription}>Severity: {symptom.severity}/10</Text>
          {!!symptom.notes && <Text style={styles.cardNotes}>{symptom.notes}</Text>}
        </View>
      );
    }

    const note = entry.data as NoteLog;
    return (
      <View key={note.id} style={[styles.card, { borderLeftColor: COLORS.secondary }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.noteCard }]}>
            <StickyNote color={COLORS.secondary} size={16} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardType}>
              {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
            </Text>
            <Text style={styles.cardTime}>{formatTime(note.timestamp)}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleEdit(entry)}
              style={styles.actionButton}
              accessibilityLabel="Edit note"
            >
              <Pencil color={COLORS.textTertiary} size={14} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(entry)}
              style={styles.actionButton}
              accessibilityLabel="Delete note"
            >
              <Trash2 color={COLORS.textTertiary} size={14} />
            </TouchableOpacity>
          </View>
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
      <View style={styles.header}>
        <Text style={styles.greeting}>Today</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton2, { backgroundColor: COLORS.mealCard }]}
          onPress={() => router.push('/log-meal')}
        >
          <UtensilsCrossed color={COLORS.primary} size={28} />
          <Text style={styles.actionLabel}>Log Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton2, { backgroundColor: COLORS.symptomCard }]}
          onPress={() => router.push('/log-symptom')}
        >
          <Activity color={COLORS.warning} size={28} />
          <Text style={styles.actionLabel}>Log Symptom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton2, { backgroundColor: COLORS.noteCard }]}
          onPress={() => router.push('/log-note')}
        >
          <StickyNote color={COLORS.secondary} size={28} />
          <Text style={styles.actionLabel}>Add Note</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Daily Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{meals.length}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{symptoms.length}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{notes.length}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
        </View>
      </View>

      {hasLogs && (
        <View style={styles.rewardCard}>
          <Text style={styles.rewardText}>{todayReward}</Text>
          {totalLogs >= 3 && (
            <Text style={styles.rewardSubtext}>
              You logged {totalLogs} entries today. Most patterns become visible after repeated logs.
            </Text>
          )}
        </View>
      )}

      {!hasLogs && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start your day</Text>
          <Text style={styles.emptyText}>
            Log your first meal or how you are feeling to begin building your pattern history.
          </Text>
        </View>
      )}

      {hasLogs && (
        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>Today's Logs</Text>
          {allEntries.map(renderEntry)}
        </View>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton2: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  rewardCard: {
    backgroundColor: COLORS.mealCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  rewardText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  rewardSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
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
  logsSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  cardIcon: {
    width: 30,
    height: 30,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 2,
  },
  actionButton: {
    padding: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardNotes: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: COLORS.mealCard,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
