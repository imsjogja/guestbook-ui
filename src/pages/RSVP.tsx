import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Pencil,
  Bell,
  Eye,
  MessageCircle,
  Mail,
  Send,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRSVP } from '@/hooks';
import { useTenantStore } from '@/store/tenantStore';
import type { RSVPStatus } from '@/types';
import { buildRSVPExportCsv, downloadTextFile } from '@/lib/rsvp-csv';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Status Config ─────────────────────────────────── */

const statusConfig: Record<
  RSVPStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  attending: {
    label: 'Hadir',
    badgeClass: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/30',
    dotClass: 'bg-[#10b981]',
  },
  not_attending: {
    label: 'Tidak Hadir',
    badgeClass: 'bg-[#ffe4e6] text-[#9f1239] border-[#f43f5e]/30',
    dotClass: 'bg-[#f43f5e]',
  },
  maybe: {
    label: 'Tentatif',
    badgeClass: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30',
    dotClass: 'bg-[#f59e0b]',
  },
  no_response: {
    label: 'Belum',
    badgeClass: 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]',
    dotClass: 'bg-[#94a3b8]',
  },
};

const statusOptions: { value: RSVPStatus; label: string }[] = [
  { value: 'attending', label: 'Hadir' },
  { value: 'not_attending', label: 'Tidak Hadir' },
  { value: 'maybe', label: 'Tentatif' },
  { value: 'no_response', label: 'Belum Membalas' },
];

/* ── Chart Colors ──────────────────────────────────── */

const CHART_COLORS = {
  attending: '#10b981',
  not_attending: '#f43f5e',
  maybe: '#f59e0b',
  no_response: '#94a3b8',
};

/* ── Main Component ───────────────────────────────── */

