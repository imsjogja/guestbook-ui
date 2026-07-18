import { useCallback, useState } from 'react';
import api from '@/lib/api';

type SendWhatsAppPayload = {
  guest_ids: string[];
  template_id: string;
  variables?: Record<string, string>;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return response?.data?.error || response?.data?.message || 'Gagal mengirim WhatsApp';
  }
  return error instanceof Error ? error.message : 'Gagal mengirim WhatsApp';
}

export function useWhatsAppMessaging() {
  const [isSending, setIsSending] = useState(false);

  const sendWhatsApp = useCallback(async (payload: SendWhatsAppPayload) => {
    if (payload.guest_ids.length === 0) {
      throw new Error('Pilih minimal satu tamu');
    }
    if (!payload.template_id) {
      throw new Error('Pilih template WhatsApp terlebih dahulu');
    }

    setIsSending(true);
    try {
      const response = await api.post('/messages/send', payload);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, []);

  return { sendWhatsApp, isSending };
}
