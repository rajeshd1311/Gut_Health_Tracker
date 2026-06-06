import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { UtensilsCrossed, Activity, StickyNote, Trash2, Pencil } from 'lucide-react-native';
import { COLORS, REWARD_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getTodayLogs, deleteMealLog, deleteSymptomLog, deleteNoteLog } from '@/services/database';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';

export default function HomeScreen() {
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

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (entry: TimelineEntry) => {
    let success = false;
    if (entry.type === 'meal') success = await deleteMealLog(entry.data.id);
    else if (entry.type === 'symptom') success = await deleteSymptomLog(entry.data.id);
    else success = await deleteNoteLog(entry.data.id);
    if (success) setEntries(prev => prev.filter(e => e.data.id !== entry.data.id));
  };

  const handleEdit = (entry: TimelineEntry) => {
    const params = { id: entry.data.id, entry: JSON.stringify(entry.data) };
    if (entry.type === 'meal') router.push({ pathname: '/log-meal', params });
    else if (entry.type === 'symptom') router.push({ pathname: '/log-symptom', params });
    else router.push({ pathname: '/log-note', params });
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const mealCount = entries.filter(e => e.type === 'meal').length;
  const symptomCount = entries.filter(e => e.type === 'symptom').length;
  const noteCount = entries.filter(e => e.type === 'note').length;
  const totalLogs = entries.length;
  const todayReward = REWARD_MESSAGES[new Date().getDate() % REWARD_MESSAGES.length];

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
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleEdit(entry)} style={styles.actionBtn}>
                <Pencil color={COLORS.textTertiary} size={15} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.actionBtn}>
                <Trash2 color={COLORS.textTertiary} size={15} />
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
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleEdit(entry)} style={styles.actionBtn}>
                <Pencil color={COLORS.textTertiary} size={15} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.actionBtn}>
                <Trash2 color={COLORS.textTertiary} size={15} />
              </TouchableOpacity>
            </View>
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
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(entry)} style={styles.actionBtn}>
              <Pencil color={COLORS.textTertiary} size={15} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.actionBtn}>
              <Trash2 color={COLORS.textTertiary} size={15} />
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
          style={[styles.actionButton, { backgroundColor: COLORS.mealCard }]}
          onPress={() => router.push('/log-meal')}
        >
          <UtensilsCrossed color={COLORS.primary} size={28} />
          <Text style={styles.actionLabel}>Log Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.symptomCard }]}
          onPress={() => router.push('/log-symptom')}
        >
          <Activity color={COLORS.warning} size={28} />
          <Text style={styles.actionLabel}>Log Symptom</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.noteCard }]}
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
            <Text style={styles.statNumber}>{mealCount}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{symptomCount}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{noteCount}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
        </View>
      </View>

      {totalLogs > 0 && (
        <View style={styles.rewardCard}>
          <Text style={styles.rewardText}>{todayReward}</Text>
          {totalLogs >= 3 && (
            <Text style={styles.rewardSubtext}>
              You logged {totalLogs} entries today. Most patterns become visible after repeated logs.
            </Text>
          )}
        </View>
      )}

      {totalLogs === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start your day</Text>
          <Text style={styles.emptyText}>
            Log your first meal or how you are feeling to begin building your pattern history.
          </Text>
        </View>
      ) : (
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Today's Entries</Text>
          {entries.map(renderEntry)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 32 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 30, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  date: { fontSize: 15, color: COLORS.textSecondary },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  progressCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  progressTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  progressStats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  rewardCard: {
    backgroundColor: COLORS.mealCard, borderRadius: 12, padding: 16,
    marginBottom: 24, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  rewardText: { fontSize: 14, color: COLORS.text, lineHeight: 20, fontWeight: '500' },
  rewardSubtext: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginTop: 8 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  entriesSection: { marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 12, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.mealCard,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardInfo: { flex: 1 },
  cardType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cardTime: { fontSize: 12, color: COLORS.textTertiary },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  cardNotes: { fontSize: 13, color: COLORS.textTertiary, marginTop: 6, fontStyle: 'italic' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.mealCard },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: '500', textTransform: 'capitalize' },
});
