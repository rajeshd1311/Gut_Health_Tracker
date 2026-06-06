import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X, UtensilsCrossed, Activity, StickyNote, Pencil, Trash2, Lock } from 'lucide-react-native';
import { COLORS } from '@/lib/constants';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface DayLogsModalProps {
  visible: boolean;
  date: Date | null;
  meals: MealLog[];
  symptoms: SymptomLog[];
  notes: NoteLog[];
  loading: boolean;
  onClose: () => void;
  onEdit: (entry: TimelineEntry) => void;
  onDelete: (entry: TimelineEntry) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isEditLocked(timestamp: string): boolean {
  return Date.now() - new Date(timestamp).getTime() > SEVEN_DAYS_MS;
}

export default function DayLogsModal({
  visible,
  date,
  meals,
  symptoms,
  notes,
  loading,
  onClose,
  onEdit,
  onDelete,
}: DayLogsModalProps) {
  const allEntries: TimelineEntry[] = [
    ...meals.map(m => ({ type: 'meal' as const, data: m })),
    ...symptoms.map(s => ({ type: 'symptom' as const, data: s })),
    ...notes.map(n => ({ type: 'note' as const, data: n })),
  ].sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());

  const renderEntry = (entry: TimelineEntry) => {
    const locked = isEditLocked(entry.data.timestamp);

    const actionButtons = (
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => !locked && onEdit(entry)}
          style={styles.actionButton}
          accessibilityLabel={locked ? 'Edit locked' : 'Edit entry'}
        >
          {locked ? (
            <Lock color={COLORS.textTertiary} size={14} />
          ) : (
            <Pencil color={COLORS.textTertiary} size={14} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(entry)}
          style={styles.actionButton}
          accessibilityLabel="Delete entry"
        >
          <Trash2 color={COLORS.textTertiary} size={14} />
        </TouchableOpacity>
      </View>
    );

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
            {actionButtons}
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
          {locked && (
            <Text style={styles.lockedHint}>Edits locked after 7 days</Text>
          )}
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
            {actionButtons}
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
          {locked && (
            <Text style={styles.lockedHint}>Edits locked after 7 days</Text>
          )}
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
          {actionButtons}
        </View>
        <Text style={styles.cardDescription}>{note.content}</Text>
        {locked && (
          <Text style={styles.lockedHint}>Edits locked after 7 days</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>
                {date ? formatDate(date) : ''}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {allEntries.length} {allEntries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
            >
              <X size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : allEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No logs for this day</Text>
              <Text style={styles.emptyText}>
                Use the Today tab to log meals, symptoms, and notes.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {allEntries.map(renderEntry)}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
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
  lockedHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
