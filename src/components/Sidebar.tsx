import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCircle,
  Mail,
  ClipboardCheck,
  ScanLine,
  Armchair,
  FileText,
  Megaphone,
  MessageSquare,
  Users2,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventAccess } from '@/hooks/useEventAccess';
import { useTenantStore } from '@/store/tenantStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { label: 'Dasbor', path: '/', icon: <LayoutDashboard size={20} />, permission: 'report:read' },
      { label: 'Acara', path: '/acara', icon: <CalendarDays size={20} />, permission: 'event:read' },
      { label: 'Tamu', path: '/tamu', icon: <Users size={20} />, permission: 'guest:read' },
      { label: 'Gift & Angpau', path: '/gift', icon: <Gift size={20} />, permission: 'gift:read' },
      { label: 'Kelompok Keluarga', path: '/kelompok-keluarga', icon: <UserCircle size={20} />, permission: 'guest:read' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { label: 'Undangan', path: '/undangan', icon: <Mail size={20} />, permission: 'invitation:read' },
      { label: 'RSVP', path: '/rsvp', icon: <ClipboardCheck size={20} />, permission: 'rsvp:read' },
      { label: 'Check-in', path: '/check-in', icon: <ScanLine size={20} />, permission: 'checkin:read' },
      { label: 'Tempat Duduk', path: '/tempat-duduk', icon: <Armchair size={20} />, permission: 'seating:read' },
    ],
  },
  {
    label: 'Komunikasi',
    items: [
      { label: 'Template', path: '/komunikasi/template', icon: <FileText size={20} />, permission: 'communication:read' },
      { label: 'Kampanye', path: '/komunikasi/kampanye', icon: <Megaphone size={20} />, permission: 'communication:read' },
      { label: 'Riwayat Pesan', path: '/komunikasi/pesan', icon: <MessageSquare size={20} />, permission: 'communication:read' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Tim', path: '/tim', icon: <Users2 size={20} />, permission: 'team:read' },
      { label: 'Tim Acara', path: '/tim-acara', icon: <ShieldCheck size={20} />, permission: 'event_team:read' },
      { label: 'Pengaturan', path: '/pengaturan', icon: <Settings size={20} />, permission: 'settings:read' },
      { label: 'Paket & Tagihan', path: '/plan', icon: <CreditCard size={20} /> },
    ],
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Sidebar() {
  const location = useLocation();
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const { access, isLoading: isAccessLoading } = useEventAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse on tablet
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setCollapsed(false);
        setMobileOpen(false);
      } else if (w < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canSee = (item: NavItem) => {
    if (!item.permission || !currentEvent || isAccessLoading || !access) return true;
    return access.permissions.includes(item.permission);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-[#151c2c] shadow-md border border-[#e2e8f0] dark:border-[#334155] lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-[#151c2c] border-r border-[#e2e8f0] dark:border-[#334155] z-40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'hidden lg:flex flex-col'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#e2e8f0] dark:border-[#334155]">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: easeOutExpo }}
                className="font-semibold text-lg text-[#0f172a] dark:text-[#f8fafc] whitespace-nowrap"
              >
                GuestFlow
              </motion.span>
            )}
          </Link>

          {/* Collapse toggle - desktop only, not on tablet */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hidden xl:block"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.label} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center h-10 rounded-lg transition-colors duration-150 relative',
                          collapsed ? 'justify-center px-0' : 'px-3 gap-3',
                          active
                            ? 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] text-[#4f46e5]'
                            : 'text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:text-[#1e293b] dark:hover:text-[#f8fafc]'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        {active && !collapsed && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 my-auto w-[2px] h-5 bg-[#4f46e5] rounded-r-full"
                            transition={{ duration: 0.2, ease: easeOutExpo }}
                          />
                        )}
                        {active && collapsed && (
                          <motion.div
                            layoutId="activeIndicatorCollapsed"
                            className="absolute left-0 top-0 bottom-0 my-auto w-[2px] h-5 bg-[#4f46e5] rounded-r-full"
                            transition={{ duration: 0.2, ease: easeOutExpo }}
                          />
                        )}
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!collapsed && (
                          <span className="text-sm font-medium whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#151c2c] border-r border-[#e2e8f0] dark:border-[#334155] z-50 flex flex-col lg:hidden"
          >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-[#e2e8f0] dark:border-[#334155]">
              <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-semibold text-lg text-[#0f172a] dark:text-[#f8fafc]">
                  GuestFlow
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto p-1 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter(canSee);
                if (visibleItems.length === 0) return null;
                return (
                <div key={group.label} className="mb-5 last:mb-0">
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'flex items-center h-10 px-3 gap-3 rounded-lg transition-colors duration-150 relative',
                              active
                                ? 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] text-[#4f46e5]'
                                : 'text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:text-[#1e293b] dark:hover:text-[#f8fafc]'
                            )}
                          >
                            {active && (
                              <motion.div
                                layoutId="activeIndicatorMobile"
                                className="absolute left-0 top-0 bottom-0 my-auto w-[2px] h-5 bg-[#4f46e5] rounded-r-full"
                                transition={{ duration: 0.2, ease: easeOutExpo }}
                              />
                            )}
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
