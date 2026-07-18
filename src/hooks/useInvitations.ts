import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Invitation, ApiResponse } from '@/types';
import { normalizeInvitation } from '@/lib/normalizers';

type BackendInvitation = {
  id: string;
  tenant_id: string;
  event_id: string;
  guest_id: string;
  url?: string | null;
  channel?: string | null;
  status?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_reason?: string | null;
  delivery_status?: string | null;
  delivery_channel?: string | null;
  delivery_sent_at?: string | null;
  delivery_delivered_at?: string | null;
  delivery_read_at?: string | null;
  delivery_failed_at?: string | null;
  delivery_error_message?: string | null;
  delivery_external_id?: string | null;
  delivery_provider_http_status?: number | null;
  qr_code_url?: string | null;
  short_link?: string | null;
  created_at: string;
  updated_at: string;
};

type InvitationCreatePayload = {
  guest_ids: string[];
  max_pax: number;
  adults: number;
  children: number;
  plus_one_allowed: boolean;
  plus_one_required: boolean;
  expires_at?: string;
};

export interface UseInvitationsReturn {
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  createInvitation: (data: Partial<Invitation> & { guestId?: string; guestIds?: string[]; expiresAt?: string }) => Promise<Invitation | null>;
  batchCreate: (guestIds: string[], channel: string, templateId?: string) => Promise<Invitation[]>;
  revokeInvitation: (id: string) => Promise<boolean>;
  resendInvitation: (id: string) => Promise<boolean>;
}

function normalizeInvitationResponse(invitation: BackendInvitation): Invitation {
  return normalizeInvitation(invitation as unknown as Parameters<typeof normalizeInvitation>[0]);
}

function toCreatePayload(data: Partial<Invitation> & { guestId?: string; guestIds?: string[]; expiresAt?: string }): InvitationCreatePayload {
  const guestIds = data.guestIds ?? (data.guestId ? [data.guestId] : []);
  return {
    guest_ids: guestIds,
    max_pax: 1,
    adults: 1,
    children: 0,
    plus_one_allowed: false,
    plus_one_required: false,
    ...(data.expiresAt ? { expires_at: data.expiresAt } : {}),
  };
}

export function useInvitations(eventId?: string): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async (silent = false) => {
    if (!eventId) {
      setInvitations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await api.get<ApiResponse<BackendInvitation[]>>('/invitations');
      setInvitations((res.data.data || []).map(normalizeInvitationResponse));
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data undangan';
      // Keep the current table visible during a transient background refresh failure.
      if (!silent) setError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchInvitations();
    if (!eventId) return undefined;

    const interval = window.setInterval(() => {
      void fetchInvitations(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [eventId, fetchInvitations]);

  const createInvitation = useCallback(async (data: Partial<Invitation> & { guestId?: string; guestIds?: string[]; expiresAt?: string }): Promise<Invitation | null> => {
    if (!eventId) {
      setError('Event aktif belum dipilih');
      return null;
    }

    try {
      const res = await api.post<ApiResponse<BackendInvitation>>('/invitations', toCreatePayload(data));
      const newInv = normalizeInvitationResponse(res.data.data);
      setInvitations((prev) => [newInv, ...prev]);
      return newInv;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat undangan';
      setError(msg);
      return null;
    }
  }, [eventId]);

  const batchCreate = useCallback(async (guestIds: string[], _channel: string, _templateId?: string): Promise<Invitation[]> => {
    if (!eventId) {
      setError('Event aktif belum dipilih');
      return [];
    }

    try {
      const res = await api.post<ApiResponse<BackendInvitation[]>>('/invitations/batch', {
        guest_ids: guestIds,
        max_pax: 1,
        adults: 1,
        children: 0,
        plus_one_allowed: false,
        plus_one_required: false,
      } satisfies InvitationCreatePayload);
      const newInvs = (res.data.data || []).map(normalizeInvitationResponse);
      if (newInvs.length > 0) {
        setInvitations((prev) => {
          const prevFiltered = prev.filter((p) => !newInvs.find((n) => n.id === p.id));
          return [...newInvs, ...prevFiltered];
        });
      }
      return newInvs;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat undangan massal';
      setError(msg);
      return [];
    }
  }, [eventId]);

  const revokeInvitation = useCallback(async (id: string): Promise<boolean> => {
    if (!eventId) {
      setError('Event aktif belum dipilih');
      return false;
    }

    try {
      await api.delete(`/invitations/${id}`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencabut undangan';
      setError(msg);
      return false;
    }
  }, [eventId]);

  const resendInvitation = useCallback(async (_id: string): Promise<boolean> => {
    return false;
  }, []);

  return {
    invitations,
    isLoading,
    error,
    refetch: fetchInvitations,
    refresh: () => fetchInvitations(true),
    createInvitation,
    batchCreate,
    revokeInvitation,
    resendInvitation,
  };
}
