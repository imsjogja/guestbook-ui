import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Guest, RSVP, Invitation, Checkin, ApiResponse } from '@/types';

export interface GuestDetail extends Guest {
  rsvp?: RSVP | null;
  invitations?: Invitation[];
  checkins?: Checkin[];
}

export interface UseGuestDetailReturn {
  guest: GuestDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuestDetail(guestId: string | undefined): UseGuestDetailReturn {
  const [guest, setGuest] = useState<GuestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuest = useCallback(async () => {
    if (!guestId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch guest detail with related data
      const res = await api.get<ApiResponse<GuestDetail>>(`/guests/${guestId}`);
      setGuest(res.data.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail tamu';
      setError(msg);
      setGuest(null);
    } finally {
      setIsLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    fetchGuest();
  }, [fetchGuest]);

  return { guest, isLoading, error, refetch: fetchGuest };
}
