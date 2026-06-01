jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

const mockGetItem = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: any[]) => mockGetItem(...args),
    setItem: jest.fn(),
  },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import IndexScreen from '@/app/index';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  mockUseAuth.mockReturnValue({ session: null, profile: null, loading: true });
});

describe('Index (Router) Screen', () => {
  test('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: true });
    const { queryByText } = render(<IndexScreen />);
    expect(queryByText(/Redirect/)).toBeNull();
  });

  test('shows loading while AsyncStorage check is pending', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    mockGetItem.mockReturnValue(new Promise(() => {})); // never resolves
    const { queryByText } = render(<IndexScreen />);
    expect(queryByText(/Redirect/)).toBeNull();
  });

  test('redirects to /welcome when no session and has not seen welcome', async () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    mockGetItem.mockResolvedValue(null);
    const { getByText } = render(<IndexScreen />);
    await waitFor(() => {
      expect(getByText(/Redirect:\/welcome/)).toBeTruthy();
    });
  });

  test('redirects to /auth when no session but has seen welcome', async () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    mockGetItem.mockResolvedValue('true');
    const { getByText } = render(<IndexScreen />);
    await waitFor(() => {
      expect(getByText(/Redirect:\/auth/)).toBeTruthy();
    });
  });

  test('redirects to /onboarding when session exists but onboarding not completed', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'u1' } },
      profile: { onboarding_completed: false },
      loading: false,
    });
    mockGetItem.mockResolvedValue('true');
    const { getByText } = render(<IndexScreen />);
    await waitFor(() => {
      expect(getByText(/Redirect:\/onboarding/)).toBeTruthy();
    });
  });

  test('redirects to /(tabs) when session exists and onboarding completed', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'u1' } },
      profile: { onboarding_completed: true },
      loading: false,
    });
    mockGetItem.mockResolvedValue('true');
    const { getByText } = render(<IndexScreen />);
    await waitFor(() => {
      expect(getByText(/Redirect:\/\(tabs\)/)).toBeTruthy();
    });
  });

  test('calls AsyncStorage.getItem with the welcome key', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    render(<IndexScreen />);
    expect(mockGetItem).toHaveBeenCalledWith('gutsense_has_seen_welcome');
  });
});
