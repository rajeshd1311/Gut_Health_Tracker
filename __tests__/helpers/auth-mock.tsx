import React from 'react';
import { UserProfile } from '@/types/database';

interface MockAuthState {
  session: any;
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
}

const defaultProfile: UserProfile = {
  id: 'test-user-id',
  goals: ['bloating'],
  suspected_triggers: ['dairy'],
  custom_triggers: [],
  gender: null,
  age: null,
  height_cm: null,
  weight_kg: null,
  onboarding_completed: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const defaultUser = { id: 'test-user-id', email: 'test@example.com' };

const defaultSession = { user: defaultUser, access_token: 'token' };

export const defaultAuthState: MockAuthState = {
  session: defaultSession,
  user: defaultUser,
  profile: defaultProfile,
  loading: false,
};

export const mockSignUp = jest.fn().mockResolvedValue({ error: null });
export const mockSignIn = jest.fn().mockResolvedValue({ error: null });
export const mockSignOut = jest.fn().mockResolvedValue(undefined);
export const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);

let currentAuthState: MockAuthState = { ...defaultAuthState };

export function setMockAuthState(state: Partial<MockAuthState>) {
  currentAuthState = { ...defaultAuthState, ...state };
}

export function resetMockAuth() {
  currentAuthState = { ...defaultAuthState };
  mockSignUp.mockReset().mockResolvedValue({ error: null });
  mockSignIn.mockReset().mockResolvedValue({ error: null });
  mockSignOut.mockReset().mockResolvedValue(undefined);
  mockRefreshProfile.mockReset().mockResolvedValue(undefined);
}

export function getMockAuthValue() {
  return {
    ...currentAuthState,
    signUp: mockSignUp,
    signIn: mockSignIn,
    signOut: mockSignOut,
    refreshProfile: mockRefreshProfile,
  };
}

export { defaultProfile, defaultUser, defaultSession };
