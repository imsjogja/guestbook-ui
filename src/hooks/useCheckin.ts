import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Checkin } from '@/types';

interface CheckinStats {
  totalToday: number;
  total: number;
  byMethod: { qr: number; manual: number; walkIn: number };
}

export function useCheckin(eventId?: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<CheckinStats>({
    totalToday: 0,
    total: 0,
    byMethod: { qr: 0, manual: 0, walkIn: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = eventId ? { eventId } : {};
      const [checkinsRes, statsRes] = await Promise.all([
        api.get<{ data: Checkin[] }>('/checkins', { params }),
        api.get<{ data: CheckinStats }>('/checkins/stats', { params }),
      ]);
      setCheckins(checkinsRes.data.data ?? []);
      setStats(statsRes.data.data ?? { totalToday: 0, total: 0, byMethod: { qr: 0, manual: 0, walkIn: 0 } });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message ?? 'Gagal memuat check-in';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const checkin = useCallback(
    async (guestId: string, method: 'qr' | 'manual' = 'manual', notes?: string) => {
      try {
        const response = await api.post<{ data: Checkin }>('/checkins', {
          guestId,
          eventId,
          checkinMethod: method,
          notes,
        });
        const newCheckin = response.data.data;
        setCheckins((prev) => [newCheckin, ...prev]);
        return newCheckin;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal melakukan check-in');
      }
    },
    [eventId]
  );

  const walkIn = useCallback(
    async (data: { fullName: string; phone?: string; eventId?: string }) => {
      try {
        const response = await api.post<{ data: Checkin }>('/checkins/walk-in', {
          ...data,
          eventId: data.eventId ?? eventId,
        });
        const newCheckin = response.data.data;
        setCheckins((prev) => [newCheckin, ...prev]);
        return newCheckin;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal mendaftarkan walk-in');
      }
    },
    [eventId]
  );

  return {
    checkins,
    stats,
    isLoading,
    error,
    refetch: fetchCheckins,
    checkin,
    walkIn,
  };
}
