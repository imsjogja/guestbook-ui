import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  HelpCircle,
  ScanLine,
  Plus,
  UserPlus,
  ChevronRight,
  Clock,
  UserPlus as UserPlusIcon,
  Send,
  Bell,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useGuests } from '@/hooks/useGuests';
import { useRSVP } from '@/hooks/useRSVP';
import { useCheckin } from '@/hooks/useCheckin';
import { useEvents } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Skeleton Loader ───────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#e2e8f0] dark:bg-[#334155]" />
      </div>
      <div className="h-3 w-20 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-3" />
      <div className="h-8 w-24 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-2" />
      <div className="h-3 w-32 bg-[#e2e8f0] dark:bg-[#334155] rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6 animate-pulse">
      <div className="h-5 w-40 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-2" />
      <div className="h-3 w-32 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-6" />
      <div className="h-64 bg-[#e2e8f0] dark:bg-[#334155] rounded-lg" />
    </div>
  );
}

// ── Components ────────────────────────────────────────

function useCountUp(target: number, duration = 800, delay = 0) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime.current) startTime.current = timestamp;
        const progress = Math.min((timestamp - startTime.current) / duration, 1);
        // easeOutQuad
        const eased = 1 - (1 - progress) * (1 - progress);
        setCount(Math.floor(eased * target));
        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        }
      };
      rafId.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, delay]);

  return count;
}

function formatCount(n: number | null | undefined) {
  const safe = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return safe.toLocaleString('id-ID');
}

function getRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function getActivityMeta(type: Activity['type']) {
  switch (type) {
    case 'tamu_ditambahkan':
      return { icon: <UserPlusIcon size={16} />, bg: 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)]', iconColor: 'text-[#4f46e5]' };
    case 'rsvp_diterima':
      return { icon: <CheckCircle size={16} />, bg: 'bg-[#d1fae5]', iconColor: 'text-[#10b981]' };
    case 'undangan_dikirim':
      return { icon: <Send size={16} />, bg: 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)]', iconColor: 'text-[#4f46e5]' };
    case 'checkin':
      return { icon: <ScanLine size={16} />, bg: 'bg-[#d1fae5]', iconColor: 'text-[#10b981]' };
    case 'reminder_dikirim':
      return { icon: <Bell size={16} />, bg: 'bg-[#fef3c7]', iconColor: 'text-[#f59e0b]' };
    default:
      return { icon: <Clock size={16} />, bg: 'bg-[#f1f5f9]', iconColor: 'text-[#64748b]' };
  }
}

function getEventStatusBadge(status: string) {
  switch (status) {
    case 'published':
    case 'active':
      return { label: 'Dipublikasikan', className: 'bg-[#d1fae5] text-[#10b981] border-[#a7f3d0]' };
    case 'draft':
      return { label: 'Draft', className: 'bg-[#fef3c7] text-[#f59e0b] border-[#fde68a]' };
    case 'ongoing':
    case 'paused':
      return { label: 'Sedang Berlangsung', className: 'bg-[#fef3c7] text-[#b45309] border-[#fcd34d]' };
    case 'archived':
      return { label: 'Diarsipkan', className: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]' };
    default:
      return { label: status, className: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]' };
  }
}

// ── Stat Card ─────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  change: string;
  changeColor: string;
  delay: number;
  progressBar?: { percent: number; color: string };
  live?: boolean;
}

