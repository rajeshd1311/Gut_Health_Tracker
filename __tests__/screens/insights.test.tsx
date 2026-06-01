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
const mockGetHypotheses = jest.fn();
jest.mock('@/services/database', () => ({
  getLogsForDateRange: (...args: any[]) => mockGetLogsForDateRange(...args),
  getHypotheses: (...args: any[]) => mockGetHypotheses(...args),
}));

const mockGenerateAndSaveHypotheses = jest.fn();
jest.mock('@/services/correlations', () => ({
  generateAndSaveHypotheses: (...args: any[]) => mockGenerateAndSaveHypotheses(...args),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InsightsScreen from '@/app/(tabs)/insights';
import { TriggerHypothesis } from '@/types/database';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockGetLogsForDateRange.mockResolvedValue({ meals: [], symptoms: [] });
  mockGenerateAndSaveHypotheses.mockResolvedValue([]);
  mockGetHypotheses.mockResolvedValue([]);
});

const mockHypothesis: TriggerHypothesis = {
  id: 'h1',
  user_id: 'u1',
  trigger_category: 'dairy',
  symptom: 'bloating',
  confidence: 'medium',
  occurrences: 3,
  supporting_meal_ids: ['m1', 'm2', 'm3'],
  supporting_symptom_ids: ['s1', 's2', 's3'],
  explanation: 'Dairy appeared before bloating in 3 recent logs. This may be worth watching.',
  disclaimer: 'Correlation only. Not a diagnosis.',
  created_at: '2024-03-10T00:00:00Z',
  updated_at: '2024-03-10T00:00:00Z',
};

describe('Insights Screen', () => {
  test('calls getLogsForDateRange on focus', async () => {
    render(<InsightsScreen />);
    await waitFor(() => {
      expect(mockGetLogsForDateRange).toHaveBeenCalledWith('u1', expect.any(Date), expect.any(Date));
    });
  });

  test('calls generateAndSaveHypotheses after loading logs', async () => {
    mockGetLogsForDateRange.mockResolvedValue({ meals: [{ id: 'm1' }], symptoms: [{ id: 's1' }] });
    render(<InsightsScreen />);
    await waitFor(() => {
      expect(mockGenerateAndSaveHypotheses).toHaveBeenCalledWith('u1', expect.any(Array), expect.any(Array));
    });
  });

  test('calls getHypotheses to fetch stored hypotheses', async () => {
    render(<InsightsScreen />);
    await waitFor(() => {
      expect(mockGetHypotheses).toHaveBeenCalledWith('u1');
    });
  });

  test('shows empty state when no hypotheses exist', async () => {
    mockGetHypotheses.mockResolvedValue([]);
    const { getByText } = render(<InsightsScreen />);
    await waitFor(() => {
      expect(getByText(/No patterns detected yet/i)).toBeTruthy();
    });
  });

  test('shows disclaimer box', () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText(/observations, not diagnoses/i)).toBeTruthy();
  });

  test('renders hypothesis cards when hypotheses exist', async () => {
    mockGetHypotheses.mockResolvedValue([mockHypothesis]);
    const { getByText } = render(<InsightsScreen />);
    await waitFor(() => {
      expect(getByText('Dairy may be worth watching')).toBeTruthy();
    });
  });

  test('shows confidence badge on hypothesis card', async () => {
    mockGetHypotheses.mockResolvedValue([mockHypothesis]);
    const { getByText } = render(<InsightsScreen />);
    await waitFor(() => {
      expect(getByText('Medium')).toBeTruthy();
    });
  });

  test('tapping a hypothesis card expands it to show more details', async () => {
    mockGetHypotheses.mockResolvedValue([mockHypothesis]);
    const { getByText } = render(<InsightsScreen />);
    await waitFor(() => expect(getByText('Dairy may be worth watching')).toBeTruthy());

    fireEvent.press(getByText('Dairy may be worth watching'));
    await waitFor(() => {
      expect(getByText(/Correlation only/i)).toBeTruthy();
    });
  });

  test('tapping an expanded card collapses it', async () => {
    mockGetHypotheses.mockResolvedValue([mockHypothesis]);
    const { getByText, queryByText } = render(<InsightsScreen />);
    await waitFor(() => expect(getByText('Dairy may be worth watching')).toBeTruthy());

    // Expand
    fireEvent.press(getByText('Dairy may be worth watching'));
    await waitFor(() => expect(getByText(/Correlation only/i)).toBeTruthy());

    // Collapse
    fireEvent.press(getByText('Dairy may be worth watching'));
    await waitFor(() => {
      expect(queryByText(/Correlation only/i)).toBeNull();
    });
  });
});
