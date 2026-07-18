import { CalendarDays, ChevronRight } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useTenantStore } from '@/store/tenantStore';

export default function EventRequired() {
  const currentEvent = useTenantStore((state) => state.currentEvent);

  if (currentEvent) return <Outlet />;

  return (
    <div className="flex min-h-[520px] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-[#c7d2fe] bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_70%)] p-8 text-center shadow-[0_18px_60px_rgba(79,70,229,0.08)] dark:border-[#4338ca] dark:bg-[linear-gradient(135deg,rgba(79,70,229,0.16),#151c2c_70%)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#4f46e5] shadow-sm dark:bg-[#0f172a]">
          <CalendarDays size={26} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#4f46e5]">Konteks kerja belum dipilih</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Pilih acara untuk melihat data</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#64748b]">
          Data tamu, undangan, RSVP, check-in, dan tempat duduk selalu terikat pada satu acara. Pilih acara aktif melalui selector di bagian atas sebelum melanjutkan.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/acara" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca]">
            Buka daftar acara
            <ChevronRight size={16} />
          </Link>
          <span className="text-xs text-[#94a3b8]">atau gunakan selector di Topbar</span>
        </div>
      </div>
    </div>
  );
}
