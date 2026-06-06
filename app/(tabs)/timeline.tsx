import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import {
  getLogsForDateRange,
  getLogsForDate,
  deleteMealLog,
  deleteSymptomLog,
  deleteNoteLog,
} from '@/services/database';
import { MealLog, SymptomLog, NoteLog, TimelineEntry } from '@/types/database';
import MonthCalendar from '@/components/MonthCalendar';
import DayLogsModal from '@/components/DayLogsModal';

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function TimelineScreen() {
  const { user } = useAuth();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayMeals, setDayMeals] = useState<MealLog[]>([]);
  const [daySymptoms, setDaySymptoms] = useState<SymptomLog[]>([]);
  const [dayNotes, setDayNotes] = useState<NoteLog[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const loadMonthMarkers = useCallback(async () => {
    if (!user) return;
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const rangeData = await getLogsForDateRange(user.id, start, end);

    const marked = new Set<string>();
    for (const meal of rangeData.meals) {
      marked.add(toDateKey(new Date(meal.timestamp)));
    }
    for (const symptom of rangeData.symptoms) {
      marked.add(toDateKey(new Date(symptom.timestamp)));
    }
    setMarkedDates(marked);
  }, [user, currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadMonthMarkers();
    }, [loadMonthMarkers])
  );

  useEffect(() => {
    loadMonthMarkers();
  }, [currentYear, currentMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonthMarkers();
    setRefreshing(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
    } else {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      setCurrentMonth(prevMonth);
      setCurrentYear(prevYear);
    }
  };

  const handleDayPress = async (date: Date) => {
    setSelectedDate(date);
    setModalVisible(true);
    setLoadingDay(true);
    setDayMeals([]);
    setDaySymptoms([]);
    setDayNotes([]);

    if (!user) {
      setLoadingDay(false);
      return;
    }

    const data = await getLogsForDate(user.id, date);
    setDayMeals(data.meals);
    setDaySymptoms(data.symptoms);
    setDayNotes(data.notes);
    setLoadingDay(false);
  };

  const handleEdit = (entry: TimelineEntry) => {
    setModalVisible(false);
    const params = { id: entry.data.id, entry: JSON.stringify(entry.data) };
    if (entry.type === 'meal') router.push({ pathname: '/log-meal', params });
    else if (entry.type === 'symptom') router.push({ pathname: '/log-symptom', params });
    else router.push({ pathname: '/log-note', params });
  };

  const handleDelete = async (entry: TimelineEntry) => {
    let success = false;
    if (entry.type === 'meal') {
      success = await deleteMealLog(entry.data.id);
      if (success) setDayMeals(prev => prev.filter(m => m.id !== entry.data.id));
    } else if (entry.type === 'symptom') {
      success = await deleteSymptomLog(entry.data.id);
      if (success) setDaySymptoms(prev => prev.filter(s => s.id !== entry.data.id));
    } else {
      success = await deleteNoteLog(entry.data.id);
      if (success) setDayNotes(prev => prev.filter(n => n.id !== entry.data.id));
    }

    if (success && selectedDate) {
      const remainingMeals = entry.type === 'meal'
        ? dayMeals.filter(m => m.id !== entry.data.id)
        : dayMeals;
      const remainingSymptoms = entry.type === 'symptom'
        ? daySymptoms.filter(s => s.id !== entry.data.id)
        : daySymptoms;
      const remainingNotes = entry.type === 'note'
        ? dayNotes.filter(n => n.id !== entry.data.id)
        : dayNotes;

      if (remainingMeals.length + remainingSymptoms.length + remainingNotes.length === 0) {
        const key = toDateKey(selectedDate);
        setMarkedDates(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Tap any date to view and edit your logs</Text>

      <MonthCalendar
        year={currentYear}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        onDayPress={handleDayPress}
      />

      <DayLogsModal
        visible={modalVisible}
        date={selectedDate}
        meals={dayMeals}
        symptoms={daySymptoms}
        notes={dayNotes}
        loading={loadingDay}
        onClose={() => setModalVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
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
    paddingBottom: 40,
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
    marginBottom: 20,
  },
});
