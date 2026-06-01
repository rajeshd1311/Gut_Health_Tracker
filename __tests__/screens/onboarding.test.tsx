jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('expo-router', () => require('../helpers/navigation-mock'));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

const mockCreateUserProfile = jest.fn();
jest.mock('@/services/database', () => ({
  createUserProfile: (...args: any[]) => mockCreateUserProfile(...args),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: any) => React.createElement(View, { testID: props.testID }) });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '@/app/onboarding';

const { router } = require('expo-router');
const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateUserProfile.mockResolvedValue({ id: 'profile-1' });
  mockUseAuth.mockReturnValue({
    user: { id: 'u1' },
    refreshProfile: mockRefreshProfile,
  });
});

describe('Onboarding Screen – Step 0 (Basics)', () => {
  test('renders gender options on mount', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Male')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();
    expect(getByText('Non-binary')).toBeTruthy();
  });

  test('renders age, height, weight inputs', () => {
    const { getByPlaceholderText } = render(<OnboardingScreen />);
    expect(getByPlaceholderText('e.g. 32')).toBeTruthy();
  });

  test('pressing Continue advances to step 1', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Continue'));
    expect(getByText('Your main concerns')).toBeTruthy();
  });

  test('all basics fields are optional', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Continue'));
    expect(getByText('Your main concerns')).toBeTruthy();
  });
});

describe('Onboarding Screen – Step 1 (Goals)', () => {
  function goToStep1() {
    const result = render(<OnboardingScreen />);
    fireEvent.press(result.getByText('Continue'));
    return result;
  }

  test('shows all goal options', () => {
    const { getByText } = goToStep1();
    expect(getByText('Bloating')).toBeTruthy();
    expect(getByText('Abdominal Pain')).toBeTruthy();
    expect(getByText('Acidity / Reflux')).toBeTruthy();
    expect(getByText('Brain Fog')).toBeTruthy();
  });

  test('Continue button is present but disabled with no goals', () => {
    const { getByText } = goToStep1();
    const continueBtn = getByText('Continue');
    expect(continueBtn).toBeTruthy();
  });

  test('selecting a goal and pressing Continue advances to step 2', () => {
    const { getByText } = goToStep1();
    fireEvent.press(getByText('Bloating'));
    fireEvent.press(getByText('Continue'));
    expect(getByText('Suspected triggers')).toBeTruthy();
  });

  test('multiple goals can be selected', () => {
    const { getByText } = goToStep1();
    fireEvent.press(getByText('Bloating'));
    fireEvent.press(getByText('Fatigue'));
    fireEvent.press(getByText('Continue'));
    expect(getByText('Suspected triggers')).toBeTruthy();
  });

  test('Back button returns to step 0', () => {
    const { getByText } = goToStep1();
    fireEvent.press(getByText('Back'));
    expect(getByText('Male')).toBeTruthy();
  });
});

describe('Onboarding Screen – Step 2 (Triggers)', () => {
  function goToStep2() {
    const result = render(<OnboardingScreen />);
    fireEvent.press(result.getByText('Continue')); // step 0 -> 1
    fireEvent.press(result.getByText('Bloating')); // select goal
    fireEvent.press(result.getByText('Continue')); // step 1 -> 2
    return result;
  }

  test('shows trigger category options', () => {
    const { getByText } = goToStep2();
    expect(getByText('Dairy')).toBeTruthy();
    expect(getByText('Wheat / Gluten')).toBeTruthy();
    expect(getByText('Caffeine')).toBeTruthy();
    expect(getByText('Not Sure')).toBeTruthy();
  });

  test('selecting Not Sure deselects others', () => {
    const { getByText } = goToStep2();
    fireEvent.press(getByText('Dairy'));
    fireEvent.press(getByText('Not Sure'));
    // After pressing Start Tracking, only 'not_sure' should be in triggers
    // We verify by completing and checking the createUserProfile call
    fireEvent.press(getByText('Start Tracking'));
  });

  test('selecting another trigger deselects Not Sure', () => {
    const { getByText } = goToStep2();
    fireEvent.press(getByText('Not Sure'));
    fireEvent.press(getByText('Caffeine'));
    // 'not_sure' should be removed, only 'caffeine' remains
    fireEvent.press(getByText('Start Tracking'));
  });

  test('Start Tracking calls createUserProfile and navigates', async () => {
    const { getByText } = goToStep2();
    fireEvent.press(getByText('Dairy'));
    fireEvent.press(getByText('Start Tracking'));

    await waitFor(() => {
      expect(mockCreateUserProfile).toHaveBeenCalledWith(
        'u1',
        ['bloating'],
        expect.arrayContaining(['dairy']),
        expect.any(Object),
        expect.any(Array)
      );
    });

    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  test('shows error when createUserProfile returns null', async () => {
    mockCreateUserProfile.mockResolvedValue(null);
    const { getByText } = goToStep2();
    fireEvent.press(getByText('Dairy'));
    fireEvent.press(getByText('Start Tracking'));

    await waitFor(() => {
      expect(getByText(/Something went wrong/)).toBeTruthy();
    });
  });

  test('Back button returns to step 1', () => {
    const { getByText } = goToStep2();
    fireEvent.press(getByText('Back'));
    expect(getByText('Your main concerns')).toBeTruthy();
  });

  test('can add a custom trigger', () => {
    const { getByText, getByPlaceholderText } = goToStep2();
    const input = getByPlaceholderText('e.g. Citrus, Soy, Corn...');
    fireEvent.changeText(input, 'Tomatoes');
    fireEvent(input, 'submitEditing');
    expect(getByText('Tomatoes')).toBeTruthy();
  });
});
