import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react-native';
import { COLORS } from '@/lib/constants';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

function formatDisplay(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function WebPicker({ value, onChange, onClose }: { value: Date; onChange: (d: Date) => void; onClose: () => void }) {
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [hourText, setHourText] = useState(pad(value.getHours()));
  const [minuteText, setMinuteText] = useState(pad(value.getMinutes()));
  const [daysOffset, setDaysOffset] = useState(0);

  const adjustHour = (delta: number) => {
    const next = (hour + delta + 24) % 24;
    setHour(next);
    setHourText(pad(next));
  };

  const adjustMinute = (delta: number) => {
    const next = (minute + delta + 60) % 60;
    setMinute(next);
    setMinuteText(pad(next));
  };

  const handleHourChange = (text: string) => {
    setHourText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      setHour(clamp(parsed, 0, 23));
    }
  };

  const handleHourBlur = () => setHourText(pad(hour));

  const handleMinuteChange = (text: string) => {
    setMinuteText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      setMinute(clamp(parsed, 0, 59));
    }
  };

  const handleMinuteBlur = () => setMinuteText(pad(minute));

  const today = new Date();
  const DAY_OPTIONS = Array.from({ length: 7 }, (_, i) => {
    if (i === 0) return { label: 'Today', offset: 0 };
    if (i === 1) return { label: 'Yesterday', offset: 1 };
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    return { label, offset: i };
  });

  const handleConfirm = () => {
    const result = new Date();
    result.setDate(result.getDate() - daysOffset);
    result.setHours(hour, minute, 0, 0);
    onChange(result);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOuter}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>When did this happen?</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayScroll}
            contentContainerStyle={styles.dayRow}
          >
            {DAY_OPTIONS.map(opt => (
              <Pressable
                key={opt.offset}
                testID={`day-chip-${opt.offset}`}
                style={[styles.dayChip, daysOffset === opt.offset && styles.dayChipActive]}
                onPress={() => setDaysOffset(opt.offset)}
              >
                <Text style={[styles.dayChipText, daysOffset === opt.offset && styles.dayChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.timeRow}>
            <View style={styles.spinnerCol}>
              <Pressable testID="hour-up" onPress={() => adjustHour(1)} style={styles.spinBtn}>
                <ChevronUp size={22} color={COLORS.text} />
              </Pressable>
              <TextInput
                testID="hour-input"
                style={styles.spinInput}
                value={hourText}
                onChangeText={handleHourChange}
                onBlur={handleHourBlur}
                onEndEditing={handleHourBlur}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Pressable testID="hour-down" onPress={() => adjustHour(-1)} style={styles.spinBtn}>
                <ChevronDown size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <Text style={styles.timeSep}>:</Text>

            <View style={styles.spinnerCol}>
              <Pressable testID="minute-up" onPress={() => adjustMinute(5)} style={styles.spinBtn}>
                <ChevronUp size={22} color={COLORS.text} />
              </Pressable>
              <TextInput
                testID="minute-input"
                style={styles.spinInput}
                value={minuteText}
                onChangeText={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onEndEditing={handleMinuteBlur}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Pressable testID="minute-down" onPress={() => adjustMinute(-5)} style={styles.spinBtn}>
                <ChevronDown size={22} color={COLORS.text} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.timeHint}>Tap a number to type it directly</Text>

          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerLeft}>
          <Calendar size={16} color={COLORS.primary} />
          <Clock size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.triggerText}>{formatDisplay(value)}</Text>
        <Text style={styles.editHint}>Edit</Text>
      </TouchableOpacity>

      {open && (
        <WebPicker value={value} onChange={onChange} onClose={() => setOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  triggerLeft: {
    flexDirection: 'row',
    gap: 4,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  editHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  modalOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  dayScroll: {
    marginBottom: 24,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayChipTextActive: {
    color: COLORS.textInverse,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  spinnerCol: {
    alignItems: 'center',
    gap: 4,
  },
  spinBtn: {
    padding: 8,
  },
  spinInput: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    width: 80,
    height: 60,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    padding: 0,
  },
  timeSep: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  timeHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
