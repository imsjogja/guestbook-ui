import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Table, ApiResponse } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

type BackendAssignedGuest = {
  guest_id: string;
};

type BackendTableWithOccupancy = {
  id: string;
  event_id: string;
  name: string;
  shape: Table['shape'];
  capacity: number;
  position_x?: number | null;
  position_y?: number | null;
  assigned_guests?: BackendAssignedGuest[] | null;
};

type BackendSeatingLayout = {
  tables?: BackendTableWithOccupancy[] | null;
};

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
  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTable = useCallback((table: BackendTableWithOccupancy): Table => {
    const assignedGuests = Array.isArray(table.assigned_guests)
      ? table.assigned_guests.map((guest) => guest.guest_id).filter(Boolean)
      : [];

    return {
      id: table.id,
      eventId: table.event_id,
      name: table.name,
      shape: table.shape === 'rectangular' || table.shape === 'square' || table.shape === 'round'
        ? table.shape
        : 'round',
      capacity: table.capacity,
      positionX: typeof table.position_x === 'number' ? table.position_x : 0,
      positionY: typeof table.position_y === 'number' ? table.position_y : 0,
      assignedGuests,
    };
  }, []);

  const fetchTables = useCallback(async () => {
    if (!currentEventId) {
      setTables([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<BackendSeatingLayout>>('/seating/layout');
      const nextTables = (res.data.data?.tables ?? []).map(normalizeTable);
      setTables(nextTables);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data seating';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, normalizeTable]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = useCallback(async (data: Partial<Table>): Promise<Table | null> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return null;
    }

    try {
      const res = await api.post<ApiResponse<Table>>('/seating', data);
      const newTable: Table = {
        ...(res.data.data as Table),
        assignedGuests: [],
      };
      setTables((prev) => [...prev, newTable]);
      return newTable;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat meja';
      setError(msg);
      return null;
    }
  }, [currentEventId]);

  const updateTable = useCallback(async (id: string, data: Partial<Table>): Promise<Table | null> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return null;
    }

    try {
      const res = await api.patch<ApiResponse<Table>>(`/seating/${id}`, data);
      const updatedTable = res.data.data as Table;
      let returnedTable: Table = {
        ...updatedTable,
        assignedGuests: [],
      };
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          returnedTable = {
            ...updatedTable,
            assignedGuests: t.assignedGuests ?? [],
          };
          return returnedTable;
        })
      );
      return returnedTable;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui meja';
      setError(msg);
      return null;
    }
  }, [currentEventId]);

  const deleteTable = useCallback(async (id: string): Promise<boolean> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return false;
    }

    try {
      await api.delete(`/seating/${id}`);
      setTables((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus meja';
      setError(msg);
      return false;
    }
  }, [currentEventId]);

  const assignGuest = useCallback(async (tableId: string, guestId: string): Promise<boolean> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return false;
    }

    try {
      await api.post(`/seating/${tableId}/assign`, { guest_id: guestId });
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                assignedGuests: (t.assignedGuests ?? []).includes(guestId)
                  ? (t.assignedGuests ?? [])
                  : [...(t.assignedGuests ?? []), guestId],
              }
            : t
        )
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menempatkan tamu';
      setError(msg);
      return false;
    }
  }, [currentEventId]);

  const unassignGuest = useCallback(async (tableId: string, guestId: string): Promise<boolean> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return false;
    }

    try {
      await api.post(`/seating/${tableId}/unassign`, { guestId });
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, assignedGuests: (t.assignedGuests ?? []).filter((g) => g !== guestId) }
            : t
        )
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memindahkan tamu';
      setError(msg);
      return false;
    }
  }, [currentEventId]);

  const autoAssign = useCallback(async (eventId: string): Promise<boolean> => {
    if (!currentEventId) {
      const msg = 'Event aktif belum dipilih';
      setError(msg);
      return false;
    }

    try {
      await api.post('/seating/auto-assign', { eventId });
      await fetchTables();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal auto-assign';
      setError(msg);
      return false;
    }
  }, [currentEventId, fetchTables]);

  return { tables, isLoading, error, refetch: fetchTables, createTable, updateTable, deleteTable, assignGuest, unassignGuest, autoAssign };
}
