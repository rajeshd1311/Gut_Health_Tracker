jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
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
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreen from '@/app/auth';

const mockSignIn = jest.fn().mockResolvedValue({ error: null });
const mockSignUp = jest.fn().mockResolvedValue({ error: null });

beforeEach(() => {
  jest.clearAllMocks();
  mockSignIn.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  mockUseAuth.mockReturnValue({
    session: null,
    signIn: mockSignIn,
    signUp: mockSignUp,
  });
});

describe('Auth Screen', () => {
  test('renders in Sign In mode by default', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  test('toggles to Sign Up mode when tapped', () => {
    const { getByText } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  test('toggles back to Sign In mode', () => {
    const { getByText } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    fireEvent.press(getByText('Already have an account? Sign In'));
    expect(getByText('Welcome Back')).toBeTruthy();
  });

  test('shows error when email is empty on submit', () => {
    const { getByText } = render(<AuthScreen />);
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Please enter both email and password.')).toBeTruthy();
  });

  test('shows error when password is empty on submit', () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Please enter both email and password.')).toBeTruthy();
  });

  test('shows error when password is less than 6 characters', () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '12345');
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Password must be at least 6 characters.')).toBeTruthy();
  });

  test('calls signIn with valid credentials in sign-in mode', async () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  test('shows error returned from signIn', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid login credentials' });
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Invalid login credentials')).toBeTruthy();
    });
  });

  test('calls signUp with valid credentials in sign-up mode', async () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123');
    });
  });

  test('shows success message after successful sign-up', async () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    await waitFor(() => {
      expect(getByText(/Account created/i)).toBeTruthy();
    });
  });

  test('shows error returned from signUp', async () => {
    mockSignUp.mockResolvedValue({ error: 'Email already registered' });
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    fireEvent.changeText(getByPlaceholderText('Email'), 'taken@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    await waitFor(() => {
      expect(getByText('Email already registered')).toBeTruthy();
    });
  });

  test('button shows "Please wait..." during loading', async () => {
    // Make signIn never resolve to keep loading state
    mockSignIn.mockReturnValue(new Promise(() => {}));
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Please wait...')).toBeTruthy();
    });
  });
});
