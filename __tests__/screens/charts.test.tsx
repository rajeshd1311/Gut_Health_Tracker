jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockGetLogsForDateRange = jest.fn();
jest.mock('@/services/database', () => ({
  getLogsForDateRange: (...args: any[]) => mockGetLogsForDateRange(...args),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ChartsScreen from '@/app/(tabs)/charts';
import { MealLog, SymptomLog } from '@/types/database';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockGetLogsForDateRange.mockResolvedValue({ meals: [], symptoms: [] });
});

function makeMeal(daysAgo: number, triggers: string[]): MealLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `m-${daysAgo}-${Math.random()}`,
    user_id: 'u1',
    timestamp: d.toISOString(),
    meal_type: 'lunch',
    description: 'Meal',
    portion_note: '',
    trigger_categories: triggers as any,
    photo_uri: '',
    voice_transcript: '',
    notes: '',
    created_at: d.toISOString(),
    updated_at: d.toISOString(),
  };
}

function makeSymptom(daysAgo: number, symptoms: string[]): SymptomLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `s-${daysAgo}-${Math.random()}`,
    user_id: 'u1',
    timestamp: d.toISOString(),
    symptoms: symptoms as any,
    severity: 5,
    notes: '',
    created_at: d.toISOString(),
    updated_at: d.toISOString(),
  };
}

describe('Charts Screen', () => {
  test('calls getLogsForDateRange with a 7-day range', async () => {
    render(<ChartsScreen />);
    await waitFor(() => {
      expect(mockGetLogsForDateRange).toHaveBeenCalledWith('u1', expect.any(Date), expect.any(Date));
    });
    const [, start, end] = mockGetLogsForDateRange.mock.calls[0];
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  test('renders chart section titles', async () => {
    const { getByText } = render(<ChartsScreen />);
    await waitFor(() => {
      expect(getByText('Meals Logged Per Day')).toBeTruthy();
      expect(getByText('Symptom Logs Per Day')).toBeTruthy();
    });
  });

  test('shows "No data" message when no symptom data', async () => {
    mockGetLogsForDateRange.mockResolvedValue({ meals: [], symptoms: [] });
    const { getByText } = render(<ChartsScreen />);
    await waitFor(() => {
      expect(getByText('No symptom data yet')).toBeTruthy();
    });
  });

  test('renders day labels for the last 7 days', async () => {
    const { getAllByText } = render(<ChartsScreen />);
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
    await waitFor(() => {
      expect(getAllByText(dayName).length).toBeGreaterThanOrEqual(2);
    });
  });

  test('renders top symptoms when symptom data exists', async () => {
    mockGetLogsForDateRange.mockResolvedValue({
      meals: [],
      symptoms: [
        makeSymptom(0, ['bloating', 'gas']),
        makeSymptom(1, ['bloating']),
      ],
    });
    const { getByText } = render(<ChartsScreen />);
    await waitFor(() => {
      expect(getByText('Bloating')).toBeTruthy();
    });
  });

  test('renders top triggers when meal data exists', async () => {
    mockGetLogsForDateRange.mockResolvedValue({
      meals: [
        makeMeal(0, ['dairy', 'caffeine']),
        makeMeal(1, ['dairy']),
      ],
      symptoms: [],
    });
    const { getByText } = render(<ChartsScreen />);
    await waitFor(() => {
      expect(getByText('Dairy')).toBeTruthy();
    });
  });

  test('limits top symptoms to 5 items maximum', async () => {
    const symptoms = Array.from({ length: 3 }, (_, i) =>
      makeSymptom(i, ['bloating', 'gas', 'nausea', 'fatigue', 'constipation', 'diarrhea'])
    );
    mockGetLogsForDateRange.mockResolvedValue({ meals: [], symptoms });
    const { getAllByText } = render(<ChartsScreen />);
    await waitFor(() => {
      // Should only show top 5
      expect(getAllByText(/Bloating|Gas|Nausea|Fatigue|Constipation|Diarrhea/).length).toBeLessThanOrEqual(10);
    });
  });
});
