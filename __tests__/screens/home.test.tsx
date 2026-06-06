jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockGetTodayLogs = jest.fn();
const mockDeleteMealLog = jest.fn();
const mockDeleteSymptomLog = jest.fn();
const mockDeleteNoteLog = jest.fn();

jest.mock('@/services/database', () => ({
  getTodayLogs: (...args: any[]) => mockGetTodayLogs(...args),
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
import HomeScreen from '@/app/(tabs)/index';
import { MealLog, SymptomLog, NoteLog } from '@/types/database';

const { router } = require('expo-router');

const mockMeal: MealLog = {
  id: 'm1',
  user_id: 'u1',
  timestamp: new Date().toISOString(),
  meal_type: 'lunch',
  description: 'Grilled chicken salad',
  portion_note: 'medium',
  trigger_categories: ['dairy'],
  photo_uri: '',
  voice_transcript: '',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSymptom: SymptomLog = {
  id: 's1',
  user_id: 'u1',
  timestamp: new Date().toISOString(),
  symptoms: ['bloating', 'gas'],
  severity: 6,
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockNote: NoteLog = {
  id: 'n1',
  user_id: 'u1',
  timestamp: new Date().toISOString(),
  content: 'Took ibuprofen',
  category: 'medication',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockGetTodayLogs.mockResolvedValue({ meals: [], symptoms: [], notes: [] });
  mockDeleteMealLog.mockResolvedValue(true);
  mockDeleteSymptomLog.mockResolvedValue(true);
  mockDeleteNoteLog.mockResolvedValue(true);
});

describe('Home Screen', () => {
  test('calls getTodayLogs with user id on mount', async () => {
    render(<HomeScreen />);
    await waitFor(() => {
      expect(mockGetTodayLogs).toHaveBeenCalledWith('u1');
    });
  });

  test('shows quick action buttons', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Log Meal')).toBeTruthy();
    expect(getByText('Log Symptom')).toBeTruthy();
    expect(getByText('Add Note')).toBeTruthy();
  });

  test('tapping Log Meal navigates to /log-meal', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Log Meal'));
    expect(router.push).toHaveBeenCalledWith('/log-meal');
  });

  test('tapping Log Symptom navigates to /log-symptom', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Log Symptom'));
    expect(router.push).toHaveBeenCalledWith('/log-symptom');
  });

  test('tapping Add Note navigates to /log-note', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Add Note'));
    expect(router.push).toHaveBeenCalledWith('/log-note');
  });

  test('shows empty state when no logs exist', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [], symptoms: [], notes: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Start your day')).toBeTruthy();
    });
  });

  test('shows meal description when meals exist', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [mockMeal], symptoms: [], notes: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Grilled chicken salad')).toBeTruthy();
    });
  });

  test('shows symptom severity when symptoms exist', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [], symptoms: [mockSymptom], notes: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText(/6\/10/)).toBeTruthy();
    });
  });

  test('shows reward card when logs exist', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [mockMeal], symptoms: [mockSymptom], notes: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText(/tracking|logging|evidence|data|habits|insights|observations|health/i)).toBeTruthy();
    });
  });

  test("shows Today's Logs section heading when logs exist", async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [mockMeal], symptoms: [], notes: [] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText("Today's Logs")).toBeTruthy();
    });
  });

  test('tapping edit on a meal navigates to log-meal with params', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [mockMeal], symptoms: [], notes: [] });
    const { getAllByAccessibilityLabel } = render(<HomeScreen />);
    await waitFor(() => getAllByAccessibilityLabel('Edit meal'));
    const editButtons = getAllByAccessibilityLabel('Edit meal');
    fireEvent.press(editButtons[0]);
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/log-meal' })
    );
  });

  test('tapping delete on a meal calls deleteMealLog', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [mockMeal], symptoms: [], notes: [] });
    const { getAllByAccessibilityLabel } = render(<HomeScreen />);
    await waitFor(() => getAllByAccessibilityLabel('Delete meal'));
    const deleteButtons = getAllByAccessibilityLabel('Delete meal');
    fireEvent.press(deleteButtons[0]);
    await waitFor(() => {
      expect(mockDeleteMealLog).toHaveBeenCalledWith('m1');
    });
  });

  test('tapping edit on a symptom navigates to log-symptom with params', async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [], symptoms: [mockSymptom], notes: [] });
    const { getAllByAccessibilityLabel } = render(<HomeScreen />);
    await waitFor(() => getAllByAccessibilityLabel('Edit symptom'));
    const editButtons = getAllByAccessibilityLabel('Edit symptom');
    fireEvent.press(editButtons[0]);
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/log-symptom' })
    );
  });

  test("note content is shown in today's logs", async () => {
    mockGetTodayLogs.mockResolvedValue({ meals: [], symptoms: [], notes: [mockNote] });
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Took ibuprofen')).toBeTruthy();
    });
  });
});
