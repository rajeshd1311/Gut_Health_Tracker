import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/lib/constants';

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  onMonthChange: (direction: 'prev' | 'next') => void;
  markedDates: Set<string>; // 'YYYY-MM-DD'
  onDayPress: (date: Date) => void;
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MonthCalendar({
  year,
  month,
  onMonthChange,
  markedDates,
  onDayPress,
}: MonthCalendarProps) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const isCurrentMonth = year === todayYear && month === todayMonth;
  const isAtOrAfterCurrentMonth =
    year > todayYear || (year === todayYear && month >= todayMonth);

  // First day of month (0=Sun, 6=Sat)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build cell array: null = empty padding, number = day
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const isFutureDay = (day: number) => {
    if (year > todayYear) return true;
    if (year === todayYear && month > todayMonth) return true;
    if (year === todayYear && month === todayMonth && day > todayDay) return true;
    return false;
  };

  const isToday = (day: number) =>
    year === todayYear && month === todayMonth && day === todayDay;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => onMonthChange('prev')}
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          style={[styles.navButton, isAtOrAfterCurrentMonth && styles.navButtonDisabled]}
          onPress={() => !isAtOrAfterCurrentMonth && onMonthChange('next')}
          disabled={isAtOrAfterCurrentMonth}
          accessibilityLabel="Next month"
        >
          <ChevronRight size={20} color={isAtOrAfterCurrentMonth ? COLORS.textTertiary : COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADERS.map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {row.map((day, colIndex) => {
            if (!day) {
              return <View key={colIndex} style={styles.dayCell} />;
            }

            const future = isFutureDay(day);
            const todayCell = isToday(day);
            const dateKey = toDateKey(year, month, day);
            const hasLogs = markedDates.has(dateKey);

            return (
              <TouchableOpacity
                key={colIndex}
                style={styles.dayCell}
                onPress={() => !future && onDayPress(new Date(year, month, day))}
                disabled={future}
                accessibilityLabel={`${day} ${MONTH_NAMES[month]}${hasLogs ? ', has logs' : ''}`}
              >
                <View style={[styles.dayInner, todayCell && styles.dayInnerToday]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      future && styles.dayNumberFuture,
                      todayCell && styles.dayNumberToday,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasLogs && !future && (
                    <View style={[styles.dot, todayCell && styles.dotToday]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayInner: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayInnerToday: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayNumberFuture: {
    color: COLORS.textTertiary,
  },
  dayNumberToday: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  dotToday: {
    backgroundColor: COLORS.textInverse,
  },
});
