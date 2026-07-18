import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Checkin } from '@/types';
import { useTenantStore } from '@/store/tenantStore';
import { useEventAccess } from './useEventAccess';

interface CheckinStats {
  totalToday: number;
  total: number;
  byMethod: { qr: number; manual: number; walkIn: number };
}

interface ApiCheckin {
  id: string;
  guest_id: string;
  event_id: string;
  method?: string;
  created_at?: string;
  createdAt?: string;
  officer_id?: string | null;
  notes?: string | null;
  seat_assignment?: string | null;
  seatAssignment?: string | null;
}

interface ApiMethodStat {
  method?: string;
  count?: number;
}

interface ApiCheckinStats {
  total_expected?: number;
  total_checked_in?: number;
  recent_checkins?: ApiCheckin[];
  by_method?: ApiMethodStat[];
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as { response?: { data?: { error?: string; message?: string } } }).response?.data;
  return responseData?.error ?? responseData?.message ?? fallback;
}

function normalizeCheckinMethod(method?: string): Checkin['checkinMethod'] {
  switch (method) {
    case 'qr_scan':
    case 'qr':
      return 'qr';
    case 'walk_in':
      return 'walk_in';
    case 'manual_search':
    case 'manual':
    case 'kiosk':
    default:
      return 'manual';
  }
}

function normalizeCheckin(item: ApiCheckin): Checkin {
  return {
    id: item.id,
    guestId: item.guest_id,
    eventId: item.event_id,
    checkinMethod: normalizeCheckinMethod(item.method),
    checkedInBy: item.officer_id ?? 'System',
    checkedInAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    notes: item.notes ?? undefined,
    seatAssignment: item.seat_assignment ?? item.seatAssignment ?? undefined,
  };
}

function normalizeStats(data?: ApiCheckinStats): CheckinStats {
  const byMethodBase = { qr: 0, manual: 0, walkIn: 0 };
  const byMethod = (data?.by_method ?? []).reduce((acc, item) => {
    const method = normalizeCheckinMethod(item.method);
    const count = item.count ?? 0;
    if (method === 'qr') acc.qr += count;
    else if (method === 'walk_in') acc.walkIn += count;
    else acc.manual += count;
    return acc;
  }, byMethodBase);

  return {
    totalToday: data?.total_checked_in ?? 0,
    total: data?.total_expected ?? 0,
    byMethod,
  };
}

export function useCheckin(eventId?: string) {
  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const activeEventId = eventId ?? currentEventId;
  const { access, isLoading: isLoadingAccess } = useEventAccess();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<CheckinStats>({
    totalToday: 0,
    total: 0,
    byMethod: { qr: 0, manual: 0, walkIn: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = useCallback(async () => {
    if (!activeEventId) {
      setCheckins([]);
      setStats({ totalToday: 0, total: 0, byMethod: { qr: 0, manual: 0, walkIn: 0 } });
      setError(null);
      setIsLoading(false);
      return;
    }

    if (isLoadingAccess) {
      setIsLoading(true);
      return;
    }

    if (!access?.permissions.includes('checkin:read')) {
      setCheckins([]);
      setStats({ totalToday: 0, total: 0, byMethod: { qr: 0, manual: 0, walkIn: 0 } });
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = activeEventId ? { eventId: activeEventId } : {};
      const [checkinsRes, statsRes] = await Promise.allSettled([
        api.get<{ data: ApiCheckin[] }>('/checkins', { params }),
        api.get<{ data: ApiCheckinStats }>('/checkins/stats', { params }),
      ]);

      if (checkinsRes.status === 'fulfilled') {
        setCheckins((checkinsRes.value.data.data ?? []).map(normalizeCheckin));
      } else {
        setCheckins([]);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(normalizeStats(statsRes.value.data.data));
      } else {
        setStats({ totalToday: 0, total: 0, byMethod: { qr: 0, manual: 0, walkIn: 0 } });
      }

      if (checkinsRes.status === 'rejected' && statsRes.status === 'rejected') {
        throw checkinsRes.reason;
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Gagal memuat check-in');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [access, activeEventId, isLoadingAccess]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const checkin = useCallback(
    async (
      guestId: string,
      method: 'qr' | 'manual' = 'manual',
      notes?: string,
      actualPax = 1
    ) => {
      if (!activeEventId) {
        throw new Error('Event aktif belum dipilih');
      }
      if (isLoadingAccess || !access?.permissions.includes('checkin:write')) {
        throw new Error('Role Anda tidak memiliki akses untuk melakukan check-in');
      }

      try {
        const backendMethod = method === 'qr' ? 'qr_scan' : 'manual_search';
        const response = await api.post<{ data: Checkin }>('/checkins', {
          method: backendMethod,
          guest_id: guestId,
          event_id: activeEventId,
          actual_pax: actualPax,
          adults: actualPax,
          children: 0,
          notes,
        });
        const newCheckin = normalizeCheckin(response.data.data as unknown as ApiCheckin);
        setCheckins((prev) => [newCheckin, ...prev]);
        return newCheckin;
      } catch (err: unknown) {
        throw new Error(getApiErrorMessage(err, 'Gagal melakukan check-in'));
      }
    },
    [access, activeEventId, isLoadingAccess]
  );

  const scanToken = useCallback(
    async (token: string, notes?: string, actualPax = 1) => {
      if (!activeEventId) {
        throw new Error('Event aktif belum dipilih');
      }
      if (isLoadingAccess || !access?.permissions.includes('checkin:write')) {
        throw new Error('Role Anda tidak memiliki akses untuk melakukan check-in');
      }

      try {
        const response = await api.post<{ data: Checkin }>('/checkins', {
          method: 'qr_scan',
          token,
          event_id: activeEventId,
          actual_pax: actualPax,
          adults: actualPax,
          children: 0,
          notes,
        });
        const newCheckin = normalizeCheckin(response.data.data as unknown as ApiCheckin);
        setCheckins((prev) => [newCheckin, ...prev]);
        return newCheckin;
      } catch (err: unknown) {
        throw new Error(getApiErrorMessage(err, 'Gagal memindai QR'));
      }
    },
    [access, activeEventId, isLoadingAccess]
  );

  const walkIn = useCallback(
    async (data: {
      fullName: string;
      phone?: string;
      guestType?: string;
      actualPax?: number;
      adults?: number;
      children?: number;
      notes?: string;
      eventId?: string;
    }) => {
      if (isLoadingAccess || !access?.permissions.includes('checkin:write')) {
        throw new Error('Role Anda tidak memiliki akses untuk melakukan check-in');
      }

      try {
        const response = await api.post<{ data: Checkin }>('/checkins/walk-in', {
          full_name: data.fullName,
          phone: data.phone,
          guest_type: data.guestType ?? 'friend',
          actual_pax: data.actualPax ?? 1,
          adults: data.adults ?? data.actualPax ?? 1,
          children: data.children ?? 0,
          notes: data.notes,
          event_id: data.eventId ?? eventId,
        });
        const newCheckin = normalizeCheckin(response.data.data as unknown as ApiCheckin);
        setCheckins((prev) => [newCheckin, ...prev]);
        return newCheckin;
      } catch (err: unknown) {
        throw new Error(getApiErrorMessage(err, 'Gagal mendaftarkan walk-in'));
      }
    },
    [access, activeEventId, isLoadingAccess]
  );

  return {
    checkins,
    stats,
    isLoading,
    error,
    refetch: fetchCheckins,
    checkin,
    scanToken,
    walkIn,
  };
}
