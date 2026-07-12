import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Campaign, ApiResponse } from '@/types';

export interface UseCampaignsReturn {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign | null>;
  launchCampaign: (id: string) => Promise<boolean>;
  cancelCampaign: (id: string) => Promise<boolean>;
}

export function useCampaigns(): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Campaign[]>>('/campaigns');
      setCampaigns(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kampanye';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const res = await api.post<ApiResponse<Campaign>>('/campaigns', data);
      const newCampaign = res.data.data;
      setCampaigns((prev) => [newCampaign, ...prev]);
      return newCampaign;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kampanye';
      setError(msg);
      return null;
    }
  }, []);

  const launchCampaign = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await api.post<ApiResponse<Campaign>>(`/campaigns/${id}/launch`);
      const updated = res.data.data;
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjalankan kampanye';
      setError(msg);
      return false;
    }
  }, []);

  const cancelCampaign = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await api.post<ApiResponse<Campaign>>(`/campaigns/${id}/cancel`);
      const updated = res.data.data;
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan kampanye';
      setError(msg);
      return false;
    }
  }, []);

  return { campaigns, isLoading, error, refetch: fetchCampaigns, createCampaign, launchCampaign, cancelCampaign };
}
