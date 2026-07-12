import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { TeamMember, ApiResponse } from '@/types';

export interface UseTeamReturn {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  inviteMember: (data: { email: string; role: string; message?: string }) => Promise<TeamMember | null>;
  updateRole: (id: string, role: string) => Promise<boolean>;
  removeMember: (id: string) => Promise<boolean>;
}

export function useTeam(): UseTeamReturn {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<TeamMember[]>>('/team');
      setMembers(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat anggota tim';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(async (data: { email: string; role: string; message?: string }): Promise<TeamMember | null> => {
    try {
      const res = await api.post<ApiResponse<TeamMember>>('/team/invite', data);
      const newMember = res.data.data;
      setMembers((prev) => [...prev, newMember]);
      return newMember;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengundang anggota';
      setError(msg);
      return null;
    }
  }, []);

  const updateRole = useCallback(async (id: string, role: string): Promise<boolean> => {
    try {
      const res = await api.patch<ApiResponse<TeamMember>>(`/team/${id}/role`, { role });
      const updated = res.data.data;
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui peran';
      setError(msg);
      return false;
    }
  }, []);

  const removeMember = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/team/${id}`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus anggota';
      setError(msg);
      return false;
    }
  }, []);

  return { members, isLoading, error, refetch: fetchMembers, inviteMember, updateRole, removeMember };
}
