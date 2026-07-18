import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  QrCode,
  Trash2,
  Search,
  RotateCcw,
  X,
  MessageCircle,
  Mail,
  CheckCircle2,
  Eye,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Check,
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
import { cn } from '@/lib/utils';
import { useGuests, useInvitations, useTemplates, useWhatsAppMessaging } from '@/hooks';
import { useTenantStore } from '@/store/tenantStore';
import { QRCodeSVG } from '@/components/QRCodeSVG';
import { toast } from 'sonner';

/* ── Extended UI Type ─────────────────────────────── */
type InvitationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'revoked';

interface UIInvitation {
  id: string;
  guestId: string;
  eventId: string;
  channel: 'whatsapp' | 'email' | 'both';
  status: InvitationStatus;
  templateId?: string;
  sentAt?: string | null;
  readAt?: string | null;
  deliveredAt?: string | null;
  qrCodeUrl?: string;
  shortLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

type SendResult = {
  data?: Array<{ status?: string }>;
};

function countFailedMessages(result: unknown): number {
  if (!result || typeof result !== 'object' || !('data' in result)) return 0;
  const messages = (result as SendResult).data;
  return Array.isArray(messages) ? messages.filter((message) => message.status === 'failed').length : 0;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Status Config ─────────────────────────────────── */

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: 'Belum Terkirim',
    icon: <Clock size={14} />,
    badgeClass: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30',
    dotClass: 'bg-[#f59e0b]',
  },
  sent: {
    label: 'Terkirim',
    icon: <Send size={14} />,
    badgeClass: 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]',
    dotClass: 'bg-[#64748b]',
  },
  delivered: {
    label: 'Tersampaikan',
    icon: <CheckCircle2 size={14} />,
    badgeClass: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/30',
    dotClass: 'bg-[#10b981]',
  },
  read: {
    label: 'Dibaca',
    icon: <Eye size={14} />,
    badgeClass: 'bg-[#eef2ff] text-[#3730a3] border-[#4f46e5]/30',
    dotClass: 'bg-[#4f46e5]',
  },
  failed: {
    label: 'Gagal',
    icon: <AlertCircle size={14} />,
    badgeClass: 'bg-[#ffe4e6] text-[#9f1239] border-[#f43f5e]/30',
    dotClass: 'bg-[#f43f5e]',
  },
  revoked: {
    label: 'Dibatalkan',
    icon: <XCircle size={14} />,
    badgeClass: 'bg-transparent text-[#9f1239] border-[#f43f5e]/50 border-dashed',
    dotClass: 'bg-[#f43f5e]',
  },
};

/* ── Main Component ───────────────────────────────── */

