import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse, TenantAccess } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

export function useTenantAccess() {
  const tenantId = useTenantStore((state) => state.currentTenant?.id);
  const [access, setAccess] = useState<TenantAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!tenantId) {
      setAccess(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse<TenantAccess>>('/tenant-access');
      setAccess(response.data.data ?? null);
    } catch {
      setAccess(null);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchAccess();
  }, [fetchAccess]);

  return { access, isLoading, refetch: fetchAccess };
}
