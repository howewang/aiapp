import { useState, useCallback, useEffect, useRef } from 'react';
import { USE_BACKEND_API } from '@/constants/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getChatHistory } from '@/services/backendApi';

export interface ChatMessage {
  id: string;
  role: 'me' | 'them';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function useChat(partnerId: string, sessionIdParam?: string | null) {
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(USE_BACKEND_API && !!sessionId);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useWebSocket();

  useEffect(() => {
    if (USE_BACKEND_API && sessionId) {
      setLoading(true);
      getChatHistory(String(sessionId))
        .then((hist) => {
          if (hist.length > 0) {
            setMessages(hist.map((m) => ({
              id: m.id,
              role: m.role,
              text: m.text,
              time: typeof m.time === 'string' ? formatTime(m.time) : formatTime(new Date()),
              status: 'read' as const,
            })));
          } else {
            setMessages([{
              id: '0',
              role: 'them',
              text: '嗨！很高兴遇到你 😊',
              time: formatTime(new Date()),
              status: 'read',
            }]);
          }
        })
        .catch(() => {
          setMessages([{
            id: '0',
            role: 'them',
            text: '嗨！很高兴遇到你 😊',
            time: formatTime(new Date()),
            status: 'read',
          }]);
        })
        .finally(() => setLoading(false));
    } else {
      setMessages([{
        id: '0',
        role: 'them',
        text: '嗨！很高兴遇到你 😊',
        time: formatTime(new Date()),
        status: 'read',
      }]);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!USE_BACKEND_API || !sessionId || !ws) return;
    const unsub = ws.subscribeChat(sessionId, (payload) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${payload.time}-${payload.text}`,
          role: payload.role,
          text: payload.text,
          time: formatTime(payload.time),
          status: 'read',
        },
      ]);
    });
    return unsub;
  }, [sessionId, ws]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    if (!USE_BACKEND_API || !sessionId || !ws) return;

    const msgId = Date.now().toString();
    const now = new Date().toISOString();
    const myMsg: ChatMessage = {
      id: msgId,
      role: 'me',
      text: text.trim(),
      time: formatTime(now),
      status: 'sent',
    };
    setMessages((prev) => [...prev, myMsg]);
    setInputText('');
    ws.send({ type: 'chat', sessionId, text: text.trim() });
  }, [sessionId, ws]);

  return { messages, inputText, setInputText, sendMessage, isTyping, loading };
}