export default function Undangan() {
  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const { invitations, isLoading, error, refetch, refresh, batchCreate, revokeInvitation, resendInvitation } = useInvitations(currentEventId);
  const { guests: rosterGuests } = useGuests(currentEventId);
  const { templates } = useTemplates();
  const { sendWhatsApp, isSending: isSendingWhatsApp } = useWhatsAppMessaging();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInvitation, setQrInvitation] = useState<UIInvitation | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<UIInvitation | null>(null);
  const [batchStep, setBatchStep] = useState(1);
  const [batchGuests, setBatchGuests] = useState<string[]>([]);
  const [batchChannel, setBatchChannel] = useState('whatsapp');
  const [batchTemplateId, setBatchTemplateId] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendTargetIds, setSendTargetIds] = useState<string[]>([]);
  const [sendTemplateId, setSendTemplateId] = useState('');

  const uiInvitations = invitations as UIInvitation[];
  const invitedGuestIds = useMemo(() => new Set(uiInvitations.map((inv) => inv.guestId)), [uiInvitations]);
  const batchCandidates = useMemo(
    () => rosterGuests.filter((guest) => !invitedGuestIds.has(guest.id)),
    [rosterGuests, invitedGuestIds]
  );
  const whatsappTemplates = useMemo(
    () => templates.filter((template) => template.channel === 'whatsapp' && template.isActive),
    [templates]
  );
  const guestById = useMemo(() => new Map(rosterGuests.map((guest) => [guest.id, guest])), [rosterGuests]);
  const sendTargetGuests = useMemo(
    () => sendTargetIds.map((guestId) => guestById.get(guestId)).filter(Boolean),
    [sendTargetIds, guestById]
  );
  const missingTargetPhones = useMemo(
    () => sendTargetGuests.filter((guest) => !guest?.phone?.trim()),
    [sendTargetGuests]
  );

  /* ── Filtering ──────────────────────────────────── */

  const filtered = useMemo(() => {
    return uiInvitations.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.guestId.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesChannel =
        channelFilter === 'all' || inv.channel === channelFilter;
      const matchesStatus =
        statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [uiInvitations, search, channelFilter, statusFilter]);

  /* ── Stats ──────────────────────────────────────── */

  const stats = useMemo(() => {
    return {
      totalSent: uiInvitations.filter((i) => i.sentAt).length,
      whatsappDelivered: uiInvitations.filter(
        (i) => i.channel === 'whatsapp' && (i.status === 'delivered' || i.status === 'read')
      ).length,
      read: uiInvitations.filter((i) => i.status === 'read').length,
      pending: uiInvitations.filter((i) => i.status === 'pending').length,
    };
  }, [uiInvitations]);

  /* ── Handlers ───────────────────────────────────── */

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openQrModal = (inv: UIInvitation) => {
    setQrInvitation(inv);
    setQrModalOpen(true);
  };

  const openRevokeModal = (inv: UIInvitation) => {
    setRevokeTarget(inv);
    setRevokeModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    await revokeInvitation(revokeTarget.id);
    setRevokeModalOpen(false);
    setRevokeTarget(null);
  };

  const handleResend = async (inv: UIInvitation) => {
    const success = await resendInvitation(inv.id);
    if (!success) {
      toast.info('Kirim ulang undangan belum tersedia');
    }
  };

  const openBatchModal = () => {
    setBatchStep(1);
    setBatchGuests([]);
    setBatchChannel('whatsapp');
    setBatchTemplateId(whatsappTemplates[0]?.id || '');
    setBatchModalOpen(true);
  };

  const sendBatch = async () => {
    if (batchChannel === 'whatsapp') {
      if (!batchTemplateId) {
        toast.error('Belum ada template WhatsApp aktif');
        return;
      }
      const missing = batchCandidates.filter((guest) => batchGuests.includes(guest.id) && !guest.phone?.trim());
      if (missing.length > 0) {
        toast.error(`Nomor WhatsApp belum diisi untuk ${missing.length} tamu`);
        return;
      }
    }
    const created = await batchCreate(batchGuests, batchChannel, batchTemplateId);
    if (created.length === 0) return;
    if (batchChannel === 'whatsapp') {
      try {
        const result = await sendWhatsApp({
          guest_ids: created.map((invitation) => invitation.guestId),
          template_id: batchTemplateId,
        });
        await refresh();
        const failedCount = countFailedMessages(result);
        if (failedCount > 0) {
          toast.error(`${failedCount} WhatsApp gagal dikirim; status tabel sudah diperbarui`);
        } else {
          toast.success(`${created.length} WhatsApp berhasil dikirim`);
        }
      } catch (err: unknown) {
        await refresh();
        toast.error(err instanceof Error ? err.message : 'Gagal mengirim WhatsApp');
      }
    } else {
      toast.success(`${created.length} undangan berhasil dibuat`);
    }
    setBatchModalOpen(false);
    setBatchGuests([]);
  };

  const openSendModal = (guestIds: string[]) => {
    setSendTargetIds(guestIds);
    setSendTemplateId(whatsappTemplates[0]?.id || '');
    setSendModalOpen(true);
  };

  const handleSendSelectedWhatsApp = async () => {
    if (missingTargetPhones.length > 0) {
      toast.error(`Nomor WhatsApp belum diisi untuk ${missingTargetPhones.length} tamu`);
      return;
    }
    try {
      const result = await sendWhatsApp({ guest_ids: sendTargetIds, template_id: sendTemplateId });
      await refresh();
      const failedCount = countFailedMessages(result);
      if (failedCount > 0) {
        toast.error(`${failedCount} WhatsApp gagal dikirim; status tabel sudah diperbarui`);
      } else {
        toast.success(`${sendTargetIds.length} WhatsApp berhasil dikirim`);
      }
      setSendModalOpen(false);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      await refresh();
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim WhatsApp');
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
        <p className="text-sm text-[#64748b]">Memuat data undangan...</p>
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
          <X size={32} className="text-[#e11d48]" />
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
            Undangan
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Kelola undangan digital dan QR code tamu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => openSendModal(uiInvitations.filter((inv) => selectedIds.has(inv.id)).map((inv) => inv.guestId))}
            className="text-[#059669] border-[#a7f3d0] hover:bg-[#ecfdf5] disabled:opacity-40"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Kirim WhatsApp</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => {
              const first = uiInvitations.find((i) => selectedIds.has(i.id));
              if (first) openRevokeModal(first);
            }}
            className="text-[#f43f5e] hover:text-[#f43f5e] hover:bg-[#ffe4e6] disabled:opacity-40"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Cabut</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={openBatchModal}>
            <QrCode size={16} />
            <span className="hidden sm:inline">Generate Massal</span>
          </Button>
          <Button size="sm" onClick={openBatchModal}>
            <Send size={16} />
            Buat Undangan
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Terkirim', value: stats.totalSent, icon: <Send size={16} />, color: 'text-[#4f46e5]', bg: 'bg-[#eef2ff]' },
          { label: 'Tersampaikan (WA)', value: stats.whatsappDelivered, icon: <MessageCircle size={16} />, color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
          { label: 'Dibaca', value: stats.read, icon: <Eye size={16} />, color: 'text-[#4f46e5]', bg: 'bg-[#eef2ff]' },
          { label: 'Belum Terkirim', value: stats.pending, icon: <Clock size={16} />, color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card p-4 flex items-center gap-3"
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8]">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-[#1e293b] dark:text-[#f8fafc]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Cari undangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[280px] h-9 text-sm"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Semua Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Channel</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[170px] text-sm">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Belum Terkirim</SelectItem>
            <SelectItem value="sent">Terkirim</SelectItem>
            <SelectItem value="delivered">Tersampaikan</SelectItem>
            <SelectItem value="read">Dibaca</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
            <SelectItem value="revoked">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#cbd5e1]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Tamu (ID)
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Dikirim Pada
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  QR Code
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((inv, idx) => {
                  const cfg = statusConfig[inv.status] || statusConfig['pending'];
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        'border-b border-[#f1f5f9] dark:border-[#334155] last:border-b-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors',
                        selectedIds.has(inv.id) && 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)]'
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="rounded border-[#cbd5e1]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1e293b] dark:text-[#f8fafc]">
                          Tamu {inv.guestId.slice(0, 8)}
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-0.5">
                          {inv.shortLink || inv.guestId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#64748b]">{inv.templateId || 'Default'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            inv.channel === 'whatsapp'
                              ? 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/30'
                              : inv.channel === 'email'
                                ? 'bg-[#dbeafe] text-[#1e3a5f] border-[#3b82f6]/30'
                                : 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              inv.channel === 'whatsapp' ? 'bg-[#10b981]' : inv.channel === 'email' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]'
                            )}
                          />
                          {inv.channel === 'whatsapp' ? 'WA' : inv.channel === 'email' ? 'Email' : 'Keduanya'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            cfg.badgeClass
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.sentAt ? (
                          <span className="font-mono text-xs text-[#64748b]">{new Date(inv.sentAt).toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status !== 'pending' && inv.status !== 'revoked' ? (
                          <button
                            onClick={() => openQrModal(inv)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#4f46e5] hover:text-[#6366f1] transition-colors"
                          >
                            <QrCode size={14} />
                            Lihat QR
                          </button>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">Belum dibuat</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {inv.status === 'failed' && (
                            <button
                              onClick={() => handleResend(inv)}
                              disabled
                              className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors"
                              title="Kirim Ulang"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                          {inv.status !== 'revoked' && inv.status !== 'pending' && (
                            <button
                              onClick={() => openQrModal(inv)}
                              className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] hover:text-[#4f46e5] transition-colors"
                              title="Lihat QR"
                            >
                              <QrCode size={15} />
                            </button>
                          )}
                          {inv.status !== 'revoked' && (
                            <button
                              onClick={() => openSendModal([inv.guestId])}
                              className="p-1.5 rounded-md hover:bg-[#ecfdf5] text-[#64748b] hover:text-[#059669] transition-colors"
                              title="Kirim WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                          )}
                          {inv.status !== 'revoked' && (
                            <button
                              onClick={() => openRevokeModal(inv)}
                              className="p-1.5 rounded-md hover:bg-[#ffe4e6] text-[#64748b] hover:text-[#f43f5e] transition-colors"
                              title="Cabut Undangan"
                            >
                              <X size={15} />
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
            <p className="text-[#94a3b8] text-sm">Tidak ada undangan yang sesuai</p>
          </div>
        )}
      </div>

      {/* ── WhatsApp Send Modal ── */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Kirim WhatsApp</DialogTitle>
            <DialogDescription>
              Kirim pesan ke {sendTargetIds.length} tamu dari acara aktif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {missingTargetPhones.length > 0 && (
              <div className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-xs text-[#9a3412]">
                {missingTargetPhones.length} tamu belum memiliki nomor WhatsApp. Lengkapi data tamu sebelum mengirim.
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Template WhatsApp</label>
              {whatsappTemplates.length > 0 ? (
                <Select value={sendTemplateId} onValueChange={setSendTemplateId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih template WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1.5 rounded-lg bg-[#fff7ed] px-3 py-2 text-xs text-[#9a3412]">
                  Belum ada template WhatsApp aktif. Buat template di menu Template Komunikasi.
                </p>
              )}
            </div>
            {sendTemplateId && (
              <p className="rounded-lg bg-[#f8fafc] px-3 py-3 text-xs leading-5 text-[#64748b]">
                {whatsappTemplates.find((template) => template.id === sendTemplateId)?.body}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>Batal</Button>
            <Button
              onClick={handleSendSelectedWhatsApp}
              disabled={!sendTemplateId || missingTargetPhones.length > 0 || isSendingWhatsApp}
              className="gap-2"
            >
              {isSendingWhatsApp && <Loader2 size={14} className="animate-spin" />}
              Kirim WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Code Preview Modal ── */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Kode QR Undangan</DialogTitle>
            <DialogDescription className="text-sm text-[#64748b]">
              {qrInvitation ? `Tamu ${qrInvitation.guestId.slice(0, 8)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrInvitation && (
              <>
                <div className="border-4 border-[#e2e8f0] dark:border-[#334155] rounded-2xl p-4 bg-white">
                  <QRCodeSVG code={qrInvitation.qrCodeUrl || qrInvitation.id} size={200} />
                </div>
                <p className="text-xs text-[#94a3b8] mt-3">Scan untuk check-in</p>
                <div className="mt-4 text-center space-y-1">
                  <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">
                    Undangan Digital
                  </p>
                  <p className="text-xs text-[#64748b]">
                    Dikirim via {qrInvitation.channel === 'whatsapp' ? 'WhatsApp' : qrInvitation.channel === 'email' ? 'Email' : 'Keduanya'}
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    Dibuat pada {qrInvitation.createdAt ? new Date(qrInvitation.createdAt).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} />
              Unduh QR
            </Button>
            <Button size="sm" disabled onClick={() => qrInvitation && handleResend(qrInvitation)}>
              <Send size={14} />
              Kirim Ulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Batch Generate Modal ── */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Generate Undangan Massal</DialogTitle>
          </DialogHeader>

          {batchStep === 1 && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] mb-3">
                Pilih Penerima
              </p>
              {batchCandidates.length > 0 ? (
                <div className="border border-[#e2e8f0] dark:border-[#334155] rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                  {batchCandidates.map((guest) => (
                      <label
                        key={guest.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f5f9] dark:border-[#334155] last:border-b-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={batchGuests.includes(guest.id)}
                          onChange={(e) => {
                            setBatchGuests((prev) =>
                              e.target.checked
                                ? [...prev, guest.id]
                                : prev.filter((id) => id !== guest.id)
                            );
                          }}
                          className="rounded border-[#cbd5e1]"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">
                            {guest.fullName}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {guest.phone || guest.email || 'Kontak belum diisi'}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-[#94a3b8] text-center py-6">
                  Semua tamu sudah menerima undangan
                </p>
              )}
            </div>
          )}

          {batchStep === 2 && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc] mb-2 block">
                  Channel Pengiriman
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
                    { value: 'email', label: 'Email', icon: <Mail size={16} /> },
                  ].map((ch) => (
                    <button
                      key={ch.value}
                      onClick={() => setBatchChannel(ch.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        batchChannel === ch.value
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
                  Template
                </label>
                <Select value={batchTemplateId} onValueChange={setBatchTemplateId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih template WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {whatsappTemplates.length === 0 && (
                  <p className="text-xs text-[#b45309]">Belum ada template WhatsApp aktif.</p>
                )}
              </div>
            </div>
          )}

          {batchStep === 3 && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto">
                <Check size={28} className="text-[#10b981]" />
              </div>
              <p className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc]">
                {batchGuests.length} undangan akan dikirim
              </p>
              <p className="text-sm text-[#64748b]">
                via {batchChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} menggunakan {whatsappTemplates.find((template) => template.id === batchTemplateId)?.name || 'template terpilih'}
              </p>
            </div>
          )}

          <DialogFooter>
            {batchStep > 1 && (
              <Button variant="ghost" onClick={() => setBatchStep(batchStep - 1)}>
                Kembali
              </Button>
            )}
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>
              Batal
            </Button>
            {batchStep < 3 ? (
              <Button
                onClick={() => setBatchStep(batchStep + 1)}
                disabled={batchStep === 1 && batchGuests.length === 0}
              >
                Lanjut
              </Button>
            ) : (
              <Button onClick={sendBatch}>
                <Send size={14} />
                Generate dan Kirim
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revoke Confirmation Modal ── */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Cabut Undangan</DialogTitle>
            <DialogDescription className="text-sm text-[#64748b]">
              Undangan untuk{' '}
              <span className="font-medium text-[#1e293b]">Tamu {revokeTarget?.guestId.slice(0, 8)}</span>{' '}
              akan dicabut. QR code tidak akan berfungsi lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRevokeModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmRevoke}>
              <Trash2 size={14} />
              Cabut Undangan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
