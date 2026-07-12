import { create } from 'zustand';
import type { Tenant } from '@/types';

interface TenantState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;

  setTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Tenant) => void;
  removeTenant: (tenantId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  currentTenant: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('gf_current_tenant');
      return raw ? JSON.parse(raw) as Tenant : null;
    } catch {
      return null;
    }
  })(),
  tenants: [],
  isLoading: false,

  setTenant: (tenant: Tenant | null) => {
    if (tenant) {
      localStorage.setItem('gf_current_tenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('gf_current_tenant');
    }
    set({ currentTenant: tenant });
  },

  setTenants: (tenants: Tenant[]) => set({ tenants }),

  addTenant: (tenant: Tenant) =>
    set((state) => ({ tenants: [...state.tenants, tenant] })),

  removeTenant: (tenantId: string) =>
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== tenantId),
      currentTenant:
        state.currentTenant?.id === tenantId ? null : state.currentTenant,
    })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
