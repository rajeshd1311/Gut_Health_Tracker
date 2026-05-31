import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { UtensilsCrossed, Activity, StickyNote } from 'lucide-react-native';
import { COLORS, REWARD_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getTodayLogs } from '@/services/database';
import { MealLog, SymptomLog, NoteLog } from '@/types/database';

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

  const todayReward = REWARD_MESSAGES[new Date().getDate() % REWARD_MESSAGES.length];
  const totalLogs = meals.length + symptoms.length;

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

      {meals.length === 0 && symptoms.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start your day</Text>
          <Text style={styles.emptyText}>
            Log your first meal or how you are feeling to begin building your pattern history.
          </Text>
        </View>
      )}

      {meals.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          {meals.slice(-3).reverse().map(meal => (
            <View key={meal.id} style={styles.recentItem}>
              <View style={[styles.recentDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.recentContent}>
                <Text style={styles.recentLabel}>{meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</Text>
                <Text style={styles.recentDescription} numberOfLines={1}>{meal.description}</Text>
              </View>
              <Text style={styles.recentTime}>
                {new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {symptoms.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Symptoms</Text>
          {symptoms.slice(-3).reverse().map(symptom => (
            <View key={symptom.id} style={styles.recentItem}>
              <View style={[styles.recentDot, { backgroundColor: COLORS.warning }]} />
              <View style={styles.recentContent}>
                <Text style={styles.recentLabel}>
                  {symptom.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}
                </Text>
                <Text style={styles.recentDescription}>Severity: {symptom.severity}/10</Text>
              </View>
              <Text style={styles.recentTime}>
                {new Date(symptom.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          ))}
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
  actionButton: {
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
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  recentDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
