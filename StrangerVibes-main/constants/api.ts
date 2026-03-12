// Backend API configuration - Node.js chat-server
// Set EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_WS_URL in .env for production

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string) ||
  (isDev ? 'http://localhost:3000' : 'https://api.yourapp.com');

export const WS_URL =
  (process.env.EXPO_PUBLIC_WS_URL as string) ||
  (isDev ? 'ws://localhost:3000' : 'wss://api.yourapp.com');

export const USE_BACKEND_API =
  process.env.EXPO_PUBLIC_USE_BACKEND_API !== 'false';
