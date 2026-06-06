import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { UtensilsCrossed, Activity, StickyNote, Trash2, Pencil, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { COLORS, EDIT_WINDOW_DAYS, isWithinEditWindow } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getLogsForDate, deleteMealLog, deleteSymptomLog, deleteNoteLog } from '@/services/database';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateLabel(date: Date): string {
  if (isSameDay(date, getYesterday())) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(getYesterday);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (date: Date) => {
    if (!user) return;
    const data = await getLogsForDate(user.id, date);
    const combined: TimelineEntry[] = [
      ...data.meals.map(m => ({ type: 'meal' as const, data: m })),
      ...data.symptoms.map(s => ({ type: 'symptom' as const, data: s })),
      ...data.notes.map(n => ({ type: 'note' as const, data: n })),
    ].sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());
    setEntries(combined);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(selectedDate); }, [loadData, selectedDate]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedDate);
    setRefreshing(false);
  };

  const goToPrev = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNext = () => {
    if (isSameDay(selectedDate, getYesterday())) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const isNextDisabled = isSameDay(selectedDate, getYesterday());

  const endOfSelectedDay = new Date(selectedDate);
  endOfSelectedDay.setHours(23, 59, 59, 999);
  const isDayReadOnly = !isWithinEditWindow(endOfSelectedDay.toISOString());

  const handleDelete = async (entry: TimelineEntry) => {
    if (!isWithinEditWindow(entry.data.timestamp)) return;
    let success = false;
    if (entry.type === 'meal') success = await deleteMealLog(entry.data.id);
    else if (entry.type === 'symptom') success = await deleteSymptomLog(entry.data.id);
    else success = await deleteNoteLog(entry.data.id);
    if (success) setEntries(prev => prev.filter(e => e.data.id !== entry.data.id));
  };

  const handleEdit = (entry: TimelineEntry) => {
    if (!isWithinEditWindow(entry.data.timestamp)) return;
    const params = { id: entry.data.id, entry: JSON.stringify(entry.data) };
    if (entry.type === 'meal') router.push({ pathname: '/log-meal', params });
    else if (entry.type === 'symptom') router.push({ pathname: '/log-symptom', params });
    else router.push({ pathname: '/log-note', params });
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const renderActions = (entry: TimelineEntry) => {
    if (isWithinEditWindow(entry.data.timestamp)) {
      return (
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEdit(entry)} style={styles.actionBtn}>
            <Pencil color={COLORS.textTertiary} size={15} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.actionBtn}>
            <Trash2 color={COLORS.textTertiary} size={15} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.readOnlyBadge}>
        <Lock color={COLORS.textTertiary} size={11} />
        <Text style={styles.readOnlyText}>Read only</Text>
      </View>
    );
  };

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
            {renderActions(entry)}
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
            {renderActions(entry)}
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
          {renderActions(entry)}
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
      <Text style={styles.title}>History</Text>

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPrev} style={styles.navButton}>
          <ChevronLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
        <TouchableOpacity
          onPress={goToNext}
          style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
          disabled={isNextDisabled}
        >
          <ChevronRight color={isNextDisabled ? COLORS.textTertiary : COLORS.text} size={22} />
        </TouchableOpacity>
      </View>

      {isDayReadOnly && (
        <View style={styles.windowNotice}>
          <Lock color={COLORS.textSecondary} size={13} />
          <Text style={styles.windowNoticeText}>
            Entries older than {EDIT_WINDOW_DAYS} days are read-only
          </Text>
        </View>
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No entries logged</Text>
          <Text style={styles.emptyText}>Nothing was logged on this day.</Text>
        </View>
      ) : (
        entries.map(renderEntry)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  navButton: { padding: 10, borderRadius: 8 },
  navButtonDisabled: { opacity: 0.35 },
  dateLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  windowNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.borderLight, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  windowNoticeText: { fontSize: 13, color: COLORS.textSecondary },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
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
  readOnlyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.borderLight,
  },
  readOnlyText: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  cardNotes: { fontSize: 13, color: COLORS.textTertiary, marginTop: 6, fontStyle: 'italic' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.mealCard },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: '500', textTransform: 'capitalize' },
});
