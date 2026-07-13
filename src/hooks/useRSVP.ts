import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { RSVP, RSVPBreakdown } from '@/types';

interface ApiRSVP {
  id: string;
  guest_id: string;
  guest_full_name?: string | null;
  event_id: string;
  status: RSVP['status'];
  guest_count?: number;
  guestCount?: number;
  message?: string | null;
  responded_at?: string | null;
  respondedAt?: string | null;
  responded_via?: RSVP['respondedVia'];
  respondedVia?: RSVP['respondedVia'];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface ApiRSVPBreakdown {
  attending?: number;
  not_attending?: number;
  maybe?: number;
  no_response?: number;
  total?: number;
  total_invited?: number;
  responded?: number;
}

function asCount(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeRSVP(item: ApiRSVP): RSVP {
  return {
    id: item.id,
    guestId: item.guest_id,
    guestName: item.guest_full_name ?? undefined,
    eventId: item.event_id,
    status: item.status,
    guestCount: asCount(item.guest_count ?? item.guestCount),
    message: item.message ?? undefined,
    respondedAt: item.responded_at ?? item.respondedAt ?? undefined,
    respondedVia: item.responded_via ?? item.respondedVia ?? 'manual',
    createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeBreakdown(data?: ApiRSVPBreakdown): RSVPBreakdown {
  const attending = asCount(data?.attending);
  const notAttending = asCount(data?.not_attending);
  const maybe = asCount(data?.maybe);
  const noResponse = asCount(data?.no_response);
  const total =
    asCount(data?.total) ||
    asCount(data?.total_invited) ||
    asCount(data?.responded) ||
    attending + notAttending + maybe + noResponse;

  return {
    attending,
    notAttending,
    maybe,
    noResponse,
    total,
  };
}

function toBackendRSVPUpdate(data: Partial<RSVP>): Record<string, unknown> {
  const status = data.status;
  const guestCount =
    data.guestCount !== undefined
      ? data.guestCount
      : status === 'attending'
        ? 1
        : status === 'not_attending'
          ? 0
          : undefined;

  return {
    ...(status ? { status } : {}),
    ...(guestCount !== undefined ? { attending_pax: guestCount } : {}),
    ...(data.guestCount !== undefined ? { adults: Math.max(0, data.guestCount) } : {}),
    ...(data.message !== undefined ? { notes: data.message } : {}),
  };
}

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
    if (!eventId) {
      setRsvps([]);
      setBreakdown({
        attending: 0,
        notAttending: 0,
        maybe: 0,
        noResponse: 0,
        total: 0,
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = eventId ? { eventId } : {};
      const [rsvpsRes, breakdownRes] = await Promise.all([
        api.get<{ data: ApiRSVP[] }>('/rsvp', { params }),
        api.get<{ data: ApiRSVPBreakdown }>('/rsvp/breakdown', { params }),
      ]);
      setRsvps((rsvpsRes.data.data ?? []).map(normalizeRSVP));
      setBreakdown(normalizeBreakdown(breakdownRes.data.data));
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
      if (!eventId) {
        throw new Error('Event aktif belum dipilih');
      }

      try {
        const response = await api.put<{ data: RSVP }>(`/rsvp/${id}`, toBackendRSVPUpdate(data));
        const updated = normalizeRSVP(response.data.data as unknown as ApiRSVP);
        setRsvps((prev) => prev.map((r) => (r.id === id ? updated : r)));
        return updated;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal memperbarui RSVP');
      }
    },
    [eventId]
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
