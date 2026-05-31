import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';
import { COLORS } from '@/lib/constants';

const WELCOME_KEY = 'gutsense_has_seen_welcome';

export default function IndexScreen() {
  const { session, profile, loading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_KEY).then((value) => {
      setHasSeenWelcome(value === 'true');
    });
  }, []);

  if (loading || hasSeenWelcome === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    if (!hasSeenWelcome) {
      return <Redirect href="/welcome" />;
    }
    return <Redirect href="/auth" />;
  }

  if (!profile?.onboarding_completed) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
