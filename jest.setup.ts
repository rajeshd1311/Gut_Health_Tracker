// Suppress noisy RN/Expo warnings in test output
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation((msg: string) => {
  // Surface actual test errors but silence known RN setup noise
  if (typeof msg === 'string' && msg.includes('Warning:')) return;
  console.info('[test error]', msg);
});

// Provide env vars so lib/supabase.ts initialises without crashing
// (only matters when the module is NOT mocked via jest.mock factory)
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
