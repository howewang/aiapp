import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { USE_BACKEND_API, WS_URL } from '@/constants/api';
import { getToken } from '@/services/backendAuthService';
import { useAuth } from '@/hooks/useAuth';

type MatchListener = (payload: { sessionId?: number; matchedUser: { id: string; nickname: string; avatar: string; personality: string; personalityKey: string; rating: number } }) => void;
type ChatListener = (payload: { type: 'chat'; sessionId?: number; role: 'me' | 'them'; text: string; time: string }) => void;

interface WebSocketContextType {
  connected: boolean;
  subscribeMatch: (cb: MatchListener) => () => void;
  subscribeChat: (sessionId: number | null, cb: ChatListener) => () => void;
  send: (msg: object) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const matchListenersRef = useRef<Set<MatchListener>>(new Set());
  const chatListenersRef = useRef<Map<number | null, Set<ChatListener>>>(new Map());
  const { isAuthenticated, logout } = useAuth();

  const subscribeMatch = (cb: MatchListener) => {
    matchListenersRef.current.add(cb);
    return () => {
      matchListenersRef.current.delete(cb);
    };
  };

  const subscribeChat = (sessionId: number | null, cb: ChatListener) => {
    const key = sessionId;
    if (!chatListenersRef.current.has(key)) {
      chatListenersRef.current.set(key, new Set());
    }
    chatListenersRef.current.get(key)!.add(cb);
    return () => {
      chatListenersRef.current.get(key)?.delete(cb);
    };
  };

  const send = (msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  useEffect(() => {
    if (!USE_BACKEND_API || !isAuthenticated) return;
    let mounted = true;

    const connect = async () => {
      const token = await getToken();
      if (!token || !mounted) return;
      const url = `${WS_URL}/chat?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mounted) setConnected(true);
      };
      ws.onclose = (ev) => {
        if (mounted) setConnected(false);
        wsRef.current = null;
        if (ev.code === 4001 || ev.code === 4002) {
          logout();
        }
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'match') {
            matchListenersRef.current.forEach((cb) => cb(msg));
          } else if (msg.type === 'chat') {
            const sid = msg.sessionId ?? null;
            chatListenersRef.current.get(sid)?.forEach((cb) => cb(msg));
            chatListenersRef.current.get(null)?.forEach((cb) => cb(msg));
          }
        } catch (_) {}
      };
    };

    connect();
    return () => {
      mounted = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [isAuthenticated, logout]);

  return (
    <WebSocketContext.Provider value={{ connected, subscribeMatch, subscribeChat, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
