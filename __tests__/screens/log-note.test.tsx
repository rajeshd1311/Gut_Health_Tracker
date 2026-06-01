jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockCreateNoteLog = jest.fn();
const mockUpdateNoteLog = jest.fn();
jest.mock('@/services/database', () => ({
  createNoteLog: (...args: any[]) => mockCreateNoteLog(...args),
  updateNoteLog: (...args: any[]) => mockUpdateNoteLog(...args),
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
import LogNoteScreen from '@/app/log-note';

const { router, useLocalSearchParams } = require('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockCreateNoteLog.mockResolvedValue({ id: 'new-note' });
  mockUpdateNoteLog.mockResolvedValue({ id: 'updated-note' });
  useLocalSearchParams.mockReturnValue({});
});

describe('Log Note – Create Mode', () => {
  test('renders "Add a Note" title', () => {
    const { getByText } = render(<LogNoteScreen />);
    expect(getByText('Add a Note')).toBeTruthy();
  });

  test('renders "Save Note" button', () => {
    const { getByText } = render(<LogNoteScreen />);
    expect(getByText('Save Note')).toBeTruthy();
  });

  test('shows category chips', () => {
    const { getByText } = render(<LogNoteScreen />);
    expect(getByText('Stress')).toBeTruthy();
    expect(getByText('Sleep')).toBeTruthy();
    expect(getByText('Medication')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  test('shows error when content is empty on submit', () => {
    const { getByText } = render(<LogNoteScreen />);
    fireEvent.press(getByText('Save Note'));
    expect(getByText('Please add some content to your note.')).toBeTruthy();
  });

  test('shows error when content is whitespace only', () => {
    const { getByText, getByPlaceholderText } = render(<LogNoteScreen />);
    fireEvent.changeText(getByPlaceholderText(/Poor sleep last night/), '   ');
    fireEvent.press(getByText('Save Note'));
    expect(getByText('Please add some content to your note.')).toBeTruthy();
  });

  test('selecting a category chip changes category', () => {
    const { getByText } = render(<LogNoteScreen />);
    fireEvent.press(getByText('Stress'));
    // Will verify via save args
  });

  test('successful save calls createNoteLog and navigates back', async () => {
    const { getByText, getByPlaceholderText } = render(<LogNoteScreen />);
    fireEvent.press(getByText('Stress'));
    fireEvent.changeText(getByPlaceholderText(/Poor sleep last night/), 'Busy day at work');
    fireEvent.press(getByText('Save Note'));

    await waitFor(() => {
      expect(mockCreateNoteLog).toHaveBeenCalledWith(
        'u1',
        'Busy day at work',
        'stress',
        expect.any(Date)
      );
    });

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });

  test('shows error when createNoteLog returns null', async () => {
    mockCreateNoteLog.mockResolvedValue(null);
    const { getByText, getByPlaceholderText } = render(<LogNoteScreen />);
    fireEvent.changeText(getByPlaceholderText(/Poor sleep last night/), 'Test note');
    fireEvent.press(getByText('Save Note'));

    await waitFor(() => {
      expect(getByText(/failed|error|wrong/i)).toBeTruthy();
    });
  });
});

describe('Log Note – Edit Mode', () => {
  const editEntry = {
    id: 'n1',
    content: 'Took probiotics',
    category: 'medication',
    timestamp: '2024-03-10T09:00:00.000Z',
  };

  beforeEach(() => {
    useLocalSearchParams.mockReturnValue({
      id: 'n1',
      entry: JSON.stringify(editEntry),
    });
  });

  test('renders "Edit Note" title', () => {
    const { getByText } = render(<LogNoteScreen />);
    expect(getByText('Edit Note')).toBeTruthy();
  });

  test('renders "Save Changes" button', () => {
    const { getByText } = render(<LogNoteScreen />);
    expect(getByText('Save Changes')).toBeTruthy();
  });

  test('pre-fills content from entry', () => {
    const { getByDisplayValue } = render(<LogNoteScreen />);
    expect(getByDisplayValue('Took probiotics')).toBeTruthy();
  });

  test('saving calls updateNoteLog with the id', async () => {
    const { getByText } = render(<LogNoteScreen />);
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateNoteLog).toHaveBeenCalledWith('n1', expect.any(Object));
    });

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });
});
