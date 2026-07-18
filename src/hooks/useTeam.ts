import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { TeamMember, ApiResponse, User, Permission, TenantRole } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

export type TeamRole = TenantRole;

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
  roleKey?: string;
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
  addMember: (data: { fullName: string; email: string; password: string; phone?: string; role: TeamRole }) => Promise<boolean>;
  updateRole: (id: string, role: TeamRole) => Promise<boolean>;
  removeMember: (id: string) => Promise<boolean>;
}

const emptyPermissions: Permission[] = [];

function getApiError(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
  return axiosErr.response?.data?.error
    ?? axiosErr.response?.data?.message
    ?? (err instanceof Error ? err.message : fallback);
}

function mapUser(user: BackendTeamMember['user'], role: TeamRole): User {
  const userRole: User['role'] =
    role === 'tenant_owner' || role === 'event_manager' ? 'admin' : role === 'viewer' ? 'viewer' : 'editor';

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

function normalizeTeamRole(role: string): TeamRole {
  switch (role) {
    case 'tenant_owner':
    case 'event_manager':
    case 'rsvp_officer':
    case 'registration_officer':
    case 'usher':
    case 'gift_officer':
    case 'viewer':
      return role;
    case 'owner':
      return 'tenant_owner';
    case 'admin':
      return 'event_manager';
    case 'editor':
      return 'rsvp_officer';
    default:
      return 'viewer';
  }
}

function mapMember(member: BackendTeamMember): TeamMember {
  const role = normalizeTeamRole(member.roleKey ?? member.role);

  return {
    id: member.userId,
    tenantId: member.tenantId,
    userId: member.userId,
    user: mapUser(member.user, role),
    role,
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
      setError(getApiError(err, 'Gagal memuat anggota tim'));
    } finally {
      setIsLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = useCallback(
    async (data: { fullName: string; email: string; password: string; phone?: string; role: TeamRole }): Promise<boolean> => {
      if (!currentTenantId) {
        setError('Tenant belum dipilih');
        return false;
      }

      try {
        await api.post('/team', {
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          ...(data.phone ? { phone: data.phone } : {}),
          role: data.role,
        });
        await fetchMembers();
        return true;
      } catch (err: unknown) {
        const msg = getApiError(err, 'Gagal menambahkan anggota');
        setError(msg);
        throw new Error(msg);
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
        await api.patch(`/team/${id}/role`, { role });
        await fetchMembers();
        return true;
      } catch (err: unknown) {
        const msg = getApiError(err, 'Gagal memperbarui peran');
        setError(msg);
        throw new Error(msg);
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
        const msg = getApiError(err, 'Gagal menghapus anggota');
        setError(msg);
        throw new Error(msg);
      }
    },
    [currentTenantId, fetchMembers]
  );

  return { members, isLoading, error, refetch: fetchMembers, addMember, updateRole, removeMember };
}
