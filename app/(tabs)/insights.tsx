import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AlertTriangle, TrendingUp } from 'lucide-react-native';
import { COLORS, TRIGGER_CATEGORIES, SYMPTOMS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { getLogsForDateRange, getHypotheses } from '@/services/database';
import { generateAndSaveHypotheses } from '@/services/correlations';
import { TriggerHypothesis } from '@/types/database';

export default function InsightsScreen() {
  const { user } = useAuth();
  const [hypotheses, setHypotheses] = useState<TriggerHypothesis[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const { meals, symptoms } = await getLogsForDateRange(user.id, startDate, endDate);
    await generateAndSaveHypotheses(user.id, meals, symptoms);
    const h = await getHypotheses(user.id);
    setHypotheses(h);
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

  const getTriggerLabel = (cat: string) =>
    TRIGGER_CATEGORIES.find(t => t.value === cat)?.label || cat;

  const getSymptomLabel = (sym: string) =>
    SYMPTOMS.find(s => s.value === sym)?.label || sym;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      default: return COLORS.textTertiary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.title}>Pattern Insights</Text>
      <Text style={styles.subtitle}>Possible correlations from your logs</Text>

      <View style={styles.disclaimerBox}>
        <AlertTriangle color={COLORS.accent} size={16} />
        <Text style={styles.disclaimerText}>
          These are observations, not diagnoses. Patterns may be coincidental. Always discuss with a healthcare professional.
        </Text>
      </View>

      {hypotheses.length === 0 ? (
        <View style={styles.emptyState}>
          <TrendingUp color={COLORS.textTertiary} size={40} />
          <Text style={styles.emptyTitle}>No patterns detected yet</Text>
          <Text style={styles.emptyText}>
            Keep logging meals and symptoms consistently. Patterns typically emerge after at least a week of regular tracking.
          </Text>
        </View>
      ) : (
        hypotheses.map(h => (
          <TouchableOpacity
            key={h.id}
            style={styles.hypothesisCard}
            onPress={() => setExpandedId(expandedId === h.id ? null : h.id)}
            activeOpacity={0.7}
          >
            <View style={styles.hypothesisHeader}>
              <Text style={styles.hypothesisTrigger}>{getTriggerLabel(h.trigger_category)}</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(h.confidence) + '20' }]}>
                <Text style={[styles.confidenceText, { color: getConfidenceColor(h.confidence) }]}>
                  {h.confidence.charAt(0).toUpperCase() + h.confidence.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.hypothesisTitle}>
              {getTriggerLabel(h.trigger_category)} may be worth watching
            </Text>
            <Text style={styles.hypothesisExplanation}>{h.explanation}</Text>

            <View style={styles.hypothesisMeta}>
              <Text style={styles.hypothesisMetaText}>
                {h.occurrences} occurrence{h.occurrences > 1 ? 's' : ''} before {getSymptomLabel(h.symptom).toLowerCase()}
              </Text>
            </View>

            {expandedId === h.id && (
              <View style={styles.expandedContent}>
                <View style={styles.disclaimerInCard}>
                  <Text style={styles.disclaimerInCardText}>{h.disclaimer}</Text>
                </View>
                <Text style={styles.expandedLabel}>Supporting evidence:</Text>
                <Text style={styles.expandedValue}>
                  {h.supporting_meal_ids.length} meal log{h.supporting_meal_ids.length > 1 ? 's' : ''} and{' '}
                  {h.supporting_symptom_ids.length} symptom log{h.supporting_symptom_ids.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))
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
    marginBottom: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.hypothesisCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  hypothesisCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hypothesisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hypothesisTrigger: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hypothesisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  hypothesisExplanation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  hypothesisMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hypothesisMetaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  disclaimerInCard: {
    backgroundColor: COLORS.hypothesisCard,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  disclaimerInCardText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  expandedValue: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
});
