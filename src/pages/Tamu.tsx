import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  MoreVertical,
  Upload,
  Download,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Loader2,
  CalendarDays,
  MapPin,
  Clock3,
  CheckCircle2,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGuestInitials } from '@/lib/normalizers';
import { useGuests, type GuestImportResult } from '@/hooks/useGuests';
import { useCheckin, useGuestGifts, useRSVP, useSeating, useTemplates, useTenantAccess, useWhatsAppMessaging } from '@/hooks';
import {
  buildCheckinByGuestId,
  buildRsvpByGuestId,
  buildTableByGuestId,
  getGuestCheckin,
  getGuestRsvpStatus,
  getGuestTableName,
} from '@/lib/guest-live-data';
import type { Event, Guest } from '@/types';
import { formatGiftAmount, parseGiftAmount } from '@/lib/guest-gift';
import { toast } from 'sonner';
import { useTenantStore } from '@/store/tenantStore';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Config ─── */
const typeConfig: Record<Guest['category'], { label: string; bg: string; text: string; border: string }> = {
  vip: { label: 'VIP', bg: 'bg-[#eef2ff]', text: 'text-[#4f46e5]', border: 'border-[#c7d2fe]' },
  family: { label: 'Keluarga', bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]' },
  friend: { label: 'Teman', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]' },
  colleague: { label: 'Rekan', bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', border: 'border-[#93c5fd]' },
  partner: { label: 'VVIP', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', border: 'border-[#fcd34d]' },
  other: { label: 'Lainnya', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]' },
};

const rsvpConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  'attending': { label: 'Hadir', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]', dot: '#10b981' },
  'not_attending': { label: 'Tidak Hadir', bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]', dot: '#f43f5e' },
  'maybe': { label: 'Mungkin', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', border: 'border-[#fcd34d]', dot: '#f59e0b' },
  'no_response': { label: 'Belum Membalas', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]', dot: '#94a3b8' },
  'hadir': { label: 'Hadir', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]', dot: '#10b981' },
  'tidak-hadir': { label: 'Tidak Hadir', bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]', dot: '#f43f5e' },
  'belum': { label: 'Belum Membalas', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]', dot: '#94a3b8' },
};

function getTypeConfig(guest: Guest) {
  return typeConfig[guest.category] || typeConfig.other;
}

function getRsvpLabel(status: string) {
  return rsvpConfig[status] || rsvpConfig['no_response'];
}

function formatEventSchedule(event: Event) {
  const date = new Date(event.startDate);
  if (Number.isNaN(date.getTime())) return 'Jadwal belum ditentukan';
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${formattedDate} · ${formattedTime} WIB`;
}

function formatCheckinTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getEventStatusLabel(status: Event['status']) {
  switch (status) {
    case 'published': return 'Dipublikasikan';
    case 'ongoing': return 'Sedang Berlangsung';
    case 'completed': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    case 'archived': return 'Diarsipkan';
    default: return 'Draft';
  }
}

type GiftSaveState = 'idle' | 'saving' | 'saved' | 'error';

/* ─── Skeleton Row ─── */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#f1f5f9] dark:border-[#334155] animate-pulse">
      <td className="px-4 py-3"><div className="w-4 h-4 rounded bg-[#e2e8f0] dark:bg-[#334155]" /></td>
      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#e2e8f0] dark:bg-[#334155]" /><div className="flex-1"><div className="h-3 w-24 bg-[#e2e8f0] dark:bg-[#334155] rounded mb-1" /><div className="h-2 w-32 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></div></div></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-14 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-12 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-28 bg-[#e2e8f0] dark:bg-[#334155] rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-8 bg-[#e2e8f0] dark:bg-[#334155] rounded ml-auto" /></td>
    </tr>
  );
}

/* ─── Component ─── */
export default function Tamu() {
  const navigate = useNavigate();
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const currentEventId = currentEvent?.id;
  const {
    guests,
    total,
    isLoading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
    refreshSilently: refreshGuestsSilently,
    importCSV,
    downloadTemplateCSV,
    exportGuestsCSV,
  } = useGuests(currentEventId);
  const { rsvps, refreshSilently: refreshRsvpsSilently } = useRSVP(currentEventId);
  const { checkins, refetch: refreshCheckins } = useCheckin(currentEventId, 100);
  const {
    giftByGuestId,
    isLoading: isLoadingGifts,
    upsertGift,
    deleteGift,
    refreshSilently: refreshGiftsSilently,
  } = useGuestGifts(currentEventId);
  const { tables, refreshSilently: refreshTablesSilently } = useSeating();
  const { templates } = useTemplates();
  const { access, isLoading: isLoadingAccess } = useTenantAccess();
  const canWriteGuests = access?.permissions.includes('guest:write') ?? false;
  const canDeleteGuests = access?.permissions.includes('guest:delete') ?? false;
  const canReadGifts = access?.permissions.includes('gift:read') ?? false;
  const canManageGifts = access?.permissions.includes('gift:write') ?? false;
  const { sendWhatsApp, isSending: isSendingWhatsApp } = useWhatsAppMessaging();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<GuestImportResult | null>(null);
  const [giftDrafts, setGiftDrafts] = useState<Record<string, string>>({});
  const [giftSaveStates, setGiftSaveStates] = useState<Record<string, GiftSaveState>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* Modals */
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);

  const whatsappTemplate = useMemo(
    () => templates.find((template) => template.channel === 'whatsapp' && template.isActive),
    [templates]
  );

  /* Add form */
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<Guest['category']>('other');
  const [formSegment, setFormSegment] = useState('');
  const [_formRsvp, setFormRsvp] = useState('no_response');

  const rsvpByGuestId = useMemo(() => buildRsvpByGuestId(rsvps), [rsvps]);
  const tableByGuestId = useMemo(() => buildTableByGuestId(tables), [tables]);
  const checkinByGuestId = useMemo(() => buildCheckinByGuestId(checkins), [checkins]);

  // Keep the roster join current after RSVP, seating, check-in, or invitation
  // actions are performed in another tab or on an operator's device.
  useEffect(() => {
    if (!currentEventId) return;

    const refresh = () => {
      void Promise.all([
        refreshGuestsSilently(),
        refreshRsvpsSilently(),
        refreshTablesSilently(),
        refreshCheckins(),
        refreshGiftsSilently(),
      ]);
    };
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [currentEventId, refreshGuestsSilently, refreshRsvpsSilently, refreshTablesSilently, refreshCheckins, refreshGiftsSilently]);

  /* ─── Segments from data ─── */
  const segments = useMemo(() => {
    const set = new Set(guests.map((g) => g.subgroup).filter(Boolean));
    return Array.from(set) as string[];
  }, [guests]);

  /* ─── Filtered guests (client-side) ─── */
  const filtered = useMemo(() => {
    let data = [...guests];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((g) =>
        g.fullName.toLowerCase().includes(q) ||
        (g.email?.toLowerCase() ?? '').includes(q) ||
        (g.phone ?? '').includes(q)
      );
    }
    if (typeFilter !== 'all') data = data.filter((g) => g.category === typeFilter);
    if (segmentFilter !== 'all') data = data.filter((g) => g.subgroup === segmentFilter);
    if (rsvpFilter !== 'all') {
      data = data.filter((guest) => getGuestRsvpStatus(guest, rsvpByGuestId) === rsvpFilter);
    }
    return data;
  }, [guests, searchQuery, typeFilter, segmentFilter, rsvpFilter, rsvpByGuestId]);

  /* ─── Paginated ─── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage, perPage]);

  /* ─── Selection ─── */
  const allSelected = paginated.length > 0 && paginated.every((g) => selectedIds.has(g.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      paginated.forEach((g) => next.delete(g.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((g) => next.add(g.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  /* ─── Handlers ─── */
  const openAdd = () => {
    setFormName(''); setFormEmail(''); setFormPhone(''); setFormType('other'); setFormSegment(''); setFormRsvp('no_response');
    setShowAdd(true);
  };

  const openEdit = (g: Guest) => {
    setEditingGuest(g);
    setFormName(g.fullName); setFormEmail(g.email ?? ''); setFormPhone(g.phone ?? ''); setFormType(g.category); setFormSegment(g.subgroup ?? '');
    setShowEdit(true);
    setDropdownOpen(null);
  };

  const openDelete = (g: Guest) => {
    setDeletingGuest(g);
    setShowDelete(true);
    setDropdownOpen(null);
  };

  const handleGiftChange = (guestId: string, value: string) => {
    setGiftDrafts((previous) => ({ ...previous, [guestId]: value }));
    setGiftSaveStates((previous) => ({ ...previous, [guestId]: 'idle' }));
  };

  const handleGiftSave = async (guestId: string) => {
    if (!canManageGifts) return;
    const existing = giftByGuestId.get(guestId);
    const hasDraft = Object.prototype.hasOwnProperty.call(giftDrafts, guestId);
    const rawValue = hasDraft ? giftDrafts[guestId] : existing ? String(existing.amount) : '';
    const amount = parseGiftAmount(rawValue);

    if (amount === 0 && !existing) {
      setGiftDrafts((previous) => {
        const next = { ...previous };
        delete next[guestId];
        return next;
      });
      return;
    }
    if (amount > 0 && existing?.amount === amount && !hasDraft) return;

    setGiftSaveStates((previous) => ({ ...previous, [guestId]: 'saving' }));
    try {
      if (amount === 0) {
        await deleteGift(guestId);
      } else {
        await upsertGift(guestId, { amount, gift_type: 'cash' });
      }
      setGiftDrafts((previous) => {
        const next = { ...previous };
        delete next[guestId];
        return next;
      });
      setGiftSaveStates((previous) => ({ ...previous, [guestId]: 'saved' }));
    } catch {
      setGiftSaveStates((previous) => ({ ...previous, [guestId]: 'error' }));
    }
  };

  const handleAdd = async () => {
    if (!canWriteGuests) {
      toast.error('Anda tidak memiliki akses untuk menambah tamu');
      return;
    }
    setSubmitting(true);
    setErrorToast(null);
    try {
      await createGuest({
        fullName: formName,
        email: formEmail || undefined,
        phone: formPhone || undefined,
        category: formType,
        subgroup: formSegment || undefined,
        eventId: '', // Will be set by backend based on tenant
      });
      setShowAdd(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambah tamu';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingGuest) return;
    if (!canWriteGuests) {
      toast.error('Anda tidak memiliki akses untuk mengubah tamu');
      return;
    }
    setSubmitting(true);
    setErrorToast(null);
    try {
      await updateGuest(editingGuest.id, {
        fullName: formName,
        email: formEmail || undefined,
        phone: formPhone || undefined,
        category: formType,
        subgroup: formSegment || undefined,
      });
      setShowEdit(false);
      setEditingGuest(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui tamu';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGuest) return;
    if (!canDeleteGuests) {
      toast.error('Anda tidak memiliki akses untuk menghapus tamu');
      return;
    }
    setSubmitting(true);
    setErrorToast(null);
    try {
      await deleteGuest(deletingGuest.id);
      setShowDelete(false);
      setDeletingGuest(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tamu';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canDeleteGuests) {
      toast.error('Anda tidak memiliki akses untuk menghapus tamu');
      return;
    }
    setSubmitting(true);
    setErrorToast(null);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => deleteGuest(id)));
      setSelectedIds(new Set());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tamu';
      setErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestWhatsApp = async (guest: Guest) => {
    setDropdownOpen(null);
    if (!guest.phone?.trim()) {
      toast.error('Nomor WhatsApp tamu belum diisi');
      return;
    }
    if (!whatsappTemplate) {
      toast.error('Belum ada template WhatsApp aktif');
      return;
    }
    try {
      await sendWhatsApp({ guest_ids: [guest.id], template_id: whatsappTemplate.id });
      toast.success(`WhatsApp untuk ${guest.fullName} berhasil dikirim`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim WhatsApp');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSegmentFilter('all');
    setRsvpFilter('all');
    setPage(1);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorToast(null);
    setImportResult(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedImportFile(null);
      setErrorToast('File harus berformat CSV');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedImportFile(null);
      setErrorToast('Ukuran file maksimal 5MB');
      return;
    }
    setSelectedImportFile(file);
  };

  const handleImportSubmit = async () => {
    if (!selectedImportFile) {
      setErrorToast('Pilih file CSV terlebih dahulu');
      return;
    }
    if (!canWriteGuests) {
      setErrorToast('Anda tidak memiliki akses untuk mengimpor tamu');
      return;
    }

    setImporting(true);
    setErrorToast(null);
    try {
      const result = await importCSV(selectedImportFile);
      setImportResult(result);
      const summary = `${result.success_count} berhasil, ${result.error_count} gagal dari ${result.total_rows} baris`;
      if (result.error_count > 0) {
        const firstError = result.errors?.[0];
        const detail = firstError?.errors?.[0] ? ` Baris ${firstError.row_num}: ${firstError.errors[0]}.` : '';
        setErrorToast(`Import selesai sebagian: ${summary}.${detail}`);
        toast.warning(`Import selesai sebagian: ${summary}`);
      } else {
        toast.success(`Import berhasil: ${summary}`);
        setShowImport(false);
        setSelectedImportFile(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengimpor CSV';
      setErrorToast(msg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    setTemplateDownloading(true);
    setErrorToast(null);
    try {
      await downloadTemplateCSV();
      toast.success('Template CSV berhasil diunduh');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunduh template CSV';
      setErrorToast(msg);
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setErrorToast(null);
    try {
      const exportedCount = await exportGuestsCSV();
      toast.success(`Berhasil mengekspor ${exportedCount} tamu`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor CSV';
      setErrorToast(msg);
    } finally {
      setExporting(false);
    }
  };

  /* ─── Shared form ─── */
  const GuestForm = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">Nama Lengkap <span className="text-[#f43f5e]">*</span></label>
        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap..."
          className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Email</label>
          <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@contoh.com"
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Nomor Telepon <span className="text-[#f43f5e]">*</span></label>
          <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="08xx-xxxx-xxxx"
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Tipe Tamu <span className="text-[#f43f5e]">*</span></label>
          <select value={formType} onChange={(e) => setFormType(e.target.value as Guest['category'])}
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20">
            <option value="vip">VIP</option>
            <option value="family">Keluarga</option>
            <option value="friend">Teman</option>
            <option value="colleague">Rekan Kerja</option>
            <option value="partner">Mitra</option>
            <option value="other">Umum</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">Segmen</label>
          <input type="text" value={formSegment} onChange={(e) => setFormSegment(e.target.value)} placeholder="Nama segmen..."
            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
        </div>
      </div>
    </div>
  );

  const hasFilters = searchQuery || typeFilter !== 'all' || segmentFilter !== 'all' || rsvpFilter !== 'all';

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
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Daftar Tamu</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{total.toLocaleString('id-ID')} tamu terdaftar</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:flex-1 xl:justify-end">
          {currentEvent && (
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-3 py-2.5 dark:border-[#4338ca] dark:bg-[rgba(79,70,229,0.12)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#4f46e5] shadow-sm dark:bg-[#151c2c]">
                <CalendarDays size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366f1]">Data acara</p>
                <p className="truncate text-sm font-semibold text-[#3730a3] dark:text-[#c7d2fe]">{currentEvent.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#64748b]">
                  <span className="inline-flex items-center gap-1"><Clock3 size={12} />{formatEventSchedule(currentEvent)}</span>
                  {(currentEvent.location || currentEvent.address) && (
                    <span className="inline-flex min-w-0 items-center gap-1 truncate"><MapPin size={12} />{currentEvent.location || currentEvent.address}</span>
                  )}
                </div>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-[#c7d2fe] bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#4f46e5] dark:border-[#4338ca] dark:bg-[#151c2c] dark:text-[#c7d2fe]">
                {getEventStatusLabel(currentEvent.status)}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
          {canWriteGuests && (
          <button onClick={openAdd}
            disabled={isLoading || isLoadingAccess}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all disabled:opacity-50">
            <Plus size={16} />
            Tambah Tamu
          </button>
          )}
          {canWriteGuests && (
          <button onClick={() => { setSelectedImportFile(null); setImportResult(null); setErrorToast(null); setShowImport(true); }}
            disabled={isLoading || isLoadingAccess}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors disabled:opacity-50">
            <Upload size={15} />
            Impor CSV
          </button>
          )}
          <button
            onClick={handleExport}
            disabled={isLoading || exporting}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exporting ? 'Mengekspor...' : 'Ekspor'}
          </button>
          {selectedIds.size > 0 && canDeleteGuests && (
            <button onClick={handleBulkDelete} disabled={submitting}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#f43f5e] text-white text-sm font-medium hover:bg-[#e11d48] transition-colors disabled:opacity-50">
              <Trash2 size={15} />
              Hapus ({selectedIds.size})
            </button>
          )}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="space-y-3 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Cari nama, email, atau telepon..."
              className="w-[320px] h-10 pl-9 pr-4 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] appearance-none cursor-pointer">
              <option value="all">Semua Tipe</option>
              <option value="vip">VIP</option>
              <option value="family">Keluarga</option>
              <option value="friend">Teman</option>
              <option value="colleague">Rekan</option>
              <option value="partner">VVIP</option>
              <option value="other">Lainnya</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={segmentFilter} onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
              className="h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] appearance-none cursor-pointer">
              <option value="all">Semua Segmen</option>
              {segments.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={rsvpFilter} onChange={(e) => { setRsvpFilter(e.target.value); setPage(1); }}
              className="h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] appearance-none cursor-pointer">
              <option value="all">Semua RSVP</option>
              <option value="attending">Hadir</option>
              <option value="not_attending">Tidak Hadir</option>
              <option value="maybe">Mungkin</option>
              <option value="no_response">Belum Membalas</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-1 h-9 px-3 text-sm text-[#f43f5e] hover:bg-[#ffe4e6]/50 rounded-lg transition-colors">
              <Filter size={14} />
              Hapus Filter
            </button>
          )}
          <div className="ml-auto text-xs text-[#64748b]">
            Menampilkan {filtered.length > 0 ? ((safePage - 1) * perPage) + 1 : 0}-{Math.min(safePage * perPage, filtered.length)} dari {filtered.length} tamu
          </div>
        </div>
      </div>

      {/* ── Guests Table ── */}
      <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded border-[#e2e8f0] text-[#4f46e5] focus:ring-[#4f46e5]/20" />
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Nama</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Telepon</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tipe</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Segmen</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">RSVP</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Meja</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Check-in</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Angpau</th>
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
                    {paginated.map((g, i) => {
                      const t = getTypeConfig(g);
                      const r = getRsvpLabel(getGuestRsvpStatus(g, rsvpByGuestId));
                      const tableName = getGuestTableName(g, tableByGuestId);
                      const checkin = getGuestCheckin(g, checkinByGuestId);
                      const gift = giftByGuestId.get(g.id);
                      const giftSaveState = giftSaveStates[g.id] ?? 'idle';
                      return (
                        <motion.tr key={g.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02, ease: easeOutExpo }}
                          className={cn(
                            'border-b border-[#f1f5f9] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors group',
                            selectedIds.has(g.id) && 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)]'
                          )}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleOne(g.id)}
                              className="w-4 h-4 rounded border-[#e2e8f0] text-[#4f46e5] focus:ring-[#4f46e5]/20" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {getGuestInitials(g.fullName)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">{g.fullName}</p>
                                <p className="text-xs text-[#94a3b8]">{g.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#64748b] font-mono">{g.phone || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', t.bg, t.text, t.border)}>
                              {t.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#64748b]">{g.subgroup || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', r.bg, r.text, r.border)}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.dot }} />
                              {r.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#64748b]">{tableName || 'Belum Diatur'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {checkin ? (
                              <span className="inline-flex flex-col items-start gap-0.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#d1fae5] px-2 py-0.5 text-xs font-medium text-[#059669]">
                                  <CheckCircle2 size={12} />
                                  Sudah Check-in
                                </span>
                                <span className="pl-1 text-[10px] text-[#94a3b8]">{formatCheckinTime(checkin.checkedInAt)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-xs font-medium text-[#64748b] dark:border-[#475569] dark:bg-[#1e293b]">
                                Belum Check-in
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 min-w-[190px]">
                            {!canReadGifts ? (
                              <span className="text-sm text-[#94a3b8]">-</span>
                            ) : canManageGifts ? (
                              <div className="space-y-1">
                                <div className="relative">
                                  <CircleDollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={giftDrafts[g.id] ?? (gift ? String(gift.amount) : '')}
                                    onChange={(event) => handleGiftChange(g.id, event.target.value)}
                                    onBlur={() => { void handleGiftSave(g.id); }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') event.currentTarget.blur();
                                      if (event.key === 'Escape') {
                                        setGiftDrafts((previous) => {
                                          const next = { ...previous };
                                          delete next[g.id];
                                          return next;
                                        });
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    disabled={!checkin || isLoadingGifts}
                                    placeholder={checkin ? 'Nominal angpau' : 'Check-in dahulu'}
                                    title={!checkin ? 'Tamu perlu check-in sebelum mencatat angpau' : 'Kosongkan untuk menghapus data angpau'}
                                    className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-2 text-sm text-[#1e293b] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#64748b] dark:border-[#334155] dark:bg-[#151c2c] dark:text-[#f8fafc] dark:disabled:bg-[#1e293b]"
                                  />
                                </div>
                                <div className="flex min-h-3 items-center gap-1 text-[10px]">
                                  {giftSaveState === 'saving' && <><Loader2 size={11} className="animate-spin text-[#4f46e5]" /> <span className="text-[#4f46e5]">Menyimpan...</span></>}
                                  {giftSaveState === 'saved' && <><CheckCircle2 size={11} className="text-[#059669]" /> <span className="text-[#059669]">Tersimpan</span></>}
                                  {giftSaveState === 'error' && <><AlertCircle size={11} className="text-[#e11d48]" /> <span className="text-[#e11d48]">Gagal menyimpan</span></>}
                                  {giftSaveState === 'idle' && !checkin && <span className="text-[#94a3b8]">Tunggu check-in</span>}
                                </div>
                              </div>
                            ) : gift ? (
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#059669]">Rp {formatGiftAmount(gift.amount)}</span>
                            ) : (
                              <span className="text-sm text-[#94a3b8]">Belum dicatat</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canWriteGuests && (
                              <button onClick={() => openEdit(g)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors" title="Ubah">
                                <Pencil size={15} />
                              </button>
                              )}
                              <button onClick={() => navigate(`/tamu/${g.id}`)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors" title="Lihat Detail">
                                <Eye size={15} />
                              </button>
                              <div className="relative">
                                <button onClick={() => setDropdownOpen(dropdownOpen === g.id ? null : g.id)}
                                  className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors" title="Lainnya">
                                  <MoreVertical size={15} />
                                </button>
                                <AnimatePresence>
                                  {dropdownOpen === g.id && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.15, ease: easeOutExpo }}
                                        className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-lg shadow-lg z-20 py-1">
                                        <button onClick={() => { navigate(`/tamu/${g.id}`); }}
                                          className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors">Lihat Detail</button>
                                        {canWriteGuests && (
                                        <button onClick={() => openEdit(g)}
                                          className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors">Ubah Tamu</button>
                                        )}
                                        <button onClick={() => handleGuestWhatsApp(g)} disabled={isSendingWhatsApp}
                                          className="w-full text-left px-3 py-2 text-sm text-[#059669] hover:bg-[#ecfdf5] transition-colors disabled:opacity-50">
                                          Kirim WhatsApp
                                        </button>
                                        {canDeleteGuests && (
                                        <>
                                        <div className="border-t border-[#e2e8f0] dark:border-[#334155] my-1" />
                                        <button onClick={() => openDelete(g)}
                                          className="w-full text-left px-3 py-2 text-sm text-[#f43f5e] hover:bg-[#ffe4e6]/50 transition-colors">Hapus</button>
                                        </>
                                        )}
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
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-12">
                        <Users size={40} className="mx-auto text-[#e2e8f0] mb-3" />
                        <p className="text-sm text-[#64748b]">Tidak ada tamu yang cocok</p>
                        <p className="text-xs text-[#94a3b8] mt-1">Coba ubah filter atau kata kunci pencarian</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#e2e8f0] dark:border-[#334155]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748b]">Baris per halaman</span>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="h-8 px-2 rounded-md border border-[#e2e8f0] bg-white text-xs focus:outline-none focus:border-[#4f46e5]">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="p-1.5 rounded-md border border-[#e2e8f0] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn(
                    'min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-colors',
                    p === safePage ? 'bg-[#4f46e5] text-white' : 'border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#64748b]'
                  )}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="p-1.5 rounded-md border border-[#e2e8f0] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="text-xs text-[#64748b]">Halaman {safePage} dari {totalPages}</span>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm" onClick={() => !submitting && setShowAdd(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[560px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Tambah Tamu</h2>
                <button onClick={() => !submitting && setShowAdd(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]"><X size={18} /></button>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">{GuestForm}</div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button onClick={() => setShowAdd(false)} disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50">Batal</button>
                <button onClick={handleAdd} disabled={!formName || !formPhone || submitting}
                  className={cn('h-10 px-6 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    !formName || !formPhone || submitting ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed' : 'bg-[#4f46e5] text-white hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96]')}>
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Simpan Tamu
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm" onClick={() => !submitting && setShowEdit(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[560px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Ubah Tamu</h2>
                <button onClick={() => !submitting && setShowEdit(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]"><X size={18} /></button>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">{GuestForm}</div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button onClick={() => setShowEdit(false)} disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50">Batal</button>
                <button onClick={handleEdit} disabled={submitting}
                  className="h-10 px-6 rounded-lg text-sm font-medium bg-[#4f46e5] text-white hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Modal ── */}
      <AnimatePresence>
        {showDelete && deletingGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm" onClick={() => !submitting && setShowDelete(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: easeOutExpo }}
              className="relative w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#ffe4e6] flex items-center justify-center">
                  <Trash2 size={18} className="text-[#f43f5e]" />
                </div>
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Hapus Tamu</h2>
              </div>
              <p className="text-sm text-[#64748b] mb-6">
                Apakah Anda yakin ingin menghapus tamu <strong className="text-[#0f172a] dark:text-[#f8fafc]">&ldquo;{deletingGuest.fullName}&rdquo;</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowDelete(false)} disabled={submitting}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50">Batal</button>
                <button onClick={handleDelete} disabled={submitting}
                  className="h-10 px-6 rounded-lg text-sm font-medium bg-[#f43f5e] text-white hover:bg-[#e11d48] hover:scale-[1.02] active:scale-[0.96] transition-all flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Hapus Tamu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CSV Import Modal ── */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm" onClick={() => !importing && setShowImport(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[480px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Impor Tamu dari CSV</h2>
                <button onClick={() => !importing && setShowImport(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]"><X size={18} /></button>
              </div>
              <div className="px-6 py-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e2e8f0] rounded-xl h-40 flex flex-col items-center justify-center gap-2 hover:border-[#4f46e5] hover:bg-[#eef2ff]/50 transition-colors cursor-pointer"
                >
                  {importing ? (
                    <>
                      <Loader2 size={40} className="text-[#4f46e5] animate-spin" />
                      <p className="text-sm text-[#64748b]">Mengimpor...</p>
                    </>
                  ) : (
                    <>
                      <Upload size={40} className="text-[#94a3b8]" />
                      <p className="text-sm text-[#64748b]">Klik untuk pilih file CSV</p>
                      <p className="text-xs text-[#94a3b8]">Maks 5MB. Format: nama, email, telepon, tipe, segmen</p>
                    </>
                  )}
                </div>
                {selectedImportFile && (
                  <div className="mt-3 rounded-lg bg-[#eef2ff] border border-[#c7d2fe] px-3 py-2 text-sm text-[#3730a3]">
                    File dipilih: <strong>{selectedImportFile.name}</strong>
                  </div>
                )}
                {importResult && (
                  <div className={cn(
                    'mt-3 rounded-lg border px-3 py-2 text-xs',
                    importResult.error_count > 0
                      ? 'bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]'
                      : 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                  )}>
                    <p className="font-semibold">
                      {importResult.success_count} berhasil, {importResult.error_count} gagal dari {importResult.total_rows} baris
                    </p>
                    {importResult.errors?.slice(0, 3).map((item) => (
                      <p key={`${item.row_num}-${item.full_name}`} className="mt-1">
                        Baris {item.row_num}: {item.errors?.join(', ') || 'Data tidak valid'}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={templateDownloading}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-[#4f46e5] hover:underline font-medium disabled:opacity-50"
                >
                  {templateDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {templateDownloading ? 'Mengunduh template...' : 'Unduh template CSV'}
                </button>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button onClick={() => { setShowImport(false); setSelectedImportFile(null); setImportResult(null); }} disabled={importing}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50">Batal</button>
                <button onClick={handleImportSubmit} disabled={importing || !selectedImportFile}
                  className="h-10 px-5 rounded-lg text-sm font-medium bg-[#4f46e5] text-white hover:bg-[#6366f1] transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                  {importing && <Loader2 size={15} className="animate-spin" />}
                  {importing ? 'Mengimpor...' : 'Submit Import'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
