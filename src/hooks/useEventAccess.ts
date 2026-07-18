import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse, EventAccess } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

export function useEventAccess() {
  const currentEventId = useTenantStore((state) => state.currentEvent?.id);
  const [access, setAccess] = useState<EventAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!currentEventId) {
      setAccess(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse<EventAccess>>('/event-access');
      setAccess(response.data.data ?? null);
    } catch {
      // Keep navigation available while the access request is transiently unavailable.
      setAccess(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    void fetchAccess();
  }, [fetchAccess]);

  return { access, isLoading, refetch: fetchAccess };
}
