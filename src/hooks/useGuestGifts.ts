import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { buildGiftMap, normalizeGuestGift, type BackendGuestGift } from '@/lib/guest-gift';
import type { ApiResponse, GuestGift } from '@/types';

type GuestGiftListResponse = ApiResponse<BackendGuestGift[]>;

type GuestGiftPayload = {
  amount: number;
  gift_type?: 'cash' | 'transfer' | 'goods' | 'other';
  notes?: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as { response?: { data?: { error?: string; message?: string } } }).response?.data;
  return responseData?.error ?? responseData?.message ?? fallback;
}

export function useGuestGifts(eventId?: string) {
  const [gifts, setGifts] = useState<GuestGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async (silent = false) => {
    if (!eventId) {
      setGifts([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<GuestGiftListResponse>('/gifts');
      setGifts((response.data.data ?? []).map(normalizeGuestGift));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Gagal memuat data angpau'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchGifts();
  }, [fetchGifts]);

  const upsertGift = useCallback(async (guestId: string, payload: GuestGiftPayload) => {
    try {
      const response = await api.patch<ApiResponse<BackendGuestGift>>(`/gifts/by-guest/${guestId}`, payload);
      const gift = normalizeGuestGift(response.data.data);
      setGifts((previous) => [gift, ...previous.filter((item) => item.guestId !== guestId)]);
      return gift;
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Gagal menyimpan data angpau'));
    }
  }, []);

  const deleteGift = useCallback(async (guestId: string) => {
    try {
      await api.delete(`/gifts/by-guest/${guestId}`);
      setGifts((previous) => previous.filter((item) => item.guestId !== guestId));
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Gagal menghapus data angpau'));
    }
  }, []);

  const giftByGuestId = useMemo(() => buildGiftMap(gifts), [gifts]);
  const refreshSilently = useCallback(() => fetchGifts(true), [fetchGifts]);

  return {
    gifts,
    giftByGuestId,
    isLoading,
    error,
    refetch: fetchGifts,
    refreshSilently,
    upsertGift,
    deleteGift,
  };
}
