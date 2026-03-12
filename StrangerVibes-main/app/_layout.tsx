// Powered by OnSpace.AI
import { AlertProvider } from '@/template';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <WebSocketProvider>
          <ThemeProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#080808' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="personality" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="report"
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="user/[id]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="chat-settings/[id]"
                options={{ animation: 'slide_from_right' }}
              />
            </Stack>
          </ThemeProvider>
          </WebSocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
