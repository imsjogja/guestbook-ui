import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { RSVP, RSVPBreakdown } from '@/types';

export function useRSVP(eventId?: string) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [breakdown, setBreakdown] = useState<RSVPBreakdown>({
    attending: 0,
    notAttending: 0,
    maybe: 0,
    noResponse: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRSVPs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = eventId ? { eventId } : {};
      const [rsvpsRes, breakdownRes] = await Promise.all([
        api.get<{ data: RSVP[] }>('/rsvp', { params }),
        api.get<{ data: RSVPBreakdown }>('/rsvp/breakdown', { params }),
      ]);
      setRsvps(rsvpsRes.data.data ?? []);
      setBreakdown(breakdownRes.data.data ?? {
        attending: 0,
        notAttending: 0,
        maybe: 0,
        noResponse: 0,
        total: 0,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message ?? 'Gagal memuat RSVP';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRSVPs();
  }, [fetchRSVPs]);

  const updateRSVP = useCallback(
    async (id: string, data: Partial<RSVP>) => {
      try {
        const response = await api.put<{ data: RSVP }>(`/rsvp/${id}`, data);
        const updated = response.data.data;
        setRsvps((prev) => prev.map((r) => (r.id === id ? updated : r)));
        return updated;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal memperbarui RSVP');
      }
    },
    []
  );

  return {
    rsvps,
    breakdown,
    isLoading,
    error,
    refetch: fetchRSVPs,
    updateRSVP,
  };
}
