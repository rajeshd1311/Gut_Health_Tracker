import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Modal } from 'react-native';
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

// Web-only inline picker modal
function WebPicker({ value, onChange, onClose }: { value: Date; onChange: (d: Date) => void; onClose: () => void }) {
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [daysOffset, setDaysOffset] = useState(0); // 0 = today, 1 = yesterday, 2 = day before

  const adjustHour = (delta: number) => setHour(h => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) => setMinute(m => (m + delta + 60) % 60);

  const DAY_OPTIONS = [
    { label: 'Today', offset: 0 },
    { label: 'Yesterday', offset: 1 },
    { label: '2 days ago', offset: 2 },
  ];

  const handleConfirm = () => {
    const result = new Date();
    result.setDate(result.getDate() - daysOffset);
    result.setHours(hour, minute, 0, 0);
    onChange(result);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>When did this happen?</Text>

          <View style={styles.dayRow}>
            {DAY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.offset}
                style={[styles.dayChip, daysOffset === opt.offset && styles.dayChipActive]}
                onPress={() => setDaysOffset(opt.offset)}
              >
                <Text style={[styles.dayChipText, daysOffset === opt.offset && styles.dayChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.spinnerCol}>
              <TouchableOpacity testID="hour-up" onPress={() => adjustHour(1)} style={styles.spinBtn}>
                <ChevronUp size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.spinValue}>{pad(hour)}</Text>
              <TouchableOpacity testID="hour-down" onPress={() => adjustHour(-1)} style={styles.spinBtn}>
                <ChevronDown size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.timeSep}>:</Text>

            <View style={styles.spinnerCol}>
              <TouchableOpacity testID="minute-up" onPress={() => adjustMinute(5)} style={styles.spinBtn}>
                <ChevronUp size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.spinValue}>{pad(minute)}</Text>
              <TouchableOpacity testID="minute-down" onPress={() => adjustMinute(-5)} style={styles.spinBtn}>
                <ChevronDown size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
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
  dayRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
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
    marginBottom: 24,
  },
  spinnerCol: {
    alignItems: 'center',
    gap: 4,
  },
  spinBtn: {
    padding: 8,
  },
  spinValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    width: 72,
    textAlign: 'center',
  },
  timeSep: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
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
