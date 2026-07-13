import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Event } from '@/types';
import type { ApiResponse } from '@/types';
import { normalizeEvent, type BackendEvent } from '@/lib/normalizers';
import { useTenantStore } from '@/store/tenantStore';

type EventCreatePayload = {
  name: string;
  type: 'wedding' | 'corporate' | 'seminar' | 'conference' | 'gathering' | 'government' | 'community' | 'vip' | 'family';
  start_date: string;
  description?: string;
  end_date?: string;
  rsvp_deadline?: string;
  capacity?: number;
  target_invites?: number;
  target_attendance?: number;
  dress_code?: string;
  privacy_notice?: string;
  guest_policy?: string;
};

type EventUpdatePayload = Partial<EventCreatePayload> & {
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived' | 'cancelled';
  settings?: Record<string, unknown>;
};

function mapStatusToBackend(status?: Event['status']): EventUpdatePayload['status'] {
  switch (status) {
    case 'active':
      return 'published';
    case 'paused':
      return 'ongoing';
    case 'archived':
      return 'archived';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'draft':
    default:
      return 'draft';
  }
}

function mapEventTypeToBackend(type?: Event['eventType']): EventCreatePayload['type'] {
  switch (type) {
    case 'wedding':
      return 'wedding';
    case 'corporate':
      return 'corporate';
    case 'birthday':
      return 'gathering';
    case 'government':
      return 'government';
    case 'other':
    default:
      return 'community';
  }
}

function toEventPayload(data: Partial<Event>): EventCreatePayload {
  return {
    name: data.name ?? '',
    type: mapEventTypeToBackend(data.eventType),
    start_date: data.startDate ?? new Date().toISOString(),
    description: data.location ?? data.description ?? '',
    end_date: data.endDate,
    capacity: data.capacity,
    dress_code: undefined,
    privacy_notice: undefined,
    guest_policy: undefined,
  };
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<BackendEvent[]>>('/events');
      setEvents((response.data.data ?? []).map(normalizeEvent));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message ?? 'Gagal memuat acara';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(
    async (data: Partial<Event>) => {
      try {
        const response = await api.post<ApiResponse<BackendEvent>>('/events', toEventPayload(data));
        const newEvent = normalizeEvent(response.data.data);
        setEvents((prev) => [newEvent, ...prev]);
        useTenantStore.getState().setCurrentEvent(newEvent);
        return newEvent;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal membuat acara');
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<Event>) => {
      try {
        const response = await api.put<ApiResponse<BackendEvent>>(`/events/${id}`, {
          ...(data.name ? { name: data.name } : {}),
          ...(data.eventType ? { type: data.eventType } : {}),
          ...(data.startDate ? { start_date: data.startDate } : {}),
          ...(data.endDate ? { end_date: data.endDate } : {}),
          ...(data.location ? { description: data.location } : {}),
          ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
          ...(data.status ? { status: mapStatusToBackend(data.status) } : {}),
        } as EventUpdatePayload);
        const updated = normalizeEvent(response.data.data);
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal memperbarui acara');
      }
    },
    []
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/events/${id}`);
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal menghapus acara');
      }
    },
    []
  );

  const publishEvent = useCallback(
    async (id: string) => {
      try {
        const response = await api.patch<ApiResponse<BackendEvent>>(`/events/${id}/publish`);
        const updated = normalizeEvent(response.data.data);
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal mempublikasikan acara');
      }
    },
    []
  );

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
  };
}
