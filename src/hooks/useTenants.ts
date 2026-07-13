import { useCallback, useState } from 'react';
import api from '@/lib/api';
import { normalizeTenant, type BackendTenant } from '@/lib/workspace';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, Tenant } from '@/types';
import { bootstrapWorkspace } from '@/lib/workspace';

type TenantCreatePayload = {
  name: string;
  slug: string;
};

export function useTenants() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTenant = useTenantStore((s) => s.addTenant);
  const setTenant = useTenantStore((s) => s.setTenant);
  const setCurrentEvent = useTenantStore((s) => s.setCurrentEvent);

  const createTenant = useCallback(async (payload: TenantCreatePayload): Promise<Tenant> => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<BackendTenant>>('/tenants', payload);
      const tenant = normalizeTenant(response.data.data);
      addTenant(tenant);
      setTenant(tenant);
      setCurrentEvent(null);

      // Refresh tenant/event caches so the new workspace is immediately usable.
      await bootstrapWorkspace({ requireTenant: false, requireEvent: false });

      return tenant;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const message = axiosErr.response?.data?.message
        ?? axiosErr.response?.data?.error
        ?? (err instanceof Error ? err.message : 'Gagal membuat tenant');
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }, [addTenant, setCurrentEvent, setTenant]);

  return {
    createTenant,
    isCreating,
    error,
  };
}
