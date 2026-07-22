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

type BackendEventGuestResponse = {
  id: string;
  event_id: string;
  guest_id: string;
  status: string;
  max_pax?: number;
  plus_one_allowed?: boolean;
  guest: BackendGuest;
};

type PaginatedBackendEventGuestResponse = {
  data: BackendEventGuestResponse[];
  meta?: PaginatedBackendGuestResponse['meta'];
};

type GuestSearchResponse = {
  data: BackendGuest[];
};

export interface GuestImportResult {
  total_rows: number;
  success_count: number;
  error_count: number;
  errors?: Array<{
    row_num: number;
    full_name?: string;
    errors?: string[];
  }>;
  imported_guest_ids?: string[];
}

function normalizeEventGuest(item: BackendEventGuestResponse): Guest {
  return {
    ...normalizeGuest(item.guest),
    eventId: item.event_id,
    eventGuestId: item.id,
    plusOne: item.plus_one_allowed ?? false,
  };
}

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

function normalizePhone(value?: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function samePhone(left?: string | null, right?: string | null): boolean {
  const normalizedLeft = normalizePhone(left);
  const normalizedRight = normalizePhone(right);
  return normalizedLeft !== '' && normalizedLeft === normalizedRight;
}

function matchesGuest(guest: BackendGuest, data: Partial<Guest>): boolean {
  const phoneMatches = Boolean(data.phone?.trim() && samePhone(guest.phone, data.phone));
  const emailMatches = Boolean(
    data.email?.trim() && guest.email?.trim().toLowerCase() === data.email.trim().toLowerCase()
  );
  return phoneMatches || emailMatches;
}

async function searchExistingMasterGuest(data: Partial<Guest>): Promise<BackendGuest | null> {
  const matches = new Map<string, BackendGuest>();
  const phone = data.phone?.trim();
  const normalizedPhone = normalizePhone(phone);
  const localPhone = normalizedPhone.startsWith('62') ? `0${normalizedPhone.slice(2)}` : undefined;
  const searchValues = [phone, normalizedPhone, localPhone, data.email?.trim()]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index);

  for (const value of searchValues) {
    const response = await api.get<GuestSearchResponse>('/guests/search', { params: { q: value } });
    for (const guest of response.data.data ?? []) {
      if (matchesGuest(guest, data)) matches.set(guest.id, guest);
    }
  }

  return matches.values().next().value ?? null;
}

export function useGuests(eventId?: string, options?: { perPage?: number; all?: boolean }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuests = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const perPage = Math.min(options?.perPage ?? 20, 100);
      const loadPage = async (page: number) => {
        const params = eventId
          ? { status: 'active', page, per_page: perPage }
          : { page, per_page: perPage };
        const response = eventId
          ? await api.get<PaginatedBackendEventGuestResponse>('/event-guests', { params })
          : await api.get<PaginatedBackendGuestResponse>('/guests', { params });
        const normalized: Guest[] = eventId
          ? (response.data as PaginatedBackendEventGuestResponse).data.map(normalizeEventGuest)
          : (response.data as PaginatedBackendGuestResponse).data.map(normalizeGuest);
        return { normalized, meta: response.data.meta };
      };

      const firstPage = await loadPage(1);
      const normalized = [...firstPage.normalized];
      let totalPages = firstPage.meta?.total_pages ?? 1;
      if (options?.all && totalPages > 1) {
        for (let page = 2; page <= totalPages; page += 1) {
          const nextPage = await loadPage(page);
          normalized.push(...nextPage.normalized);
          totalPages = nextPage.meta?.total_pages ?? totalPages;
        }
      }
      setGuests(normalized);
      setTotal(firstPage.meta?.total ?? normalized.length);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message ?? 'Gagal memuat tamu';
      setError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [eventId, options?.all, options?.perPage]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const refetch = useCallback(() => fetchGuests(), [fetchGuests]);
  const refreshSilently = useCallback(() => fetchGuests(true), [fetchGuests]);

  const createGuest = useCallback(
    async (data: Partial<Guest>) => {
      try {
        const existingMasterGuest = eventId ? await searchExistingMasterGuest(data) : null;
        let masterGuest: Guest;
        if (existingMasterGuest) {
          masterGuest = normalizeGuest(existingMasterGuest);
        } else {
          const response = await api.post<{ data: BackendGuest }>('/guests', buildGuestPayload(data));
          masterGuest = normalizeGuest(response.data.data);
        }
        const newGuest = eventId
          ? normalizeEventGuest((await api.post<{ data: BackendEventGuestResponse }>('/event-guests', {
              guest_id: masterGuest.id,
              source: 'manual',
              max_pax: 1,
              adults: 1,
            })).data.data)
          : masterGuest;
        setGuests((prev) => [newGuest, ...prev]);
        setTotal((prev) => prev + 1);
        return newGuest;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal menambah tamu');
      }
    },
    [eventId]
  );

  const updateGuest = useCallback(
    async (id: string, data: Partial<Guest>) => {
      try {
        const response = await api.patch<{ data: BackendGuest }>(`/guests/${id}`, buildGuestPayload(data));
        const updated = normalizeGuest(response.data.data);
        const existing = guests.find((guest) => guest.id === id);
        const result = existing
          ? { ...updated, eventId: existing.eventId, eventGuestId: existing.eventGuestId }
          : updated;
        setGuests((prev) => prev.map((g) => (g.id === id ? result : g)));
        return result;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal memperbarui tamu');
      }
    },
    [eventId, guests]
  );

  const deleteGuest = useCallback(
    async (id: string) => {
      try {
        await api.delete(eventId ? `/event-guests/${guests.find((guest) => guest.id === id)?.eventGuestId ?? id}` : `/guests/${id}`);
        setGuests((prev) => prev.filter((g) => g.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        throw new Error(axiosErr.response?.data?.message ?? 'Gagal menghapus tamu');
      }
    },
    [eventId, guests]
  );

  const importCSV = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (eventId) formData.append('eventId', eventId);
        const response = await api.post<{ data: GuestImportResult }>(eventId ? '/event-guests/import' : '/guests/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await fetchGuests();
        return response.data.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
        throw new Error(axiosErr.response?.data?.error ?? axiosErr.response?.data?.message ?? 'Gagal mengimpor CSV');
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
        const response = eventId
          ? await api.get<PaginatedBackendEventGuestResponse>('/event-guests', {
              params: { page, per_page: perPage, status: 'active' },
            })
          : await api.get<PaginatedBackendGuestResponse>('/guests', {
          params: { page, per_page: perPage },
            });
        const pageGuests: Guest[] = eventId
          ? (response.data as PaginatedBackendEventGuestResponse).data.map(normalizeEventGuest)
          : (response.data as PaginatedBackendGuestResponse).data.map(normalizeGuest);
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
  }, [eventId]);

  return {
    guests,
    total,
    isLoading,
    error,
    refetch,
    refreshSilently,
    createGuest,
    updateGuest,
    deleteGuest,
    importCSV,
    downloadTemplateCSV,
    exportGuestsCSV,
  };
}
