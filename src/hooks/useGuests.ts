import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Guest } from '@/types';
import { normalizeGuest } from '@/lib/normalizers';
import { buildGuestExportCsv, downloadBlobFile, downloadTextFile } from '@/lib/guest-csv';

type BackendGuest = {
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
  institution?: string | null;
  title?: string | null;
  relationship?: string | null;
  pic?: string | null;
  accessibility_needs?: string | null;
  dietary_restrictions?: string | null;
  allergies?: string | null;
  notes?: string | null;
  consent_communication?: boolean;
  source?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

type GuestPayload = {
  full_name: string;
  guest_type: string;
  consent_communication: boolean;
  phone?: string;
  email?: string;
  segment?: string;
  dietary_restrictions?: string;
  notes?: string;
};

type PaginatedBackendGuestResponse = {
  data: BackendGuest[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
};

function mapUiCategoryToGuestType(category?: Guest['category'] | string): string {
  switch (category) {
    case 'vip':
      return 'vip';
    case 'family':
      return 'family';
    case 'friend':
      return 'friend';
    case 'colleague':
      return 'colleague';
    case 'partner':
      return 'vvip';
    case 'other':
    default:
      return 'general';
  }
}

function buildGuestPayload(data: Partial<Guest>): GuestPayload {
  const payload: GuestPayload = {
    full_name: (data.fullName ?? '').trim(),
    guest_type: mapUiCategoryToGuestType(data.category),
    consent_communication: true,
  };

  if (data.phone?.trim()) payload.phone = data.phone.trim();
  if (data.email?.trim()) payload.email = data.email.trim();
  if (data.subgroup?.trim()) payload.segment = data.subgroup.trim();
  if (data.dietaryRestrictions?.trim()) payload.dietary_restrictions = data.dietaryRestrictions.trim();
  if (data.notes?.trim()) payload.notes = data.notes.trim();

  return payload;
}

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
      const response = await api.get<PaginatedBackendGuestResponse>('/guests', { params });
      const normalized = (response.data.data ?? []).map(normalizeGuest);
      setGuests(normalized);
      setTotal(response.data.meta?.total ?? normalized.length);
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
        const response = await api.post<{ data: BackendGuest }>('/guests', buildGuestPayload(data));
        const newGuest = normalizeGuest(response.data.data);
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
        const response = await api.put<{ data: BackendGuest }>(`/guests/${id}`, buildGuestPayload(data));
        const updated = normalizeGuest(response.data.data);
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

  const downloadTemplateCSV = useCallback(async () => {
    try {
      const response = await api.get('/guests/import/template', { responseType: 'blob' });
      downloadBlobFile('guest_import_template.csv', response.data as Blob);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      throw new Error(axiosErr.response?.data?.message ?? 'Gagal mengunduh template CSV');
    }
  }, []);

  const exportGuestsCSV = useCallback(async () => {
    try {
      const perPage = 100;
      let page = 1;
      let totalPages = 1;
      const allGuests: Guest[] = [];

      while (page <= totalPages) {
        const response = await api.get<PaginatedBackendGuestResponse>('/guests', {
          params: { page, per_page: perPage },
        });
        const pageGuests = (response.data.data ?? []).map(normalizeGuest);
        allGuests.push(...pageGuests);
        totalPages = response.data.meta?.total_pages ?? (pageGuests.length < perPage ? page : page + 1);
        if (response.data.meta?.current_page !== undefined && response.data.meta.current_page >= totalPages) {
          break;
        }
        page += 1;
      }

      const csv = buildGuestExportCsv(allGuests);
      downloadTextFile(`guest_export_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
      return allGuests.length;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      throw new Error(axiosErr.response?.data?.message ?? 'Gagal mengekspor CSV');
    }
  }, []);

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
    downloadTemplateCSV,
    exportGuestsCSV,
  };
}
