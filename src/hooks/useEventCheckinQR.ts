import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

type EventCheckinQR = {
  event_id: string;
  url: string;
};

export function useEventCheckinQR(eventId?: string) {
  const [qr, setQr] = useState<EventCheckinQR | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQR = useCallback(async () => {
    if (!eventId) {
      setQr(null);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<EventCheckinQR>>(`/events/${eventId}/checkin/qr`);
      setQr(response.data.data ?? null);
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: { error?: string; message?: string } } }).response?.data;
      setError(responseData?.error ?? responseData?.message ?? 'Gagal memuat QR acara');
      setQr(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchQR();
  }, [fetchQR]);

  return { qr, isLoading, error, refetch: fetchQR };
}
