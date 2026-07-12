import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Message, ApiResponse } from '@/types';

export interface UseMessagesReturn {
  messages: Message[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMessages(eventId?: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = eventId ? { eventId } : {};
      const res = await api.get<ApiResponse<Message[]> & { total?: number }>('/messages', { params });
      setMessages(res.data.data || []);
      setTotal(res.data.total || (res.data.data || []).length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pesan';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, total, isLoading, error, refetch: fetchMessages };
}
