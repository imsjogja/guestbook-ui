import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse, EventAccess, EventMember, EventRole } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

export function useEventMembers(eventId?: string) {
  const currentEventId = useTenantStore((state) => state.currentEvent?.id);
  const activeEventId = eventId ?? currentEventId;
  const [members, setMembers] = useState<EventMember[]>([]);
  const [access, setAccess] = useState<EventAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeEventId) {
      setMembers([]);
      setAccess(null);
      setIsLoading(false);
      setError('Acara belum dipilih');
      return;
    }
    setIsLoading(true);
    setError(null);
    const [membersResult, accessResult] = await Promise.allSettled([
      api.get<ApiResponse<EventMember[]>>('/event-members'),
      api.get<ApiResponse<EventAccess>>('/event-access'),
    ]);

    if (membersResult.status === 'fulfilled') {
      // Keep the UI aligned with the active assignment model during rollout.
      setMembers((membersResult.value.data.data ?? []).filter((member) => member.status !== 'inactive'));
    } else {
      const axiosErr = membersResult.reason as { response?: { data?: { error?: string; message?: string } } };
      setMembers([]);
      setError(axiosErr.response?.data?.error ?? axiosErr.response?.data?.message ?? 'Gagal memuat tim acara');
    }

    if (accessResult.status === 'fulfilled') {
      setAccess(accessResult.value.data.data ?? null);
    } else {
      setAccess(null);
      if (membersResult.status === 'fulfilled') {
        const axiosErr = accessResult.reason as { response?: { data?: { error?: string; message?: string } } };
        setError(axiosErr.response?.data?.error ?? axiosErr.response?.data?.message ?? 'Gagal memuat akses acara');
      }
    }
    setIsLoading(false);
  }, [activeEventId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const assignMember = useCallback(async (userId: string, role: EventRole) => {
    await api.post('/event-members', { user_id: userId, role });
    await fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = useCallback(async (userId: string, role: EventRole) => {
    await api.patch(`/event-members/${userId}`, { role });
    await fetchMembers();
  }, [fetchMembers]);

  const removeMember = useCallback(async (userId: string) => {
    await api.delete(`/event-members/${userId}`);
    await fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    access,
    isLoading,
    error,
    refetch: fetchMembers,
    assignMember,
    updateMemberRole,
    removeMember,
  };
}
