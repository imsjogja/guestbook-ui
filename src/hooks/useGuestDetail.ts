import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Guest, RSVP, Invitation, Checkin, ApiResponse } from '@/types';
import { normalizeGuestDetail } from '@/lib/normalizers';

type BackendGuestDetail = {
  id: string;
  tenant_id: string;
  full_name: string;
  nickname?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  language?: string | null;
  guest_type?: string | null;
  segment?: string | null;
  household_id?: string | null;
  dietary_restrictions?: string | null;
  notes?: string | null;
  consent_communication?: boolean;
  plus_one?: boolean;
  plus_one_name?: string | null;
  created_at: string;
  updated_at: string;
  rsvp?: {
    id: string;
    guest_id: string;
    event_id: string;
    status?: string | null;
    guest_count?: number | null;
    attending_pax?: number | null;
    adults?: number | null;
    children?: number | null;
    responded_at?: string | null;
    edited_at?: string | null;
    responded_via?: string | null;
    notes?: string | null;
  } | null;
  invitations?: Array<{
    id: string;
    guest_id: string;
    event_id: string;
    channel?: string | null;
    status?: string | null;
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    failed_reason?: string | null;
    qr_code_url?: string | null;
    short_link?: string | null;
    created_at: string;
    updated_at: string;
  }> | null;
  checkins?: Array<{
    id: string;
    guest_id: string;
    event_guest_id?: string | null;
    event_id: string;
    method?: string | null;
    status?: string | null;
    checked_in_by?: string | null;
    checked_in_at?: string | null;
    created_at?: string | null;
    seat_assignment?: string | null;
    notes?: string | null;
  }> | null;
};

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
      const res = await api.get<ApiResponse<BackendGuestDetail>>(`/guests/${guestId}`);
      setGuest(res.data.data ? (normalizeGuestDetail(res.data.data) as GuestDetail) : null);
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
