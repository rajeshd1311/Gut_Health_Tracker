import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, SYMPTOMS, TRIGGER_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getLogsForDateRange } from '@/services/database';
import { MealLog, SymptomLog } from '@/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ChartsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const data = await getLogsForDateRange(user.id, startDate, endDate);
    setMeals(data.meals);
    setSymptoms(data.symptoms);
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

  const getDayLabels = () => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
  };

  const getMealsPerDay = () => {
    const counts: number[] = Array(7).fill(0);
    for (const meal of meals) {
      const daysAgo = Math.floor((Date.now() - new Date(meal.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 7) {
        counts[6 - daysAgo]++;
      }
    }
    return counts;
  };

  const getSymptomsPerDay = () => {
    const counts: number[] = Array(7).fill(0);
    for (const symptom of symptoms) {
      const daysAgo = Math.floor((Date.now() - new Date(symptom.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 7) {
        counts[6 - daysAgo]++;
      }
    }
    return counts;
  };

  const getTopSymptoms = () => {
    const counts: Map<string, number> = new Map();
    for (const log of symptoms) {
      for (const s of log.symptoms) {
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getTopTriggers = () => {
    const counts: Map<string, number> = new Map();
    for (const meal of meals) {
      for (const t of meal.trigger_categories) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const dayLabels = getDayLabels();
  const mealsPerDay = getMealsPerDay();
  const symptomsPerDay = getSymptomsPerDay();
  const topSymptoms = getTopSymptoms();
  const topTriggers = getTopTriggers();
  const maxMeals = Math.max(...mealsPerDay, 1);
  const maxSymptoms = Math.max(...symptomsPerDay, 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.title}>Charts</Text>
      <Text style={styles.subtitle}>Last 7 days overview</Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Meals Logged Per Day</Text>
        <View style={styles.barChart}>
          {mealsPerDay.map((count, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(count / maxMeals) * 100}%`, backgroundColor: COLORS.primary },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{dayLabels[i]}</Text>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Symptom Logs Per Day</Text>
        <View style={styles.barChart}>
          {symptomsPerDay.map((count, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(count / maxSymptoms) * 100}%`, backgroundColor: COLORS.warning },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{dayLabels[i]}</Text>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Top Symptoms</Text>
        {topSymptoms.length === 0 ? (
          <Text style={styles.noData}>No symptom data yet</Text>
        ) : (
          topSymptoms.map(([key, count]) => {
            const label = SYMPTOMS.find(s => s.value === key)?.label || key;
            const maxCount = topSymptoms[0][1];
            return (
              <View key={key} style={styles.horizontalBar}>
                <Text style={styles.horizontalBarLabel}>{label}</Text>
                <View style={styles.horizontalBarTrack}>
                  <View
                    style={[
                      styles.horizontalBarFill,
                      { width: `${(count / maxCount) * 100}%`, backgroundColor: COLORS.warning },
                    ]}
                  />
                </View>
                <Text style={styles.horizontalBarValue}>{count}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Trigger Categories Logged</Text>
        {topTriggers.length === 0 ? (
          <Text style={styles.noData}>No trigger data yet</Text>
        ) : (
          topTriggers.map(([key, count]) => {
            const label = TRIGGER_CATEGORIES.find(t => t.value === key)?.label || key;
            const maxCount = topTriggers[0][1];
            return (
              <View key={key} style={styles.horizontalBar}>
                <Text style={styles.horizontalBarLabel}>{label}</Text>
                <View style={styles.horizontalBarTrack}>
                  <View
                    style={[
                      styles.horizontalBarFill,
                      { width: `${(count / maxCount) * 100}%`, backgroundColor: COLORS.primary },
                    ]}
                  />
                </View>
                <Text style={styles.horizontalBarValue}>{count}</Text>
              </View>
            );
          })
        )}
      </View>
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
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 20,
    height: 80,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  horizontalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalBarLabel: {
    fontSize: 12,
    color: COLORS.text,
    width: 100,
  },
  horizontalBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.borderLight,
    borderRadius: 7,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: 7,
    minWidth: 4,
  },
  horizontalBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 24,
    textAlign: 'right',
  },
  noData: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    padding: 20,
  },
});
