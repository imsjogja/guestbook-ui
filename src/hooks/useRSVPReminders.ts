import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface RSVPReminderCandidate {
  eventGuestId: string;
  guestId: string;
  fullName: string;
  phone?: string;
  email?: string;
  invitationId: string;
  invitationStatus: string;
  lastReminderAt?: string;
  reminderCount: number;
}

interface BackendRSVPReminderCandidate {
  event_guest_id: string;
  guest_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  invitation_id: string;
  invitation_status: string;
  last_reminder_at?: string | null;
  reminder_count?: number;
}

export interface RSVPReminderSkip {
  guestId: string;
  fullName: string;
  reason: string;
}

export interface RSVPReminderMessage {
  id: string;
  guestId: string;
  channel: 'whatsapp' | 'email';
  status: string;
  errorMessage?: string;
}

export interface RSVPReminderSendResult {
  messages: RSVPReminderMessage[];
  skipped: RSVPReminderSkip[];
  totalCandidates: number;
  deadlinePassed: boolean;
}

interface BackendRSVPReminderResult {
  messages?: Array<{
    id: string;
    guest_id: string;
    channel: 'whatsapp' | 'email';
    status: string;
    error_message?: string | null;
  }>;
  skipped?: Array<{
    guest_id: string;
    full_name: string;
    reason: string;
  }>;
  total_candidates?: number;
  deadline_passed?: boolean;
}

function normalizeCandidate(raw: BackendRSVPReminderCandidate): RSVPReminderCandidate {
  return {
    eventGuestId: raw.event_guest_id,
    guestId: raw.guest_id,
    fullName: raw.full_name,
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    invitationId: raw.invitation_id,
    invitationStatus: raw.invitation_status,
    lastReminderAt: raw.last_reminder_at ?? undefined,
    reminderCount: raw.reminder_count ?? 0,
  };
}

function normalizeResult(raw: BackendRSVPReminderResult): RSVPReminderSendResult {
  return {
    messages: (raw.messages ?? []).map((message) => ({
      id: message.id,
      guestId: message.guest_id,
      channel: message.channel,
      status: message.status,
      errorMessage: message.error_message ?? undefined,
    })),
    skipped: (raw.skipped ?? []).map((item) => ({
      guestId: item.guest_id,
      fullName: item.full_name,
      reason: item.reason,
    })),
    totalCandidates: raw.total_candidates ?? 0,
    deadlinePassed: raw.deadline_passed ?? false,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
  return axiosError.response?.data?.error ?? axiosError.response?.data?.message ?? fallback;
}

export function useRSVPReminders(eventId?: string) {
  const [candidates, setCandidates] = useState<RSVPReminderCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!eventId) {
      setCandidates([]);
      return [];
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<{ candidates: BackendRSVPReminderCandidate[]; total: number }>>(
        '/rsvp/reminders/candidates',
        { params: { eventId } }
      );
      const normalized = (response.data.data?.candidates ?? []).map(normalizeCandidate);
      setCandidates(normalized);
      return normalized;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Gagal memuat kandidat pengingat RSVP');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const sendReminders = useCallback(
    async (templateId: string, guestIds: string[] = []) => {
      if (!eventId) throw new Error('Event aktif belum dipilih');
      if (!templateId) throw new Error('Template pengingat belum dipilih');

      try {
        const response = await api.post<ApiResponse<BackendRSVPReminderResult>>('/rsvp/reminders', {
          template_id: templateId,
          ...(guestIds.length > 0 ? { guest_ids: guestIds } : {}),
        });
        const result = normalizeResult(response.data.data ?? {});
        await fetchCandidates();
        return result;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, 'Gagal mengirim pengingat RSVP'));
      }
    },
    [eventId, fetchCandidates]
  );

  return {
    candidates,
    isLoading,
    error,
    fetchCandidates,
    sendReminders,
  };
}
