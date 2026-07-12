import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Invitation, ApiResponse } from '@/types';

export interface UseInvitationsReturn {
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createInvitation: (data: Partial<Invitation>) => Promise<Invitation | null>;
  batchCreate: (guestIds: string[], channel: string, templateId?: string) => Promise<boolean>;
  revokeInvitation: (id: string) => Promise<boolean>;
  resendInvitation: (id: string) => Promise<boolean>;
}

export function useInvitations(): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Invitation[]>>('/invitations');
      setInvitations(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data undangan';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = useCallback(async (data: Partial<Invitation>): Promise<Invitation | null> => {
    try {
      const res = await api.post<ApiResponse<Invitation>>('/invitations', data);
      const newInv = res.data.data;
      setInvitations((prev) => [newInv, ...prev]);
      return newInv;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat undangan';
      setError(msg);
      return null;
    }
  }, []);

  const batchCreate = useCallback(async (guestIds: string[], channel: string, templateId?: string): Promise<boolean> => {
    try {
      const res = await api.post<ApiResponse<Invitation[]>>('/invitations/batch', {
        guestIds,
        channel,
        templateId,
      });
      const newInvs = res.data.data;
      if (newInvs && newInvs.length > 0) {
        setInvitations((prev) => {
          const prevFiltered = prev.filter((p) => !newInvs.find((n) => n.id === p.id));
          return [...newInvs, ...prevFiltered];
        });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat undangan massal';
      setError(msg);
      return false;
    }
  }, []);

  const revokeInvitation = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.post(`/invitations/${id}/revoke`);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: 'revoked' as unknown as typeof inv.status } : inv
        )
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencabut undangan';
      setError(msg);
      return false;
    }
  }, []);

  const resendInvitation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await api.post<ApiResponse<Invitation>>(`/invitations/${id}/resend`);
      const updated = res.data.data;
      setInvitations((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang undangan';
      setError(msg);
      return false;
    }
  }, []);

  return { invitations, isLoading, error, refetch: fetchInvitations, createInvitation, batchCreate, revokeInvitation, resendInvitation };
}
