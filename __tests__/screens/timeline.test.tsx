jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockGetLogsForDateRange = jest.fn();
const mockGetLogsForDate = jest.fn();
const mockDeleteMealLog = jest.fn();
const mockDeleteSymptomLog = jest.fn();
const mockDeleteNoteLog = jest.fn();

jest.mock('@/services/database', () => ({
  getLogsForDateRange: (...args: any[]) => mockGetLogsForDateRange(...args),
  getLogsForDate: (...args: any[]) => mockGetLogsForDate(...args),
  deleteMealLog: (...args: any[]) => mockDeleteMealLog(...args),
  deleteSymptomLog: (...args: any[]) => mockDeleteSymptomLog(...args),
  deleteNoteLog: (...args: any[]) => mockDeleteNoteLog(...args),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TimelineScreen from '@/app/(tabs)/timeline';
import { MealLog, SymptomLog, NoteLog } from '@/types/database';

const { router } = require('expo-router');

const now = new Date();

const mockMeal: MealLog = {
  id: 'm1',
  user_id: 'u1',
  timestamp: now.toISOString(),
  meal_type: 'breakfast',
  description: 'Oatmeal with berries',
  portion_note: '',
  trigger_categories: ['dairy'],
  photo_uri: '',
  voice_transcript: '',
  notes: 'Added milk',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

const mockSymptom: SymptomLog = {
  id: 's1',
  user_id: 'u1',
  timestamp: now.toISOString(),
  symptoms: ['bloating', 'gas'],
  severity: 7,
  notes: 'After breakfast',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

const mockNote: NoteLog = {
  id: 'n1',
  user_id: 'u1',
  timestamp: now.toISOString(),
  content: 'Slept poorly last night',
  category: 'sleep',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockGetLogsForDateRange.mockResolvedValue({ meals: [], symptoms: [] });
  mockGetLogsForDate.mockResolvedValue({ meals: [], symptoms: [], notes: [] });
  mockDeleteMealLog.mockResolvedValue(true);
  mockDeleteSymptomLog.mockResolvedValue(true);
  mockDeleteNoteLog.mockResolvedValue(true);
});

describe('Timeline Screen (History Calendar)', () => {
  test('renders History title and subtitle', async () => {
    const { getByText } = render(<TimelineScreen />);
    await waitFor(() => {
      expect(getByText('History')).toBeTruthy();
      expect(getByText(/Tap any date/i)).toBeTruthy();
    });
  });

  test('calls getLogsForDateRange with current month boundaries on mount', async () => {
    render(<TimelineScreen />);
    await waitFor(() => {
      expect(mockGetLogsForDateRange).toHaveBeenCalled();
      const [userId, startDate, endDate] = mockGetLogsForDateRange.mock.calls[0];
      expect(userId).toBe('u1');
      expect(startDate.getDate()).toBe(1);
      expect(endDate.getMonth()).toBe(startDate.getMonth());
    });
  });

  test('renders the current month name in the calendar header', async () => {
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const { getByText } = render(<TimelineScreen />);
    await waitFor(() => {
      expect(getByText(new RegExp(monthName))).toBeTruthy();
    });
  });

  test('tapping today cell calls getLogsForDate', async () => {
    mockGetLogsForDate.mockResolvedValue({
      meals: [mockMeal],
      symptoms: [],
      notes: [],
    });

    const { getByText } = render(<TimelineScreen />);
    const todayNum = String(now.getDate());
    fireEvent.press(getByText(todayNum));

    await waitFor(() => {
      expect(mockGetLogsForDate).toHaveBeenCalled();
    });
  });

  test('modal shows meal entry after day is selected', async () => {
    mockGetLogsForDate.mockResolvedValue({
      meals: [mockMeal],
      symptoms: [],
      notes: [],
    });

    const { getByText } = render(<TimelineScreen />);
    fireEvent.press(getByText(String(now.getDate())));

    await waitFor(() => {
      expect(getByText('Oatmeal with berries')).toBeTruthy();
    });
  });

  test('modal shows symptom severity after day is selected', async () => {
    mockGetLogsForDate.mockResolvedValue({
      meals: [],
      symptoms: [mockSymptom],
      notes: [],
    });

    const { getByText } = render(<TimelineScreen />);
    fireEvent.press(getByText(String(now.getDate())));

    await waitFor(() => {
      expect(getByText(/7\/10/)).toBeTruthy();
    });
  });

  test('modal shows note content after day is selected', async () => {
    mockGetLogsForDate.mockResolvedValue({
      meals: [],
      symptoms: [],
      notes: [mockNote],
    });

    const { getByText } = render(<TimelineScreen />);
    fireEvent.press(getByText(String(now.getDate())));

    await waitFor(() => {
      expect(getByText('Slept poorly last night')).toBeTruthy();
    });
  });

  test('does not call getLogsForDateRange when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<TimelineScreen />);
    await waitFor(() => {
      expect(mockGetLogsForDateRange).not.toHaveBeenCalled();
    });
  });
});
