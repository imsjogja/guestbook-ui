import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  MoreVertical,
  Download,
  X,
  CalendarDays,
  MapPin,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/useEvents';
import type { Event } from '@/types';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Status Config ─── */
const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  draft: { label: 'Draft', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]', dot: '#94a3b8' },
  active: { label: 'Aktif', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]', dot: '#10b981' },
  archived: { label: 'Diarsipkan', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]', dot: '#94a3b8' },
  paused: { label: 'Dijeda', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', border: 'border-[#fcd34d]', dot: '#f59e0b' },
  completed: { label: 'Selesai', bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', border: 'border-[#93c5fd]', dot: '#3b82f6' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]', dot: '#f43f5e' },
};

const typeLabels: Record<string, string> = {
  wedding: 'Pernikahan',
  corporate: 'Korporat',
  birthday: 'Ulang Tahun',
  government: 'Pemerintahan',
  other: 'Lainnya',
};

/* ─── Skeleton Row ─── */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#f1f5f9] dark:border-[#334155] animate-pulse">
      <td className="px-4 py-3"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-[#e2e8f0] dark:bg-[#334155]" /><div className="flex-1"><div className="h-3 w-32 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-1" /><div className="h-2 w-20 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></div></div></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-12 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-14 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-8 bg-[#e2e8f0] dark:bg-[#334155] rounded ml-auto" /></td>
    </tr>
  );
}

/* ─── Component ─── */
export default function Acara() {
  const navigate = useNavigate();
  const { events, isLoading, error, createEvent, updateEvent, deleteEvent } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  /* Modals */
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Form state */
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Event['eventType']>('wedding');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formStatus, setFormStatus] = useState<string>('draft');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  /* ─── Filtered events ─── */
  const filtered = useMemo(() => {
    let data = [...events];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((e) => e.name.toLowerCase().includes(q) || (e.location ?? '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      data = data.filter((e) => e.status === statusFilter);
    }
    if (sortBy === 'newest') data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    if (sortBy === 'oldest') data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    if (sortBy === 'name') data.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'capacity') data.sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
    return data;
  }, [events, searchQuery, statusFilter, sortBy]);

  /* ─── Handlers ─── */
  const openCreate = () => {
    setFormName('');
    setFormType('wedding');
    setFormDate('');
    setFormLocation('');
    setFormCapacity('');
    setFormStatus('draft');
    setShowCreate(true);
  };

  const openEdit = (evt: Event) => {
    setEditingEvent(evt);
    setFormName(evt.name);
    setFormType(evt.eventType);
    setFormDate(evt.startDate ? format(new Date(evt.startDate), 'yyyy-MM-dd') : '');
    setFormLocation(evt.location);
    setFormCapacity(String(evt.capacity ?? ''));
    setFormStatus(evt.status);
    setShowEdit(true);
    setDropdownOpen(null);
  };

  const openDelete = (evt: Event) => {
    setDeletingEvent(evt);
    setShowDelete(true);
    setDropdownOpen(null);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setErrorToast(null);
    try {
      await createEvent({
        name: formName,
        eventType: formType,
        startDate: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
        location: formLocation,
        capacity: Number(formCapacity) || 0,
        status: formStatus as Event['status'],
      });
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat acara';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingEvent) return;
    setSubmitting(true);
    setErrorToast(null);
    try {
      await updateEvent(editingEvent.id, {
        name: formName,
        eventType: formType,
        startDate: formDate ? new Date(formDate).toISOString() : editingEvent.startDate,
        location: formLocation,
        capacity: Number(formCapacity) || 0,
        status: formStatus as Event['status'],
      });
      setShowEdit(false);
      setEditingEvent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui acara';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setSubmitting(true);
    setErrorToast(null);
    try {
      await deleteEvent(deletingEvent.id);
      setShowDelete(false);
      setDeletingEvent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus acara';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (evt: Event) => {
    setErrorToast(null);
    try {
      await createEvent({
        name: `${evt.name} (Copy)`,
        eventType: evt.eventType,
        startDate: evt.startDate,
        location: evt.location,
        capacity: evt.capacity,
        status: 'draft',
      });
      setDropdownOpen(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menduplikat acara';
      setErrorToast(msg);
    }
  };

  /* ─── Shared modal form ─── */
  const FormFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">Nama Acara <span className="text-[#f43f5e]">*</span></label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Nama acara..."
          className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Tipe Acara <span className="text-[#f43f5e]">*</span></label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as Event['eventType'])}
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
          >
            <option value="wedding">Pernikahan</option>
            <option value="corporate">Korporat</option>
            <option value="birthday">Ulang Tahun</option>
            <option value="government">Pemerintahan</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Tanggal <span className="text-[#f43f5e]">*</span></label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">Lokasi <span className="text-[#f43f5e]">*</span></label>
        <input
          type="text"
          value={formLocation}
          onChange={(e) => setFormLocation(e.target.value)}
          placeholder="Nama lokasi..."
          className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Kapasitas</label>
          <input
            type="number"
            value={formCapacity}
            onChange={(e) => setFormCapacity(e.target.value)}
            placeholder="Jumlah tamu..."
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Status</label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
          >
            <option value="draft">Draft</option>
            <option value="active">Aktif</option>
            <option value="paused">Dijeda</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </div>
      </div>
    </div>
  );

  /* ─── Render ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
      className="space-y-6"
    >
      {/* Error Toast */}
      <AnimatePresence>
        {(errorToast || error) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 py-3 rounded-lg bg-[#fff1f2] dark:bg-[rgba(244,63,94,0.1)] border border-[#f43f5e]/20 text-sm text-[#f43f5e] flex items-center justify-between"
          >
            <span>{errorToast || error}</span>
            <button onClick={() => setErrorToast(null)} className="text-[#f43f5e] hover:text-[#e11d48]">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Daftar Acara</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Kelola semua acara dan detailnya</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all"
          >
            <Plus size={18} />
            Buat Acara
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
            <Download size={16} />
            Ekspor
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama acara..."
            className="w-[280px] h-10 pl-9 pr-4 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] appearance-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="active">Aktif</option>
            <option value="paused">Dijeda</option>
            <option value="completed">Selesai</option>
            <option value="archived">Diarsipkan</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] appearance-none cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama A-Z</option>
            <option value="capacity">Kapasitas</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>
        <div className="ml-auto text-xs text-[#64748b]">
          {filtered.length} acara
        </div>
      </div>

      {/* ── Events Table ── */}
      <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Nama Acara</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tipe</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tanggal</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Lokasi</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Kapasitas</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tamu</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                <>
                  <AnimatePresence>
                    {filtered.map((evt, i) => {
                      const s = statusConfig[evt.status] || statusConfig.draft;
                      const rsvpPct = (evt.capacity ?? 0) > 0 ? Math.round((0 / (evt.capacity ?? 1)) * 100) : 0;
                      const eventTime = evt.startDate
                        ? format(new Date(evt.startDate), 'HH:mm', { locale: id }) + ' WIB'
                        : '-';
                      return (
                        <motion.tr
                          key={evt.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.15, delay: i * 0.03, ease: easeOutExpo }}
                          className="border-b border-[#f1f5f9] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CalendarDays size={14} className="text-[#4f46e5]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">{evt.name}</p>
                                <p className="text-xs text-[#94a3b8] mt-0.5">{eventTime}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#64748b]">{typeLabels[evt.eventType] || evt.eventType}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#0f172a] dark:text-[#f8fafc]">
                              {evt.startDate ? format(new Date(evt.startDate), 'd MMM yyyy', { locale: id }) : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                              <MapPin size={13} className="flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{evt.location || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#0f172a] dark:text-[#f8fafc]">{(evt.capacity ?? 0).toLocaleString('id-ID')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', s.bg, s.text, s.border)}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                                <Users size={13} />
                                <button
                                  onClick={() => navigate(`/tamu?event=${evt.id}`)}
                                  className="hover:text-[#4f46e5] hover:underline transition-colors"
                                >
                                  0
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#4f46e5] rounded-full"
                                    style={{ width: `${Math.min(rsvpPct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-[#94a3b8]">{rsvpPct}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(evt)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors"
                                title="Ubah"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => navigate(`/tamu?event=${evt.id}`)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors"
                                title="Lihat Tamu"
                              >
                                <Users size={15} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setDropdownOpen(dropdownOpen === evt.id ? null : evt.id)}
                                  className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors"
                                  title="Lainnya"
                                >
                                  <MoreVertical size={15} />
                                </button>
                                <AnimatePresence>
                                  {dropdownOpen === evt.id && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.15, ease: easeOutExpo }}
                                        className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-lg shadow-lg z-20 py-1"
                                      >
                                        <button
                                          onClick={() => { setDropdownOpen(null); }}
                                          className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                                        >
                                          Lihat Detail
                                        </button>
                                        <button
                                          onClick={() => handleDuplicate(evt)}
                                          className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                                        >
                                          Duplikat
                                        </button>
                                        <div className="border-t border-[#e2e8f0] dark:border-[#334155] my-1" />
                                        <button
                                          onClick={() => openDelete(evt)}
                                          className="w-full text-left px-3 py-2 text-sm text-[#f43f5e] hover:bg-[#ffe4e6]/50 transition-colors"
                                        >
                                          Hapus
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <CalendarDays size={40} className="mx-auto text-[#e2e8f0] mb-3" />
                        <p className="text-sm text-[#64748b]">Tidak ada acara yang cocok</p>
                        <p className="text-xs text-[#94a3b8] mt-1">Coba ubah filter atau kata kunci pencarian</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm"
              onClick={() => !submitting && setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[600px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Buat Acara Baru</h2>
                <button onClick={() => !submitting && setShowCreate(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                {FormFields}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formName || !formDate || !formLocation || submitting}
                  className={cn(
                    'h-10 px-6 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    !formName || !formDate || !formLocation || submitting
                      ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                      : 'bg-[#4f46e5] text-white hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96]'
                  )}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm"
              onClick={() => !submitting && setShowEdit(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[600px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Ubah Acara</h2>
                <button onClick={() => !submitting && setShowEdit(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                {FormFields}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button
                  onClick={() => setShowEdit(false)}
                  disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleEdit}
                  disabled={submitting}
                  className="h-10 px-6 rounded-lg text-sm font-medium bg-[#4f46e5] text-white hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>
        {showDelete && deletingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm"
              onClick={() => !submitting && setShowDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: easeOutExpo }}
              className="relative w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#ffe4e6] flex items-center justify-center">
                  <Trash2 size={18} className="text-[#f43f5e]" />
                </div>
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Hapus Acara</h2>
              </div>
              <p className="text-sm text-[#64748b] mb-6">
                Apakah Anda yakin ingin menghapus acara <strong className="text-[#0f172a] dark:text-[#f8fafc]">&ldquo;{deletingEvent.name}&rdquo;</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="h-10 px-6 rounded-lg text-sm font-medium bg-[#f43f5e] text-white hover:bg-[#e11d48] hover:scale-[1.02] active:scale-[0.96] transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Hapus Acara
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
