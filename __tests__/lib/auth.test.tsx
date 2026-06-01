jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('@/services/database', () => ({
  getUserProfile: jest.fn(),
}));

import React from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/types/database';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockGetUserProfile = getUserProfile as jest.Mock;

// Wrapper for renderHook
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProfile: UserProfile = {
  id: 'u1',
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

const mockSession = {
  user: { id: 'u1', email: 'test@example.com' },
  access_token: 'token',
};

// ---------------------------------------------------------------------------
// Consumer component (for render-based tests)
// ---------------------------------------------------------------------------

function Consumer() {
  const { session, user, profile, loading } = useAuth();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="session">{session ? 'has-session' : 'no-session'}</Text>
      <Text testID="user">{user ? user.id : 'no-user'}</Text>
      <Text testID="profile">{profile ? profile.id : 'no-profile'}</Text>
    </>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

// ---------------------------------------------------------------------------
// Initial load – no session
// ---------------------------------------------------------------------------

describe('AuthProvider – initial load (no session)', () => {
  beforeEach(() => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  });

  test('loading starts as true and becomes false after init', async () => {
    const { getByTestId } = renderWithProvider();
    expect(getByTestId('loading').props.children).toBe('true');
    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });
  });

  test('session and user are null after init with no stored session', async () => {
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('no-session');
      expect(getByTestId('user').props.children).toBe('no-user');
      expect(getByTestId('profile').props.children).toBe('no-profile');
    });
  });
});

// ---------------------------------------------------------------------------
// Initial load – with session
// ---------------------------------------------------------------------------

describe('AuthProvider – initial load (with session)', () => {
  beforeEach(() => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
    mockGetUserProfile.mockResolvedValue(mockProfile);
  });

  test('resolves user and profile from stored session', async () => {
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('has-session');
      expect(getByTestId('user').props.children).toBe('u1');
      expect(getByTestId('profile').props.children).toBe('u1');
    });
  });

  test('calls getUserProfile with the session user id', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith('u1');
    });
  });
});

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

describe('AuthProvider – signUp', () => {
  beforeEach(() => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    mockGetUserProfile.mockResolvedValue(null);
  });

  test('calls supabase.auth.signUp with correct arguments', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signUp('test@test.com', 'password123');
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
  });

  test('returns null error on success', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } = { error: 'pending' };
    await act(async () => {
      response = await result.current.signUp('test@test.com', 'password123');
    });

    expect(response).toEqual({ error: null });
  });

  test('returns error message when Supabase returns an error', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({
      error: { message: 'Email already registered' },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } = { error: null };
    await act(async () => {
      response = await result.current.signUp('taken@test.com', 'password123');
    });

    expect(response).toEqual({ error: 'Email already registered' });
  });
});

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------

describe('AuthProvider – signIn', () => {
  beforeEach(() => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  });

  test('calls signInWithPassword with correct arguments', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('user@test.com', 'pass123');
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'pass123',
    });
  });

  test('returns null error on successful sign in', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } = { error: 'pending' };
    await act(async () => {
      response = await result.current.signIn('user@test.com', 'pass123');
    });

    expect(response).toEqual({ error: null });
  });

  test('returns error message on invalid credentials', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } = { error: null };
    await act(async () => {
      response = await result.current.signIn('user@test.com', 'wrong');
    });

    expect(response).toEqual({ error: 'Invalid login credentials' });
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('AuthProvider – signOut', () => {
  beforeEach(() => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (mockAuth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  test('calls supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// refreshProfile
// ---------------------------------------------------------------------------

describe('AuthProvider – refreshProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAuth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });
  test('re-fetches profile when a session exists', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
    mockGetUserProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshProfile();
    });

    // Called once on init + once from refreshProfile
    expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
  });

  test('does not call getUserProfile when there is no session', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onAuthStateChange
// ---------------------------------------------------------------------------

describe('AuthProvider – onAuthStateChange', () => {
  test('subscribes to auth state changes on mount and unsubscribes on unmount', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    const unsubscribe = jest.fn();
    (mockAuth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderWithProvider();
    await waitFor(() => expect(mockAuth.onAuthStateChange).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  test('updates session when auth state changes to signed-in', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    mockGetUserProfile.mockResolvedValue(mockProfile);

    let capturedCallback: (event: string, session: any) => void = () => {};
    (mockAuth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { getByTestId } = renderWithProvider();
    await waitFor(() => expect(getByTestId('session').props.children).toBe('no-session'));

    await act(async () => {
      capturedCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('has-session');
    });
  });

  test('clears session and profile when auth state changes to signed-out', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
    mockGetUserProfile.mockResolvedValue(mockProfile);

    let capturedCallback: (event: string, session: any) => void = () => {};
    (mockAuth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { getByTestId } = renderWithProvider();
    await waitFor(() => expect(getByTestId('session').props.children).toBe('has-session'));

    await act(async () => {
      capturedCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('no-session');
      expect(getByTestId('profile').props.children).toBe('no-profile');
    });
  });
});
