import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  getWhatsAppReadiness,
  type WhatsAppIntegrationStatus,
  type WhatsAppReadiness,
} from '@/lib/whatsapp-onboarding';
import { useTenantStore } from '@/store/tenantStore';
import { getApiErrorMessage } from '@/lib/localization';

type SendWhatsAppPayload = {
  guest_ids: string[];
  template_id: string;
  variables?: Record<string, string>;
  channel?: 'whatsapp' | 'email';
};

export class WhatsAppOnboardingError extends Error {
  readonly readiness: WhatsAppReadiness;

  constructor(readiness: WhatsAppReadiness) {
    super(readiness.message);
    this.name = 'WhatsAppOnboardingError';
    this.readiness = readiness;
  }
}

function getErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, 'Gagal mengirim WhatsApp');
}

export function useWhatsAppMessaging() {
  const currentTenantId = useTenantStore((state) => state.currentTenant?.id);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppIntegrationStatus | null>(null);

  const loadStatus = useCallback(async () => {
    if (!currentTenantId) {
      setWhatsappStatus(null);
      return null;
    }
    try {
      const response = await api.get<{ data: WhatsAppIntegrationStatus }>('/integrations/whatsapp');
      const status = response.data.data;
      setWhatsappStatus(status);
      return status;
    } catch {
      setWhatsappStatus(null);
      return null;
    }
  }, [currentTenantId]);

  useEffect(() => {
    void loadStatus();
    if (!currentTenantId) return undefined;
    const interval = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(interval);
  }, [currentTenantId, loadStatus]);

  const ensureReady = useCallback(async () => {
    setIsChecking(true);
    try {
      const status = await loadStatus();
      const readiness = getWhatsAppReadiness(status);
      if (!readiness.ready) throw new WhatsAppOnboardingError(readiness);
      return status;
    } finally {
      setIsChecking(false);
    }
  }, [loadStatus]);

  const sendMessage = useCallback(async (payload: SendWhatsAppPayload) => {
    if (payload.guest_ids.length === 0) {
      throw new Error('Pilih minimal satu tamu');
    }
    if (!payload.template_id) {
      throw new Error('Pilih template WhatsApp terlebih dahulu');
    }

    setIsSending(true);
    try {
      if (payload.channel !== 'email') await ensureReady();
      const { channel: _channel, ...requestPayload } = payload;
      const response = await api.post('/messages/send', requestPayload);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, [ensureReady]);

  const sendWhatsApp = useCallback((payload: SendWhatsAppPayload) => sendMessage({ ...payload, channel: 'whatsapp' }), [sendMessage]);

  return { sendMessage, sendWhatsApp, ensureReady, whatsappStatus, isChecking, isSending };
}
