import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useTenantStore } from '@/store/tenantStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeatures {
  whatsapp_campaign: boolean;
  custom_template: boolean;
  webhook: boolean;
  advanced_reports: boolean;
  remove_branding: boolean;
  priority_support: boolean;
}

export interface Plan {
  id: string;
  name: string;             // 'starter' | 'pro' | 'enterprise'
  display_name: string;     // 'Starter' | 'Pro' | 'Enterprise'
  billing_cycle: string;    // 'monthly' | 'yearly'
  price_idr: number;
  max_guests: number | null;
  max_events: number | null;
  max_team_members: number | null;
  max_campaigns_per_month: number | null;
  max_csv_import_rows: number | null;
  features: PlanFeatures;
  sort_order: number;
}

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'trial_expired' | 'suspended' | 'cancelled' | 'none';
  plan_name: string;
  display_name: string;
  billing_cycle: string;
  days_left: number;   // 9999 = unlimited, -1 = expired
  expires_at: string | null;
  max_guests: number | null;
  max_events: number | null;
  max_team_members: number | null;
  features: PlanFeatures;
}

export interface CheckoutResponse {
  snap_token: string;
  midtrans_order_id: string;
  plan_name: string;
  amount_idr: number;
}

export interface PlansResponse {
  plans: Plan[];
  client_key: string;
  snap_url: string;
}

function unwrapApiData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;
  return record.data !== undefined ? record.data : payload;
}

export function normalizePlansResponse(payload: unknown): PlansResponse {
  const unwrapped = unwrapApiData(payload);
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) {
    return { plans: [], client_key: '', snap_url: '' };
  }

  const record = unwrapped as Record<string, unknown>;
  return {
    plans: Array.isArray(record.plans) ? record.plans as Plan[] : [],
    client_key: typeof record.client_key === 'string' ? record.client_key : '',
    snap_url: typeof record.snap_url === 'string' ? record.snap_url : '',
  };
}

export function normalizePaymentHistory(payload: unknown): PaymentHistoryItem[] {
  const unwrapped = unwrapApiData(payload);
  if (Array.isArray(unwrapped)) return unwrapped as PaymentHistoryItem[];

  if (unwrapped && typeof unwrapped === 'object') {
    const record = unwrapped as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as PaymentHistoryItem[];
    if (Array.isArray(record.data)) return record.data as PaymentHistoryItem[];
  }

  return [];
}

// ─── useSubscription ──────────────────────────────────────────────────────────

export function useSubscription() {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!currentTenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: SubscriptionStatus }>('/billing/subscription');
      // API wraps in { data: {...} } envelope
      setStatus(response.data.data ?? response.data as unknown as SubscriptionStatus);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      // A 401/403 from billing is non-fatal — user just doesn't have a subscription yet
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        setStatus(null);
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal memuat status langganan');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Derived helpers
  const isOnTrial = status?.status === 'trial';
  const isTrialExpired = status?.status === 'trial_expired';
  const isActive = status?.status === 'active';
  const isSuspended = status?.status === 'suspended' || status?.status === 'cancelled';
  const needsUpgrade = isTrialExpired || isSuspended;
  const trialDaysLeft = isOnTrial ? status?.days_left ?? 0 : 0;

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!status) return false;
    if (isOnTrial) return true; // trial gets all Pro features
    if (needsUpgrade) return false;
    return status.features?.[feature] ?? false;
  };

  const canAddGuest = (currentCount: number): boolean => {
    if (!status || needsUpgrade) return false;
    if (status.max_guests === null) return true;
    return currentCount < status.max_guests;
  };

  const canAddEvent = (currentCount: number): boolean => {
    if (!status || needsUpgrade) return false;
    if (status.max_events === null) return true;
    return currentCount < status.max_events;
  };

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    isOnTrial,
    isTrialExpired,
    isActive,
    isSuspended,
    needsUpgrade,
    trialDaysLeft,
    hasFeature,
    canAddGuest,
    canAddEvent,
  };
}

// ─── usePlans ─────────────────────────────────────────────────────────────────

export function usePlans() {
  const [data, setData] = useState<PlansResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.get<unknown>('/billing/plans')
      .then((res) => setData(normalizePlansResponse(res.data)))
      .catch(() => setError('Gagal memuat paket harga'))
      .finally(() => setIsLoading(false));
  }, []);

  // Group plans by name with both billing cycles
  const groupedPlans = (data?.plans || []).reduce((acc, plan) => {
    if (!acc[plan.name]) acc[plan.name] = {};
    acc[plan.name][plan.billing_cycle] = plan;
    return acc;
  }, {} as Record<string, Record<string, Plan>>);

  return { data, plans: data?.plans || [], groupedPlans, isLoading, error };
}

// ─── checkout helper ──────────────────────────────────────────────────────────

export async function initiateCheckout(planId: string, billingCycle: string): Promise<CheckoutResponse> {
  const response = await api.post<{ data: CheckoutResponse }>('/billing/checkout', {
    plan_id: planId,
    billing_cycle: billingCycle,
  });
  return response.data.data ?? response.data as unknown as CheckoutResponse;
}

export interface PaymentHistoryItem {
  id: string;
  midtrans_order_id: string;
  plan?: {
    name: string;
    display_name: string;
  };
  billing_cycle: string;
  amount_idr: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function usePaymentHistory() {
  const [data, setData] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.get<unknown>('/billing/history')
      .then((res) => setData(normalizePaymentHistory(res.data)))
      .catch(() => setError('Gagal memuat riwayat pembayaran'))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}
