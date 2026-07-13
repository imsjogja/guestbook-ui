import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import Layout from './Layout';
import WorkspaceOnboarding from './WorkspaceOnboarding';
import { bootstrapWorkspace } from '@/lib/workspace';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';

function FullScreenLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19]">
      <div className="flex items-center gap-3 text-[#64748b]">
        <Loader2 size={18} className="animate-spin text-[#4f46e5]" />
        <span className="text-sm font-medium">Menyiapkan workspace...</span>
      </div>
    </div>
  );
}

export default function AuthenticatedLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrappedTenantId, setBootstrappedTenantId] = useState<string | null | undefined>(undefined);
  const bootstrapInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!accessToken || !user) {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
        return;
      }

      if (bootstrapInFlight.current) {
        return;
      }

      const currentTenantId = currentTenant?.id ?? null;

      if (bootstrappedTenantId !== undefined && bootstrappedTenantId === currentTenantId) {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        bootstrapInFlight.current = true;
        setBootstrapError(null);
        const result = await bootstrapWorkspace({ requireTenant: false, requireEvent: false });
        if (!cancelled) {
          setBootstrappedTenantId(result.tenant?.id ?? null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal menyiapkan workspace';
        if (!cancelled) {
          setBootstrapError(message);
        }
      } finally {
        bootstrapInFlight.current = false;
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, user, currentTenant, bootstrappedTenantId]);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (bootstrapError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#151c2c] shadow-[0_20px_80px_rgba(15,23,42,0.12)] p-6">
          <p className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">
            Workspace belum siap
          </p>
          <p className="mt-2 text-sm text-[#64748b]">
            {bootstrapError}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white hover:bg-[#6366f1]"
          >
            <LogOut size={16} />
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return <WorkspaceOnboarding />;
  }

  return <Layout />;
}