function StatCard({ icon, iconBg, iconColor, label, value, change, changeColor, delay, progressBar, live }: StatCardProps) {
  const count = useCountUp(value, 800, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOutExpo, delay: delay / 1000 }}
      className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5 hover:shadow-card-hover transition-shadow duration-150"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        {live && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse-dot" />
            <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-[#64748b] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc] font-mono mb-2">
        {formatCount(count)}
      </p>

      <div className="flex items-center gap-1">
        {change && (
          <span className={cn('text-xs font-medium', changeColor)}>
            {change}
          </span>
        )}
      </div>

      {progressBar && (
        <div className="mt-3 h-1 bg-[#e2e8f0] dark:bg-[#334155] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressBar.percent}%` }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: delay / 1000 + 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: progressBar.color }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ── Custom Tooltip for Charts ─────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#151c2c] rounded-lg border border-[#e2e8f0] dark:border-[#334155] shadow-md px-3 py-2">
      <p className="text-xs text-[#64748b] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">
        {payload[0].value} Check-in
      </p>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const [attendanceTab, setAttendanceTab] = useState<'7' | '30' | '90'>('30');

  const { guests: guestsData, isLoading: guestsLoading, error: guestsError } = useGuests(currentEventId);
  const { rsvps, breakdown, isLoading: rsvpLoading, error: rsvpError } = useRSVP(currentEventId);
  const { checkins, stats, isLoading: checkinLoading, error: checkinError } = useCheckin();
  const { events: eventsData, isLoading: eventsLoading, error: eventsError } = useEvents();

  const isLoading = guestsLoading || rsvpLoading || checkinLoading || eventsLoading;

  // Build RSVP chart data from real breakdown
  const rsvpData = [
    { name: 'Hadir', value: breakdown.attending, color: '#4f46e5' },
    { name: 'Tidak Hadir', value: breakdown.notAttending, color: '#f43f5e' },
    { name: 'Mungkin', value: breakdown.maybe, color: '#f59e0b' },
    { name: 'Belum Membalas', value: breakdown.noResponse, color: '#cbd5e1' },
  ];

  // Build attendance data from checkins grouped by date
  const checkinsByDate = checkins.reduce((acc, c) => {
    const date = new Date(c.checkedInAt);
    const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendanceDataAll = Object.entries(checkinsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((_a, _b) => {
      // Simple sort by parsing the dates
      const now = new Date();
      return now.getTime() - now.getTime(); // keep original order from API
    });

  // Fallback demo data if no checkins yet, otherwise use real data
  const attendanceDataReal = attendanceDataAll.length > 0
    ? attendanceDataAll
    : [
        { date: '10 Jan', count: 0 },
        { date: '11 Jan', count: 0 },
        { date: '12 Jan', count: 0 },
        { date: '13 Jan', count: 0 },
        { date: '14 Jan', count: 0 },
        { date: '15 Jan', count: 0 },
        { date: '16 Jan', count: 0 },
      ];

  const attendanceMap = {
    '7': attendanceDataReal.slice(-7),
    '30': attendanceDataReal.slice(-15),
    '90': attendanceDataReal.slice(-30),
  };

  // Use real RSVP data for the donut
  const totalRsvp = breakdown.total || rsvps.length || 0;

  // Real stats from hooks
  const totalGuests = guestsData.length;
  const rsvpAttending = breakdown.attending;
  const rsvpNotYet = breakdown.noResponse + breakdown.maybe;
  const checkinToday = stats.totalToday;

  // Build recent activity from checkins + rsvps
  const activities: Activity[] = [
    ...checkins.slice(0, 4).map((c, i) => ({
      id: `ci-${i}`,
      tenantId: '1',
      type: 'checkin' as const,
      description: `Check-in oleh tamu`,
      createdAt: c.checkedInAt,
      userName: 'Admin',
    })),
    ...rsvps.slice(0, 4).map((r, i) => ({
      id: `rs-${i}`,
      tenantId: '1',
      type: 'rsvp_diterima' as const,
      description: `RSVP ${r.status === 'attending' ? 'Hadir' : r.status === 'not_attending' ? 'Tidak Hadir' : 'Mungkin'} diterima`,
      createdAt: r.respondedAt ?? r.createdAt,
      userName: 'Admin',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  // Upcoming events from real data
  const upcomingEvents = eventsData
    .filter((e) => e.status === 'published' || e.status === 'draft' || e.status === 'ongoing')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.startDate,
      location: e.location,
      status: e.status,
    }));

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc]">
            Dasbor
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            Selamat datang kembali, {user?.fullName ?? 'Admin'}
          </p>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/acara')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] dark:bg-[#1e293b] dark:hover:bg-[#334155] text-[#1e293b] dark:text-[#f8fafc] text-sm font-medium rounded-lg border border-[#e2e8f0] dark:border-[#334155] transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Buat Acara Baru</span>
          </button>
          <button
            onClick={() => navigate('/tamu')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] dark:bg-[#1e293b] dark:hover:bg-[#334155] text-[#1e293b] dark:text-[#f8fafc] text-sm font-medium rounded-lg border border-[#e2e8f0] dark:border-[#334155] transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Tambah Tamu</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {(guestsError || rsvpError || checkinError || eventsError) && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-lg bg-[#fff1f2] dark:bg-[rgba(244,63,94,0.1)] border border-[#f43f5e]/20 text-sm text-[#f43f5e]"
        >
          {guestsError || rsvpError || checkinError || eventsError || "Gagal memuat data. Silakan muat ulang halaman."}
        </motion.div>
      )}

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users size={20} />}
            iconBg="bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)]"
            iconColor="text-[#4f46e5]"
            label="Total Tamu"
            value={totalGuests}
            change="+12% dari bulan lalu"
            changeColor="text-[#10b981]"
            delay={0}
            progressBar={{ percent: Math.min(100, totalGuests > 0 ? 78 : 0), color: '#4f46e5' }}
          />
          <StatCard
            icon={<CheckCircle size={20} />}
            iconBg="bg-[#d1fae5]"
            iconColor="text-[#10b981]"
            label="RSVP Hadir"
            value={rsvpAttending}
            change={`${totalGuests > 0 ? Math.round((rsvpAttending / totalGuests) * 100) : 0}% tingkat konfirmasi`}
            changeColor="text-[#10b981]"
            delay={100}
          />
          <StatCard
            icon={<HelpCircle size={20} />}
            iconBg="bg-[#fef3c7]"
            iconColor="text-[#f59e0b]"
            label="Belum RSVP"
            value={rsvpNotYet}
            change={`${totalGuests > 0 ? ((rsvpNotYet / totalGuests) * 100).toFixed(1) : 0}% perlu tindak lanjut`}
            changeColor="text-[#f59e0b]"
            delay={200}
          />
          <StatCard
            icon={<ScanLine size={20} />}
            iconBg="bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)]"
            iconColor="text-[#4f46e5]"
            label="Check-in Hari Ini"
            value={checkinToday}
            change={`Dari ${totalGuests} tamu yang hadir`}
            changeColor="text-[#64748b]"
            delay={300}
            live
          />
        </div>
      )}

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-2"><SkeletonChart /></div>
          <div className="lg:col-span-3"><SkeletonChart /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* RSVP Donut */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6"
          >
            <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-0.5">
              Distribusi RSVP
            </h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Berdasarkan respons terbaru
            </p>

            <div className="flex items-center gap-4">
              <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rsvpData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {rsvpData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatCount(typeof value === 'number' ? value : Number(value ?? 0))} tamu`, '']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="relative -mt-[110px] sm:-mt-[130px] flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc] font-mono">
                    {formatCount(totalRsvp)}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">Total Tamu</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {rsvpData.map((item) => {
                  const pct = totalRsvp > 0 ? ((item.value / totalRsvp) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#64748b] truncate">{item.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                          {formatCount(item.value)}
                        </p>
                        <p className="text-[10px] text-[#94a3b8]">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Attendance Trend */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.3 }}
            className="lg:col-span-3 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc]">
                Tren Kehadiran
              </h3>
              <div className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-lg p-0.5">
                {(['7', '30', '90'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAttendanceTab(tab)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-all duration-150',
                      attendanceTab === tab
                        ? 'bg-[#4f46e5] text-white shadow-sm'
                        : 'text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc]'
                    )}
                  >
                    {tab} Hari
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] mb-4">
              {attendanceTab === '7' ? '7 hari terakhir' : attendanceTab === '30' ? '30 hari terakhir' : '90 hari terakhir'}
            </p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceMap[attendanceTab]} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Activity + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOutExpo, delay: 0.35 }}
          className="lg:col-span-2 bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              Aktivitas Terbaru
            </h3>
            <button className="text-xs text-[#4f46e5] hover:underline font-medium">
              Lihat Semua
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-[#e2e8f0] dark:bg-[#334155] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-48 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-1" />
                  </div>
                  <div className="h-3 w-16 bg-[#e2e8f0] dark:bg-[#334155] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
              {activities.map((activity, i) => {
                const meta = getActivityMeta(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: easeOutExpo, delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', meta.bg)}>
                      <span className={meta.iconColor}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0f172a] dark:text-[#f8fafc] truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#94a3b8] flex-shrink-0">
                      {getRelativeTime(activity.createdAt)}
                    </span>
                  </motion.div>
                );
              })}
              {activities.length === 0 && (
                <div className="py-8 text-center">
                  <Clock size={32} className="mx-auto text-[#e2e8f0] mb-2" />
                  <p className="text-sm text-[#64748b]">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOutExpo, delay: 0.4 }}
          className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              Acara Mendatang
            </h3>
            <button
              onClick={() => navigate('/acara')}
              className="text-xs text-[#64748b] hover:text-[#1e293b] dark:hover:text-[#f8fafc] font-medium px-2 py-1 rounded hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
            >
              + Buat
            </button>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-[#e2e8f0] dark:bg-[#334155] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-32 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-1" />
                    <div className="h-3 w-20 bg-[#e2e8f0] dark:bg-[#334155] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {upcomingEvents.map((event, i) => {
                  const date = new Date(event.date);
                  const day = date.getDate();
                  const month = date.toLocaleString('id-ID', { month: 'short' });
                  const badge = getEventStatusBadge(event.status);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: easeOutExpo, delay: 0.45 + i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-[#4f46e5] leading-tight">{day}</span>
                        <span className="text-[9px] text-[#64748b] uppercase">{month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] truncate">
                          {event.name}
                        </p>
                        <p className="text-[11px] text-[#94a3b8]">
                          {event.location || '-'}
                        </p>
                      </div>
                      <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full border flex-shrink-0', badge.className)}>
                        {badge.label}
                      </span>
                    </motion.div>
                  );
                })}
                {upcomingEvents.length === 0 && (
                  <div className="py-8 text-center">
                    <Clock size={32} className="mx-auto text-[#e2e8f0] mb-2" />
                    <p className="text-sm text-[#64748b]">Belum ada acara mendatang</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/acara')}
                className="w-full mt-4 flex items-center justify-center gap-1 text-xs text-[#4f46e5] hover:underline font-medium py-2 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
              >
                Lihat Semua Acara
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
