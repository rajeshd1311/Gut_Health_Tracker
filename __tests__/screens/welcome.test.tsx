jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

const mockSetItem = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: (...args: any[]) => mockSetItem(...args),
  },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WelcomeScreen from '@/app/welcome';

const { router } = require('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Welcome Screen', () => {
  test('renders the first slide title on mount', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Tired of the Guesswork?')).toBeTruthy();
  });

  test('shows Next button (not Get Started) on the first slide', () => {
    const { getByText, queryByText } = render(<WelcomeScreen />);
    expect(getByText('Next')).toBeTruthy();
    expect(queryByText('Get Started')).toBeNull();
  });

  test('Skip button is visible on first slide', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Skip')).toBeTruthy();
  });

  test('pressing Skip sets AsyncStorage and navigates to /auth', async () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText('Skip'));
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('gutsense_has_seen_welcome', 'true');
      expect(router.replace).toHaveBeenCalledWith('/auth');
    });
  });
});
