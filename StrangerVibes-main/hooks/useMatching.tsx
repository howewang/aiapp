import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { matchStart, matchCancel } from '@/services/backendApi';
import { USE_BACKEND_API } from '@/constants/api';

export type MatchStatus = 'idle' | 'searching' | 'matched' | 'error';

export interface MatchedUser {
  id: string;
  nickname: string;
  avatar: string;
  personality: string;
  personalityKey: string;
  bio: string;
  rating: number;
}

export function useMatching() {
  const [status, setStatus] = useState<MatchStatus>('idle');
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { user } = useAuth();
  const ws = useWebSocket();

  const toMatchedUser = useCallback((m: { id: string; nickname: string; avatar: string; personality: string; personalityKey: string; rating: number }) => ({
    id: m.id,
    nickname: m.nickname,
    avatar: m.avatar,
    personality: m.personality,
    personalityKey: m.personalityKey,
    bio: '',
    rating: m.rating ?? 0,
  }), []);

  const startMatching = useCallback(async () => {
    setStatus('searching');
    setMatchedUser(null);
    setSessionId(null);

    if (USE_BACKEND_API && user?.id) {
      try {
        const res = await matchStart();
        if (res.status === 'matched' && res.matchedUser) {
          setMatchedUser(toMatchedUser(res.matchedUser));
          setSessionId(res.sessionId ?? null);
          setStatus('matched');
          return;
        }
        unsubscribeRef.current?.();
        unsubscribeRef.current = ws?.subscribeMatch((payload) => {
          unsubscribeRef.current?.();
          unsubscribeRef.current = null;
          if (timerRef.current) clearTimeout(timerRef.current);
          setMatchedUser(toMatchedUser(payload.matchedUser));
          setSessionId(payload.sessionId ?? null);
          setStatus('matched');
        }) ?? null;
        timerRef.current = setTimeout(() => {
          unsubscribeRef.current?.();
          unsubscribeRef.current = null;
          setStatus((s) => (s === 'searching' ? 'idle' : s));
          matchCancel();
        }, 60000);
      } catch (e) {
        setStatus('error');
      }
    } else {
      setStatus('error');
    }
  }, [user, ws, toMatchedUser]);

  const cancelMatching = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    if (USE_BACKEND_API) matchCancel();
    setStatus('idle');
    setMatchedUser(null);
  }, []);

  const resetMatch = useCallback(() => {
    setStatus('idle');
    setMatchedUser(null);
    setSessionId(null);
  }, []);

  return { status, matchedUser, sessionId, startMatching, cancelMatching, resetMatch };
}
