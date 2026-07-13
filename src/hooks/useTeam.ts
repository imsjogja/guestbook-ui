import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { TeamMember, ApiResponse, User, Permission } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

interface BackendTeamMember {
  id: string;
  tenantId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  };
  role: string;
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string;
  status: string;
  permissions?: string[];
}

export interface UseTeamReturn {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  inviteMember: (data: { email: string; role: TeamRole; message?: string }) => Promise<boolean>;
  updateRole: (id: string, role: TeamRole) => Promise<boolean>;
  removeMember: (id: string) => Promise<boolean>;
}

const emptyPermissions: Permission[] = [];

function toUIRole(role: string): TeamRole {
  switch (role) {
    case 'tenant_owner':
      return 'owner';
    case 'event_manager':
      return 'admin';
    case 'rsvp_officer':
    case 'registration_officer':
      return 'editor';
    case 'usher':
    case 'gift_officer':
    case 'viewer':
    default:
      return 'viewer';
  }
}

function toBackendRole(role: TeamRole): string {
  switch (role) {
    case 'owner':
      return 'tenant_owner';
    case 'admin':
      return 'event_manager';
    case 'editor':
      return 'rsvp_officer';
    case 'viewer':
    default:
      return 'viewer';
  }
}

function mapUser(user: BackendTeamMember['user'], role: TeamRole): User {
  const userRole: User['role'] =
    role === 'owner' ? 'admin' : role === 'admin' ? 'admin' : role === 'editor' ? 'editor' : 'viewer';

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: userRole,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapMember(member: BackendTeamMember): TeamMember {
  const uiRole = toUIRole(member.role);

  return {
    id: member.userId,
    tenantId: member.tenantId,
    userId: member.userId,
    user: mapUser(member.user, uiRole),
    role: uiRole,
    invitedBy: member.invitedBy || '',
    invitedAt: member.invitedAt || '',
    acceptedAt: member.acceptedAt || undefined,
    status: member.status === 'pending' || member.status === 'inactive' ? member.status : 'active',
    permissions: member.permissions?.length ? (member.permissions as Permission[]) : emptyPermissions,
  };
}

export function useTeam(): UseTeamReturn {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTenantId = useTenantStore((s) => s.currentTenant?.id ?? null);

  const fetchMembers = useCallback(async () => {
    if (!currentTenantId) {
      setMembers([]);
      setIsLoading(false);
      setError('Tenant belum dipilih');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<BackendTeamMember[]>>('/team');
      const data = res.data.data || [];
      setMembers(data.map(mapMember));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat anggota tim';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (data: { email: string; role: TeamRole; message?: string }): Promise<boolean> => {
      if (!currentTenantId) {
        setError('Tenant belum dipilih');
        return false;
      }

      try {
        await api.post('/team/invite', {
          email: data.email,
          role: toBackendRole(data.role),
          message: data.message,
        });
        await fetchMembers();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengundang anggota';
        setError(msg);
        return false;
      }
    },
    [currentTenantId, fetchMembers]
  );

  const updateRole = useCallback(
    async (id: string, role: TeamRole): Promise<boolean> => {
      if (!currentTenantId) {
        setError('Tenant belum dipilih');
        return false;
      }

      try {
        await api.patch(`/team/${id}/role`, { role: toBackendRole(role) });
        await fetchMembers();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui peran';
        setError(msg);
        return false;
      }
    },
    [currentTenantId, fetchMembers]
  );

  const removeMember = useCallback(
    async (id: string): Promise<boolean> => {
      if (!currentTenantId) {
        setError('Tenant belum dipilih');
        return false;
      }

      try {
        await api.delete(`/team/${id}`);
        await fetchMembers();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus anggota';
        setError(msg);
        return false;
      }
    },
    [currentTenantId, fetchMembers]
  );

  return { members, isLoading, error, refetch: fetchMembers, inviteMember, updateRole, removeMember };
}
