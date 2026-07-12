import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Guest } from '@/types';

export function useGuests(eventId?: string) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get<{ data: Guest[]; meta?: { total: number } }>('/guests', { params });
      setGuests(response.data.data ?? []);
      setTotal(response.data.meta?.total ?? (response.data.data ?? []).length);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message ?? 'Gagal memuat tamu';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const createGuest = useCallback(
    async (data: Partial<Guest>) => {
      try {
        const response = await api.post<{ data: Guest }>('/guests', data);
        const newGuest = response.data.data;
        setGuests((prev) => [newGuest, ...prev]);
        setTotal((prev) => prev + 1);
        return newGuest;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal menambah tamu');
      }
    },
    []
  );

  const updateGuest = useCallback(
    async (id: string, data: Partial<Guest>) => {
      try {
        const response = await api.put<{ data: Guest }>(`/guests/${id}`, data);
        const updated = response.data.data;
        setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
        return updated;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal memperbarui tamu');
      }
    },
    []
  );

  const deleteGuest = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/guests/${id}`);
        setGuests((prev) => prev.filter((g) => g.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal menghapus tamu');
      }
    },
    []
  );

  const importCSV = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (eventId) formData.append('eventId', eventId);
        const response = await api.post<{ data: { imported: number } }>('/guests/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await fetchGuests();
        return response.data.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal mengimpor CSV');
      }
    },
    [eventId, fetchGuests]
  );

  return {
    guests,
    total,
    isLoading,
    error,
    refetch: fetchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    importCSV,
  };
}
