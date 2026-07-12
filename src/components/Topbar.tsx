import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Building2,
  Check,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { cn } from '@/lib/utils';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  '/': { label: 'Dasbor' },
  '/acara': { label: 'Acara' },
  '/tamu': { label: 'Tamu' },
  '/tamu/:id': { label: 'Detail Tamu', parent: '/tamu' },
  '/kelompok-keluarga': { label: 'Kelompok Keluarga' },
  '/undangan': { label: 'Undangan' },
  '/rsvp': { label: 'RSVP' },
  '/check-in': { label: 'Check-in' },
  '/tempat-duduk': { label: 'Tempat Duduk' },
  '/komunikasi/template': { label: 'Template Komunikasi' },
  '/komunikasi/kampanye': { label: 'Kampanye Komunikasi' },
  '/komunikasi/pesan': { label: 'Riwayat Pesan' },
  '/tim': { label: 'Tim' },
  '/pengaturan': { label: 'Pengaturan' },
};

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path?: string }[] = [];
  const current = breadcrumbMap[pathname];
  if (!current) return [{ label: 'Dasbor', path: '/' }];

  if (current.parent) {
    const parent = breadcrumbMap[current.parent];
    if (parent) {
      crumbs.push({ label: parent.label, path: current.parent });
    }
  }
  crumbs.push({ label: current.label });
  return crumbs;
}

export default function Topbar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentTenant = useTenantStore((s) => s.currentTenant);

  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const tenantRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dasbor';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) setTenantOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#151c2c] border-b border-[#e2e8f0] dark:border-[#334155] flex items-center justify-between px-6">
      {/* Left: Title + Breadcrumb */}
      <div className="flex flex-col justify-center ml-10 lg:ml-0">
        <nav className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mb-0.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-[#64748b] transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="text-[15px] font-semibold text-[#1e293b] dark:text-[#f8fafc] leading-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        {/* Tenant Switcher */}
        <div ref={tenantRef} className="relative">
          <button
            onClick={() => setTenantOpen(!tenantOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
          >
            <Building2 size={16} className="text-[#64748b]" />
            <span className="text-sm text-[#1e293b] dark:text-[#f8fafc] max-w-[120px] truncate hidden sm:inline">
              {currentTenant?.name ?? 'Default Tenant'}
            </span>
            <ChevronDown size={14} className="text-[#94a3b8]" />
          </button>

          <AnimatePresence>
            {tenantOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: easeOutExpo }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-modal z-50 py-2"
              >
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  Tenant
                </p>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                  onClick={() => setTenantOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)] flex items-center justify-center">
                    <Building2 size={14} className="text-[#4f46e5]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">
                      {currentTenant?.name ?? 'Default Tenant'}
                    </p>
                    <p className="text-[11px] text-[#94a3b8]">
                      {currentTenant?.subdomain ?? 'default'}.guestflow.id
                    </p>
                  </div>
                  <Check size={14} className="text-[#4f46e5]" />
                </button>
                <div className="mt-1 pt-1 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                    onClick={() => setTenantOpen(false)}
                  >
                    + Tambah Tenant Baru
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
          >
            <Bell size={18} className="text-[#64748b]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f43f5e] rounded-full" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: easeOutExpo }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-modal z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] dark:border-[#334155]">
                  <p className="text-sm font-semibold text-[#1e293b] dark:text-[#f8fafc]">Notifikasi</p>
                  <button className="text-xs text-[#4f46e5] hover:underline">Tandai semua dibaca</button>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {[
                    { icon: <User size={14} />, text: 'Diana Wijaya baru saja RSVP Hadir', time: '2 menit lalu', color: 'text-[#10b981] bg-[#d1fae5]' },
                    { icon: <Bell size={14} />, text: 'Pengingat acara "Wedding Expo 2025" dalam 3 hari', time: '1 jam lalu', color: 'text-[#f59e0b] bg-[#fef3c7]' },
                    { icon: <Check size={14} />, text: 'Batch undangan berhasil dikirim (248 penerima)', time: '3 jam lalu', color: 'text-[#4f46e5] bg-[#eef2ff]' },
                  ].map((n, i) => (
                    <button key={i} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors text-left">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', n.color)}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1e293b] dark:text-[#f8fafc] leading-snug">{n.text}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <Link
                    to="#"
                    className="block text-center text-xs text-[#4f46e5] hover:underline py-1"
                    onClick={() => setNotifOpen(false)}
                  >
                    Lihat Semua Notifikasi
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] rounded-lg p-1 pr-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)] flex items-center justify-center text-[#4f46e5] font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <ChevronDown size={14} className="text-[#94a3b8] hidden sm:block" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: easeOutExpo }}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-modal z-50 py-2"
              >
                <div className="px-3 py-2 border-b border-[#e2e8f0] dark:border-[#334155]">
                  <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">
                    {user?.fullName ?? 'Admin User'}
                  </p>
                  <p className="text-[11px] text-[#94a3b8]">{user?.email ?? 'admin@guestflow.id'}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/pengaturan"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                    onClick={() => setUserOpen(false)}
                  >
                    <User size={16} />
                    Profil
                  </Link>
                  <Link
                    to="/pengaturan"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                    onClick={() => setUserOpen(false)}
                  >
                    <Settings size={16} />
                    Pengaturan
                  </Link>
                  <button
                    onClick={toggleDark}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                  >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    {darkMode ? 'Mode Terang' : 'Mode Gelap'}
                  </button>
                </div>

                <div className="pt-1 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    onClick={() => {
                      setUserOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#f43f5e] hover:bg-[#fff1f2] dark:hover:bg-[rgba(244,63,94,0.1)] transition-colors"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