export default function RSVPPage() {
  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const { rsvps, breakdown, isLoading, error, refetch, updateRSVP } = useRSVP(currentEventId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState('whatsapp');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* ── Filtering ──────────────────────────────────── */

  const filtered = useMemo(() => {
    return rsvps.filter((r) => {
      const matchesSearch =
        !search ||
        (r.guestName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        r.guestId.toLowerCase().includes(search.toLowerCase()) ||
        (r.message && r.message.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rsvps, search, statusFilter]);

  /* ── Stats ──────────────────────────────────────── */

  const stats = useMemo(() => {
    return {
      attending: breakdown.attending,
      notAttending: breakdown.notAttending,
      maybe: breakdown.maybe,
      noResponse: breakdown.noResponse,
      total: breakdown.total,
    };
  }, [breakdown]);

  /* ── Chart Data ─────────────────────────────────── */

  const chartData = useMemo(
    () => [
      { name: 'Hadir', value: stats.attending, color: CHART_COLORS.attending },
      { name: 'Tidak Hadir', value: stats.notAttending, color: CHART_COLORS.not_attending },
      { name: 'Tentatif', value: stats.maybe, color: CHART_COLORS.maybe },
      { name: 'Belum', value: stats.noResponse, color: CHART_COLORS.no_response },
    ],
    [stats]
  );

  /* ── Handlers ───────────────────────────────────── */

  const handleStatusChange = async (id: string, newStatus: RSVPStatus) => {
    await updateRSVP(id, {
      status: newStatus,
      respondedAt:
        newStatus === 'no_response'
          ? undefined
          : new Date().toISOString(),
    });
    setEditingId(null);
  };

  const sendReminder = async () => {
    setSendingReminder(true);
    try {
      toast.info('Pengiriman pengingat RSVP belum terhubung ke backend');
    } finally {
      setSendingReminder(false);
      setReminderModalOpen(false);
    }
  };

  const exportRsvpCsv = async () => {
    setExporting(true);
    try {
      const csv = buildRSVPExportCsv(filtered);
      downloadTextFile(`rsvp_export_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success(`Berhasil mengekspor ${filtered.length} data RSVP`);
    } catch {
      toast.error('Gagal mengekspor data RSVP');
    } finally {
      setExporting(false);
    }
  };

  /* ── Loading State ──────────────────────────────── */
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOutExpo }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader2 size={40} className="text-[#4f46e5] animate-spin mb-4" />
        <p className="text-sm text-[#64748b]">Memuat data RSVP...</p>
      </motion.div>
    );
  }

  /* ── Error State ────────────────────────────────── */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOutExpo }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 rounded-full bg-[#ffe4e6] flex items-center justify-center mb-4">
          <XCircle size={32} className="text-[#e11d48]" />
        </div>
        <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-2">Terjadi Kesalahan</h2>
        <p className="text-sm text-[#64748b] mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] transition-all"
        >
          <RefreshCw size={15} />
          Muat Ulang
        </button>
      </motion.div>
    );
  }

  /* ── Render ─────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc]">
            Manajemen RSVP
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Pantau dan kelola respons kehadiran tamu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setManualModalOpen(true)}>
            <Pencil size={16} />
            <span className="hidden sm:inline">Perbarui Manual</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setReminderModalOpen(true)}>
            <Bell size={16} />
            <span className="hidden sm:inline">Kirim Pengingat</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportRsvpCsv} disabled={exporting}>
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">Ekspor Data</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#eef2ff] flex items-center justify-center">
              <Users size={18} className="text-[#4f46e5]" />
            </div>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">
            Total RSVP
          </p>
          <p className="text-2xl font-bold text-[#1e293b] dark:text-[#f8fafc] font-mono mt-1">
            {stats.total}
          </p>
          <p className="text-xs text-[#64748b] mt-1">Dari {stats.total} tamu</p>
        </div>

        {/* Hadir */}
        <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#d1fae5] flex items-center justify-center">
              <CheckCircle size={18} className="text-[#10b981]" />
            </div>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">Hadir</p>
          <p className="text-2xl font-bold text-[#1e293b] dark:text-[#f8fafc] font-mono mt-1">
            {stats.attending}
          </p>
          <div className="mt-2">
            <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.attending / stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="h-full bg-[#10b981] rounded-full"
              />
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              {stats.total > 0 ? ((stats.attending / stats.total) * 100).toFixed(1) : 0}% konfirmasi
            </p>
          </div>
        </div>

        {/* Tidak Hadir */}
        <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#ffe4e6] flex items-center justify-center">
              <XCircle size={18} className="text-[#f43f5e]" />
            </div>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">
            Tidak Hadir
          </p>
          <p className="text-2xl font-bold text-[#1e293b] dark:text-[#f8fafc] font-mono mt-1">
            {stats.notAttending}
          </p>
          <p className="text-xs text-[#64748b] mt-1">
            {stats.total > 0 ? ((stats.notAttending / stats.total) * 100).toFixed(1) : 0}% menolak
          </p>
        </div>

        {/* Belum Respons */}
        <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#fef3c7] flex items-center justify-center">
              <HelpCircle size={18} className="text-[#f59e0b]" />
            </div>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">
            Belum Respons
          </p>
          <p className="text-2xl font-bold text-[#1e293b] dark:text-[#f8fafc] font-mono mt-1">
            {stats.noResponse}
          </p>
          <button
            onClick={() => {
              setStatusFilter('no_response');
            }}
            className="text-xs text-[#4f46e5] hover:underline mt-1"
          >
            Kirim Pengingat
          </button>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">
          Breakdown Status RSVP
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} tamu`, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1e293b] dark:text-[#f8fafc] font-mono">
                  {stats.total}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Total</p>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#64748b]">{item.value} tamu</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Cari tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[280px] h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="attending">Hadir</SelectItem>
            <SelectItem value="not_attending">Tidak Hadir</SelectItem>
            <SelectItem value="maybe">Tentatif</SelectItem>
            <SelectItem value="no_response">Belum Membalas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RSVP Table */}
      <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Tamu
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Pesan
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Waktu
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Via
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((r, idx) => {
                  const cfg = statusConfig[r.status];
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-[#f1f5f9] dark:border-[#334155] last:border-b-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1e293b] dark:text-[#f8fafc]">
                          {r.guestName || `Tamu ${r.guestId.slice(0, 8)}`}
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-0.5">{r.guestId}</div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === r.id ? (
                          <Select
                            defaultValue={r.status}
                            onValueChange={(val) => handleStatusChange(r.id, val as RSVPStatus)}
                            open
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                              cfg.badgeClass
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
                            {cfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#64748b]">
                          {r.guestCount > 0 ? `${r.guestCount} orang` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#64748b] text-xs max-w-[120px] truncate block">
                          {r.message || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.respondedAt ? (
                          <span className="font-mono text-xs text-[#64748b]">{new Date(r.respondedAt).toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
                            r.respondedVia === 'whatsapp'
                              ? 'bg-[#d1fae5] text-[#065f46]'
                              : r.respondedVia === 'email'
                                ? 'bg-[#dbeafe] text-[#1e3a5f]'
                                : 'bg-[#f1f5f9] text-[#64748b]'
                          )}
                        >
                          {r.respondedVia === 'whatsapp' ? (
                            <MessageCircle size={10} />
                          ) : r.respondedVia === 'email' ? (
                            <Mail size={10} />
                          ) : null}
                          {r.respondedVia === 'whatsapp'
                            ? 'WA'
                            : r.respondedVia === 'email'
                              ? 'Email'
                              : 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                            className={cn(
                              'p-1.5 rounded-md transition-colors',
                              editingId === r.id
                                ? 'bg-[#eef2ff] text-[#4f46e5]'
                                : 'text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:text-[#4f46e5]'
                            )}
                            title="Ubah Status"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:text-[#4f46e5] transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={15} />
                          </button>
                          {r.status === 'no_response' && (
                            <button
                              onClick={() => setReminderModalOpen(true)}
                              className="p-1.5 rounded-md text-[#64748b] hover:bg-[#fef3c7] hover:text-[#f59e0b] transition-colors"
                              title="Kirim Pengingat"
                            >
                              <Bell size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[#94a3b8] text-sm">Tidak ada data RSVP yang sesuai</p>
          </div>
        )}
      </div>

      {/* ── Send Reminder Modal ── */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Kirim Pengingat RSVP</DialogTitle>
            <DialogDescription className="text-sm text-[#64748b]">
              {stats.noResponse} tamu belum membalas undangan RSVP
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] mb-2 block">
                Channel Pengiriman
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
                  { value: 'email', label: 'Email', icon: <Mail size={16} /> },
                  { value: 'both', label: 'Keduanya', icon: <Send size={16} /> },
                ].map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => setReminderChannel(ch.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors flex-1 justify-center',
                      reminderChannel === ch.value
                        ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]'
                        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                    )}
                  >
                    {ch.icon}
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] mb-2 block">
                Template Pesan
              </label>
              <Select defaultValue="default">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Template Pengingat Default</SelectItem>
                  <SelectItem value="friendly">Template Santai</SelectItem>
                  <SelectItem value="formal">Template Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-[#fefce8] dark:bg-[#422006]/30 border border-[#f59e0b]/20 rounded-lg p-3">
              <p className="text-xs text-[#92400e] dark:text-[#fbbf24]">
                Pengingat akan dikirim ke {stats.noResponse}{' '}
                tamu yang belum membalas RSVP. Pastikan saldo WhatsApp/Email mencukupi.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setReminderModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={sendReminder} disabled={sendingReminder}>
              {sendingReminder ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Kirim Pengingat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manual Update Modal ── */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Perbarui RSVP Manual</DialogTitle>
            <DialogDescription className="text-sm text-[#64748b]">
              Pilih tamu dan perbarui status RSVP-nya secara manual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="max-h-[240px] overflow-y-auto border border-[#e2e8f0] dark:border-[#334155] rounded-lg">
              {rsvps.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f1f5f9] dark:border-[#334155] last:border-b-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] truncate">
                      {r.guestName || `Tamu ${r.guestId.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      Saat ini:{' '}
                      <span className={cn('font-medium', statusConfig[r.status].dotClass.replace('bg-', 'text-'))}>
                        {statusConfig[r.status].label}
                      </span>
                    </p>
                  </div>
                  <Select
                    defaultValue={r.status}
                    onValueChange={(val) => handleStatusChange(r.id, val as RSVPStatus)}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="bg-[#fefce8] dark:bg-[#422006]/30 border border-[#f59e0b]/20 rounded-lg p-3">
              <p className="text-xs text-[#92400e] dark:text-[#fbbf24]">
                Perubahan manual akan ditandai sebagai &quot;Input Manual&quot; dan menggantikan
                respons sebelumnya.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setManualModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
