import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Table, ApiResponse } from '@/types';

export interface UseSeatingReturn {
  tables: Table[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createTable: (data: Partial<Table>) => Promise<Table | null>;
  updateTable: (id: string, data: Partial<Table>) => Promise<Table | null>;
  deleteTable: (id: string) => Promise<boolean>;
  assignGuest: (tableId: string, guestId: string) => Promise<boolean>;
  unassignGuest: (tableId: string, guestId: string) => Promise<boolean>;
  autoAssign: (eventId: string) => Promise<boolean>;
}

export function useSeating(): UseSeatingReturn {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Table[]>>('/seating');
      setTables(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data seating';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = useCallback(async (data: Partial<Table>): Promise<Table | null> => {
    try {
      const res = await api.post<ApiResponse<Table>>('/seating', data);
      const newTable = res.data.data;
      setTables((prev) => [...prev, newTable]);
      return newTable;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat meja';
      setError(msg);
      return null;
    }
  }, []);

  const updateTable = useCallback(async (id: string, data: Partial<Table>): Promise<Table | null> => {
    try {
      const res = await api.patch<ApiResponse<Table>>(`/seating/${id}`, data);
      const updated = res.data.data;
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui meja';
      setError(msg);
      return null;
    }
  }, []);

  const deleteTable = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/seating/${id}`);
      setTables((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus meja';
      setError(msg);
      return false;
    }
  }, []);

  const assignGuest = useCallback(async (tableId: string, guestId: string): Promise<boolean> => {
    try {
      await api.post(`/seating/${tableId}/assign`, { guestId });
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, assignedGuests: [...t.assignedGuests, guestId] } : t
        )
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menempatkan tamu';
      setError(msg);
      return false;
    }
  }, []);

  const unassignGuest = useCallback(async (tableId: string, guestId: string): Promise<boolean> => {
    try {
      await api.post(`/seating/${tableId}/unassign`, { guestId });
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, assignedGuests: t.assignedGuests.filter((g) => g !== guestId) }
            : t
        )
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memindahkan tamu';
      setError(msg);
      return false;
    }
  }, []);

  const autoAssign = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      await api.post('/seating/auto-assign', { eventId });
      await fetchTables();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal auto-assign';
      setError(msg);
      return false;
    }
  }, [fetchTables]);

  return { tables, isLoading, error, refetch: fetchTables, createTable, updateTable, deleteTable, assignGuest, unassignGuest, autoAssign };
}
