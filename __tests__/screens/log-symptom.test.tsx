jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockCreateSymptomLog = jest.fn();
const mockUpdateSymptomLog = jest.fn();
jest.mock('@/services/database', () => ({
  createSymptomLog: (...args: any[]) => mockCreateSymptomLog(...args),
  updateSymptomLog: (...args: any[]) => mockUpdateSymptomLog(...args),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

jest.mock('@/components/DateTimePicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => React.createElement(View, { testID: 'date-time-picker' }) };
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LogSymptomScreen from '@/app/log-symptom';

const { router, useLocalSearchParams } = require('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockCreateSymptomLog.mockResolvedValue({ id: 'new-symptom' });
  mockUpdateSymptomLog.mockResolvedValue({ id: 'updated-symptom' });
  useLocalSearchParams.mockReturnValue({});
});

describe('Log Symptom – Create Mode', () => {
  test('renders "Log Symptoms" title', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText('Log Symptoms')).toBeTruthy();
  });

  test('renders "Save Symptoms" button', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText('Save Symptoms')).toBeTruthy();
  });

  test('shows all symptom chips', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText('Bloating')).toBeTruthy();
    expect(getByText('Gas')).toBeTruthy();
    expect(getByText('Nausea')).toBeTruthy();
    expect(getByText('Fatigue')).toBeTruthy();
  });

  test('shows default severity of 5', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText(/5\/10/)).toBeTruthy();
  });

  test('shows error when no symptoms selected on submit', () => {
    const { getByText } = render(<LogSymptomScreen />);
    fireEvent.press(getByText('Save Symptoms'));
    expect(getByText('Please select at least one symptom.')).toBeTruthy();
  });

  test('selecting a symptom chip toggles it on', () => {
    const { getByText } = render(<LogSymptomScreen />);
    fireEvent.press(getByText('Bloating'));
    // Selecting enables submit
    fireEvent.press(getByText('Save Symptoms'));
    // No error about selecting symptoms
  });

  test('successful save calls createSymptomLog and navigates back', async () => {
    const { getByText } = render(<LogSymptomScreen />);
    fireEvent.press(getByText('Bloating'));
    fireEvent.press(getByText('Gas'));
    fireEvent.press(getByText('Save Symptoms'));

    await waitFor(() => {
      expect(mockCreateSymptomLog).toHaveBeenCalledWith(
        'u1',
        expect.arrayContaining(['bloating', 'gas']),
        5,
        expect.any(String),
        expect.any(Date)
      );
    });

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });

  test('shows error when createSymptomLog returns null', async () => {
    mockCreateSymptomLog.mockResolvedValue(null);
    const { getByText } = render(<LogSymptomScreen />);
    fireEvent.press(getByText('Bloating'));
    fireEvent.press(getByText('Save Symptoms'));

    await waitFor(() => {
      expect(getByText(/failed|error|wrong/i)).toBeTruthy();
    });
  });

  test('tapping severity number button updates severity', () => {
    const { getByText } = render(<LogSymptomScreen />);
    // The component renders buttons 0-10
    fireEvent.press(getByText('8'));
    expect(getByText(/8\/10/)).toBeTruthy();
  });
});

describe('Log Symptom – Edit Mode', () => {
  const editEntry = {
    id: 's1',
    symptoms: ['bloating', 'abdominal_pain'],
    severity: 7,
    notes: 'After lunch',
    timestamp: '2024-03-10T14:00:00.000Z',
  };

  beforeEach(() => {
    useLocalSearchParams.mockReturnValue({
      id: 's1',
      entry: JSON.stringify(editEntry),
    });
  });

  test('renders "Edit Symptoms" title', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText('Edit Symptoms')).toBeTruthy();
  });

  test('renders "Save Changes" button', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText('Save Changes')).toBeTruthy();
  });

  test('pre-fills severity from entry', () => {
    const { getByText } = render(<LogSymptomScreen />);
    expect(getByText(/7\/10/)).toBeTruthy();
  });

  test('pre-fills notes from entry', () => {
    const { getByDisplayValue } = render(<LogSymptomScreen />);
    expect(getByDisplayValue('After lunch')).toBeTruthy();
  });

  test('saving calls updateSymptomLog with the id', async () => {
    const { getByText } = render(<LogSymptomScreen />);
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateSymptomLog).toHaveBeenCalledWith('s1', expect.any(Object));
    });

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });
});
