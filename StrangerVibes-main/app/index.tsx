// Powered by OnSpace.AI
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // No Supabase session → go to login
      router.replace('/login');
    } else if (!isLoggedIn) {
      // Authenticated but hasn't selected today's personality → personality selection
      router.replace('/personality');
    } else {
      // Fully authenticated + personality selected → main app
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isLoggedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#00B4D8" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
