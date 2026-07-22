import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Gift as GiftIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCheckin, useEventAccess, useGuestGifts, useGuests, useRSVP } from '@/hooks';
import { formatGiftAmount, getGiftTypeLabel, parseGiftAmount } from '@/lib/guest-gift';
import type { Guest, GuestGift } from '@/types';
import { useTenantStore } from '@/store/tenantStore';

type GiftForm = {
  guestId: string;
  giftType: GuestGift['giftType'];
  amount: string;
  notes: string;
};

const giftTypeOptions: Array<{ value: GuestGift['giftType']; label: string; description: string }> = [
  { value: 'cash', label: 'Tunai / Nominal', description: 'Uang yang diterima langsung saat acara' },
  { value: 'transfer', label: 'Transfer', description: 'Transfer bank atau pembayaran digital' },
  { value: 'goods', label: 'Kado / Barang', description: 'Hadiah fisik tanpa nominal wajib' },
  { value: 'other', label: 'Lainnya', description: 'Bentuk pemberian lain yang perlu dicatat' },
];

const rsvpLabels: Record<string, string> = {
  attending: 'Hadir',
  not_attending: 'Tidak hadir',
  maybe: 'Tentatif',
  no_response: 'Belum RSVP',
};

const emptyForm: GiftForm = { guestId: '', giftType: 'cash', amount: '', notes: '' };

function getGuestName(guestMap: Map<string, Guest>, guestId: string) {
  return guestMap.get(guestId)?.fullName ?? `Tamu ${guestId.slice(0, 8)}`;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as { response?: { data?: { error?: string; message?: string } } }).response?.data;
  return responseData?.error ?? responseData?.message ?? fallback;
}

