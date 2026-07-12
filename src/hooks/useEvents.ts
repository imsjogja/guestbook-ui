import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Event } from '@/types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Event[] }>('/events');
      setEvents(response.data.data ?? []);
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
        const response = await api.post<{ data: Event }>('/events', data);
        const newEvent = response.data.data;
        setEvents((prev) => [newEvent, ...prev]);
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
        const response = await api.put<{ data: Event }>(`/events/${id}`, data);
        const updated = response.data.data;
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
        const response = await api.patch<{ data: Event }>(`/events/${id}/publish`);
        const updated = response.data.data;
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
