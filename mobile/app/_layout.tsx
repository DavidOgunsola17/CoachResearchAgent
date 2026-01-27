import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStore } from '../stores/networkStore';
import { useContactsStore } from '../stores/contactsStore';
import OfflineScreen from '../components/OfflineScreen';
import SplashScreenComponent from '../components/SplashScreen';
import Colors from '../constants/colors';

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const { isConnected, initialize: initNetwork } = useNetworkStore();
  const loadContacts = useContactsStore((s) => s.loadContacts);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
    initNetwork();
  }, []);

  // Load contacts once authenticated
  useEffect(() => {
    if (session) {
      loadContacts();
    }
  }, [session]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <>
        <SplashScreenComponent />
        <StatusBar style="light" />
      </>
    );
  }

  if (!isConnected) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <OfflineScreen />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen
          name="results"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="coach-profile"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