export default function Gift() {
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const currentEventId = currentEvent?.id;
  const { access, isLoading: isLoadingAccess } = useEventAccess();
  const { guests, isLoading: isLoadingGuests, error: guestsError, refreshSilently: refreshGuests } = useGuests(currentEventId, { perPage: 100, all: true });
  const {
    gifts,
    isLoading: isLoadingGifts,
    error: giftsError,
    refetch: refetchGifts,
    upsertGift,
    deleteGift,
  } = useGuestGifts(currentEventId);
  const { checkins, refetch: refetchCheckins } = useCheckin(currentEventId, 100);
  const canReadRsvp = access?.permissions.includes('rsvp:read') ?? false;
  const { rsvps } = useRSVP(canReadRsvp ? currentEventId : undefined);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | GuestGift['giftType']>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GuestGift | null>(null);
  const [form, setForm] = useState<GiftForm>(emptyForm);
  const [guestSearch, setGuestSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canRead = access?.permissions.includes('gift:read') ?? false;
  const canWrite = access?.permissions.includes('gift:write') ?? false;
  const canDelete = access?.permissions.includes('gift:delete') ?? false;
  const canReadCheckin = access?.permissions.includes('checkin:read') ?? false;

  const guestMap = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);
  const checkinGuestIds = useMemo(
    () => new Set(checkins.filter((checkin) => checkin.status === 'success').map((checkin) => checkin.guestId)),
    [checkins]
  );
  const giftByGuestId = useMemo(() => new Map(gifts.map((gift) => [gift.guestId, gift])), [gifts]);
  const rsvpByGuestId = useMemo(() => new Map(rsvps.map((rsvp) => [rsvp.guestId, rsvp.status])), [rsvps]);

  const filteredGifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gifts.filter((gift) => {
      const guest = guestMap.get(gift.guestId);
      const searchable = [guest?.fullName, guest?.phone, gift.notes, gift.giftType].filter(Boolean).join(' ').toLowerCase();
      return (!query || searchable.includes(query)) && (typeFilter === 'all' || gift.giftType === typeFilter);
    });
  }, [gifts, guestMap, search, typeFilter]);

  const filteredGuests = useMemo(() => {
    const query = guestSearch.trim().toLowerCase();
    return guests.filter((guest) => !query || `${guest.fullName} ${guest.phone ?? ''}`.toLowerCase().includes(query));
  }, [guestSearch, guests]);

  const stats = useMemo(() => {
    const amount = (type: GuestGift['giftType']) => gifts
      .filter((gift) => gift.giftType === type)
      .reduce((total, gift) => total + (gift.amount ?? 0), 0);
    return {
      total: gifts.length,
      totalAmount: gifts.reduce((total, gift) => total + (gift.amount ?? 0), 0),
      cashAmount: amount('cash'),
      transferAmount: amount('transfer'),
      physicalCount: gifts.filter((gift) => gift.giftType === 'goods').length,
    };
  }, [gifts]);

  useEffect(() => {
    setSearch('');
    setTypeFilter('all');
    setIsFormOpen(false);
    setEditingGift(null);
  }, [currentEventId]);

  const openCreate = () => {
    setEditingGift(null);
    setForm(emptyForm);
    setGuestSearch('');
    setIsFormOpen(true);
  };

  const openEdit = (gift: GuestGift) => {
    setEditingGift(gift);
    setForm({
      guestId: gift.guestId,
      giftType: gift.giftType,
      amount: gift.amount ? String(gift.amount) : '',
      notes: gift.notes ?? '',
    });
    setGuestSearch('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingGift(null);
  };

  const saveGift = async () => {
    if (!form.guestId) {
      toast.error('Pilih tamu terlebih dahulu');
      return;
    }
    const amount = parseGiftAmount(form.amount);
    if ((form.giftType === 'cash' || form.giftType === 'transfer') && amount < 1) {
      toast.error('Nominal wajib diisi untuk gift tunai atau transfer');
      return;
    }

    setIsSaving(true);
    try {
      await upsertGift(form.guestId, {
        ...(amount > 0 ? { amount } : {}),
        gift_type: form.giftType,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      toast.success(editingGift ? 'Data gift diperbarui' : 'Gift berhasil dicatat');
      setIsFormOpen(false);
      setEditingGift(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan data gift'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeGift = async (gift: GuestGift) => {
    if (!canDelete || !window.confirm(`Hapus catatan gift dari ${getGuestName(guestMap, gift.guestId)}?`)) return;
    try {
      await deleteGift(gift.guestId);
      toast.success('Catatan gift dihapus');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus catatan gift'));
    }
  };

  const refreshAll = async () => {
    await Promise.all([refetchGifts(), refreshGuests(), refetchCheckins()]);
  };

  if (isLoadingAccess) {
    return <div className="flex min-h-[420px] items-center justify-center text-sm text-[#64748b]"><Loader2 size={18} className="mr-2 animate-spin" /> Memuat akses gift...</div>;
  }

  if (!canRead) {
    return <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><AlertCircle size={42} className="mb-3 text-[#f59e0b]" /><p className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">Akses Gift belum tersedia</p><p className="mt-1 text-sm text-[#64748b]">Minta pemilik tenant menambahkan akses gift pada tim acara ini.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#ea580c]"><GiftIcon size={23} /></div><div><h1 className="text-[2.25rem] font-bold text-[#0f172a] dark:text-[#f8fafc]">Gift & Angpau</h1><p className="mt-1 text-sm text-[#64748b]">Catat pemberian berdasarkan acara, baik saat hadir maupun melalui transfer.</p></div></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#64748b]"><Banknote size={14} className="text-[#ea580c]" /> Konteks: <span className="font-semibold text-[#1e293b] dark:text-[#f8fafc]">{currentEvent?.name}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refreshAll()} className="h-10 gap-2"><RefreshCw size={15} className={cn(isLoadingGifts && 'animate-spin')} /> Refresh</Button>
          {canWrite && <Button onClick={openCreate} className="h-10 gap-2 bg-[#ea580c] text-white hover:bg-[#c2410c]"><Plus size={16} /> Catat Gift</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Catatan', value: String(stats.total), accent: 'text-[#ea580c]' },
          { label: 'Total Nominal', value: `Rp ${formatGiftAmount(stats.totalAmount)}`, accent: 'text-[#059669]' },
          { label: 'Tunai', value: `Rp ${formatGiftAmount(stats.cashAmount)}`, accent: 'text-[#4f46e5]' },
          { label: 'Transfer', value: `Rp ${formatGiftAmount(stats.transferAmount)}`, accent: 'text-[#2563eb]' },
          { label: 'Kado Fisik', value: String(stats.physicalCount), accent: 'text-[#b45309]' },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#334155] dark:bg-[#151c2c]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">{stat.label}</p>
            <p className={cn('mt-2 truncate font-mono text-lg font-semibold', stat.accent)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama tamu, nomor, atau catatan..." className="h-10 pl-9" /></div>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="h-10 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm text-[#1e293b] outline-none dark:border-[#334155] dark:bg-[#151c2c] dark:text-[#f8fafc]"><option value="all">Semua Jenis</option>{giftTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </div>

      {(giftsError || guestsError) && <div className="flex items-center gap-2 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]"><AlertCircle size={16} /> {giftsError || guestsError}</div>}

      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white dark:border-[#334155] dark:bg-[#151c2c]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead><tr className="bg-[#fff7ed] dark:bg-[#1e293b]">{['Tamu', 'RSVP', 'Kehadiran', 'Jenis', 'Nominal', 'Detail', 'Dicatat', 'Aksi'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">{heading}</th>)}</tr></thead>
            <tbody>
              {isLoadingGifts || isLoadingGuests ? (
                Array.from({ length: 5 }).map((_, index) => <tr key={index} className="animate-pulse border-t border-[#f1f5f9] dark:border-[#334155]"><td colSpan={8} className="px-4 py-5"><div className="h-4 w-2/3 rounded bg-[#f1f5f9] dark:bg-[#334155]" /></td></tr>)
              ) : filteredGifts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center"><GiftIcon size={36} className="mx-auto mb-3 text-[#cbd5e1]" /><p className="font-medium text-[#475569] dark:text-[#cbd5e1]">Belum ada gift pada acara ini</p><p className="mt-1 text-sm text-[#94a3b8]">Catat gift tunai, transfer, kado, atau pemberian lainnya.</p></td></tr>
              ) : filteredGifts.map((gift) => {
                const guest = guestMap.get(gift.guestId);
                const rsvp = rsvpByGuestId.get(gift.guestId);
                const checkedIn = checkinGuestIds.has(gift.guestId);
                return <tr key={gift.id} className="border-t border-[#f1f5f9] hover:bg-[#fffaf5] dark:border-[#334155] dark:hover:bg-[#1e293b]">
                  <td className="px-4 py-3"><p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{getGuestName(guestMap, gift.guestId)}</p><p className="mt-0.5 text-xs text-[#94a3b8]">{guest?.phone || 'Nomor tidak tersedia'}</p></td>
                  <td className="px-4 py-3"><span className="text-xs text-[#64748b]">{canReadRsvp ? (rsvpLabels[rsvp ?? 'no_response'] ?? 'Belum RSVP') : '-'}</span></td>
                  <td className="px-4 py-3">{canReadCheckin ? <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', checkedIn ? 'border-[#a7f3d0] bg-[#d1fae5] text-[#059669]' : 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] dark:border-[#475569] dark:bg-[#1e293b]')}>{checkedIn && <CheckCircle2 size={12} />}{checkedIn ? 'Sudah check-in' : 'Belum check-in'}</span> : <span className="text-xs text-[#94a3b8]">-</span>}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-full border border-[#fed7aa] bg-[#fff7ed] px-2 py-0.5 text-xs font-medium text-[#c2410c]">{getGiftTypeLabel(gift.giftType)}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-sm font-semibold text-[#059669]">{gift.amount ? `Rp ${formatGiftAmount(gift.amount)}` : '-'}</span></td>
                  <td className="max-w-[220px] px-4 py-3"><span className="block truncate text-sm text-[#64748b]" title={gift.notes ?? undefined}>{gift.notes || '-'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#64748b]">{new Date(gift.receivedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" onClick={() => openEdit(gift)} disabled={!canWrite} className="rounded-md p-2 text-[#64748b] transition-colors hover:bg-[#fff7ed] hover:text-[#ea580c] disabled:cursor-not-allowed disabled:opacity-40" title="Ubah"><Pencil size={15} /></button><button type="button" onClick={() => void removeGift(gift)} disabled={!canDelete} className="rounded-md p-2 text-[#64748b] transition-colors hover:bg-[#fff1f2] hover:text-[#e11d48] disabled:cursor-not-allowed disabled:opacity-40" title="Hapus"><Trash2 size={15} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingGift ? 'Ubah Catatan Gift' : 'Catat Gift Baru'}</DialogTitle><DialogDescription>Catatan gift terikat pada acara <strong>{currentEvent?.name}</strong>. Tamu tidak harus check-in untuk dicatat.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Tamu <span className="text-[#e11d48]">*</span></label><Input value={guestSearch} onChange={(event) => setGuestSearch(event.target.value)} placeholder="Cari nama tamu..." disabled={Boolean(editingGift)} className="mb-2" /><select value={form.guestId} onChange={(event) => setForm((previous) => ({ ...previous, guestId: event.target.value }))} disabled={Boolean(editingGift)} className="h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 text-sm outline-none dark:border-[#334155] dark:bg-[#151c2c] dark:text-[#f8fafc]"><option value="">Pilih tamu dari acara ini</option>{filteredGuests.map((guest) => <option key={guest.id} value={guest.id}>{guest.fullName}{guest.phone ? ` · ${guest.phone}` : ''}{giftByGuestId.has(guest.id) && guest.id !== editingGift?.guestId ? ' · sudah tercatat' : ''}</option>)}</select>{form.guestId && !editingGift && giftByGuestId.has(form.guestId) && <p className="mt-1 text-xs text-[#b45309]">Tamu ini sudah memiliki catatan. Penyimpanan akan memperbarui catatan yang ada.</p>}</div>
            <div><label className="mb-1.5 block text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Jenis gift <span className="text-[#e11d48]">*</span></label><div className="grid gap-2 sm:grid-cols-2">{giftTypeOptions.map((option) => <button key={option.value} type="button" onClick={() => setForm((previous) => ({ ...previous, giftType: option.value }))} className={cn('rounded-xl border p-3 text-left transition-colors', form.giftType === option.value ? 'border-[#ea580c] bg-[#fff7ed] ring-2 ring-[#ea580c]/10' : 'border-[#e2e8f0] hover:border-[#fdba74] dark:border-[#334155]')}><span className="block text-sm font-semibold text-[#1e293b] dark:text-[#f8fafc]">{option.label}</span><span className="mt-0.5 block text-[11px] text-[#64748b]">{option.description}</span></button>)}</div></div>
            <div><label className="mb-1.5 block text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Nominal {form.giftType === 'cash' || form.giftType === 'transfer' ? <span className="text-[#e11d48]">*</span> : <span className="font-normal text-[#94a3b8]">(opsional)</span>}</label><Input value={form.amount} onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))} inputMode="numeric" placeholder="Contoh: 500000" /><p className="mt-1 text-xs text-[#94a3b8]">Untuk kado/barang, nominal boleh dikosongkan. Gunakan catatan untuk menjelaskan isi kado.</p></div>
            <div><label className="mb-1.5 block text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Catatan</label><Textarea value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} placeholder="Contoh: Transfer BCA, kado blender, atau informasi lain" rows={3} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}><X size={15} /> Batal</Button><Button type="button" onClick={() => void saveGift()} disabled={isSaving} className="bg-[#ea580c] text-white hover:bg-[#c2410c]">{isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
