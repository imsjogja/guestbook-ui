import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import type { Message } from '@/types';

type BackendMessage = {
  id: string;
  tenant_id: string;
  campaign_id?: string | null;
  guest_id: string;
  event_id?: string | null;
  channel: Message['channel'];
  type?: string;
  subject?: string | null;
  body: string;
  status: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  external_id?: string | null;
  provider_http_status?: number | null;
  created_at: string;
};

function normalizeMessage(raw: BackendMessage): Message {
  const status: Message['status'] = raw.status === 'queued' ? 'pending' :
    raw.status === 'delivered' || raw.status === 'read' || raw.status === 'failed' || raw.status === 'sent'
      ? raw.status
      : 'pending';
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id ?? undefined,
    guestId: raw.guest_id,
    eventId: raw.event_id ?? undefined,
    channel: raw.channel,
    direction: 'outbound',
    status,
    subject: raw.subject ?? undefined,
    body: raw.body,
    sentAt: raw.sent_at ?? undefined,
    deliveredAt: raw.delivered_at ?? undefined,
    readAt: raw.read_at ?? undefined,
    failedReason: raw.error_message ?? undefined,
    externalId: raw.external_id ?? undefined,
    providerHttpStatus: raw.provider_http_status ?? undefined,
    createdAt: raw.created_at,
  };
}

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
  const requestIdRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!eventId) {
      setMessages([]);
      setTotal(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params = { eventId };
      const res = await api.get<{ data: BackendMessage[]; meta?: { total?: number } }>('/messages', { params });
      if (requestId !== requestIdRef.current) return;
      const normalized = (res.data.data || []).map(normalizeMessage);
      setMessages(normalized);
      setTotal(res.data.meta?.total || normalized.length);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat pesan';
      setError(msg);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setMessages([]);
    setTotal(0);
    setError(null);
    if (!eventId) {
      requestIdRef.current += 1;
      setIsLoading(false);
      return;
    }
    void fetchMessages();
  }, [eventId, fetchMessages]);

  return { messages, total, isLoading, error, refetch: fetchMessages };
}
