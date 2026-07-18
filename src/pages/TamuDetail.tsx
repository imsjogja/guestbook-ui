import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  QrCode,
  Download,
  Loader2,
  RefreshCw,
  Send,
  ClipboardCheck,
  ScanLine,
  Edit3,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idID } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getGuestInitials } from '@/lib/normalizers';
import { QRCodeSVG, downloadQRCodeSvg } from '@/components/QRCodeSVG';
import { useEventAccess, useGuestDetail, useInvitations, useRSVP, useTemplates, useWhatsAppMessaging } from '@/hooks';
import { useTenantStore } from '@/store/tenantStore';
import { toast } from 'sonner';
import type { Template } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Types ─── */
interface RSVPDetail {
  status: 'attending' | 'not_attending' | 'maybe' | 'no_response';
  respondedAt?: string | null;
  respondedVia?: string;
  guestCount?: number;
  message?: string;
}

type EditableRSVPStatus = 'attending' | 'not_attending' | 'maybe';

interface CheckinRecord {
  eventId?: string;
  checkedInAt: string;
  seatAssignment?: string;
  checkinMethod: string;
}

/* ─── Config ─── */
const rsvpConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode; desc: string }> = {
  'attending': { label: 'Hadir', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]', icon: <CheckCircle2 size={20} />, desc: 'Tamu telah mengkonfirmasi kehadiran' },
  'not_attending': { label: 'Tidak Hadir', bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]', icon: <XCircle size={20} />, desc: 'Tamu tidak dapat hadir' },
  'maybe': { label: 'Mungkin', bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', border: 'border-[#fcd34d]', icon: <HelpCircle size={20} />, desc: 'Tamu belum memutuskan' },
  'no_response': { label: 'Belum Membalas', bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', border: 'border-[#e2e8f0]', icon: <Clock size={20} />, desc: 'Menunggu respons tamu' },
};

const deliveryStatusLabels: Record<string, string> = {
  not_sent: 'Belum Dikirim',
  queued: 'Dalam Antrean',
  sent: 'Diterima Provider',
  delivered: 'Tersampaikan',
  read: 'Dibaca',
  failed: 'Gagal',
};

const invitationStatusLabels: Record<string, string> = {
  draft: 'Draft',
  opened: 'Dibuka',
  responded: 'Sudah RSVP',
  expired: 'Kedaluwarsa',
  revoked: 'Dicabut',
};

const typeConfig: Record<string, { bg: string; text: string }> = {
  'vip': { bg: 'bg-[#eef2ff]', text: 'text-[#4f46e5]' },
  'vvip': { bg: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
  'family': { bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]' },
  'friend': { bg: 'bg-[#d1fae5]', text: 'text-[#059669]' },
  'colleague': { bg: 'bg-[#dbeafe]', text: 'text-[#1e3a5f]' },
  'partner': { bg: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
  'other': { bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]' },
};

/* ─── Tabs ─── */
const TABS = [
  { key: 'ringkasan', label: 'Ringkasan', icon: <User size={16} /> },
  { key: 'rsvp', label: 'RSVP', icon: <ClipboardCheck size={16} /> },
  { key: 'undangan', label: 'Undangan', icon: <Mail size={16} /> },
  { key: 'checkin', label: 'Check-in', icon: <ScanLine size={16} /> },
];

/* ─── Skeleton Components ─── */
function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[#e2e8f0] dark:bg-[#334155] rounded', className)} />;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <SkeletonPulse className="h-4 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <SkeletonPulse className="h-4 w-2/3" />
    </div>
  );
}

/* ─── Component ─── */
export default function TamuDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ringkasan');
  const currentEvent = useTenantStore((s) => s.currentEvent);
  const currentEventId = currentEvent?.id;
  const { access, isLoading: isLoadingAccess } = useEventAccess();
  const {
    invitations,
    createInvitation,
    error: invitationError,
    isLoading: isLoadingInvitations,
  } = useInvitations(currentEventId);
  const { rsvps, saveRSVPForGuest } = useRSVP(currentEventId);
  const { templates } = useTemplates();
  const { sendWhatsApp, isSending: isSendingWhatsApp } = useWhatsAppMessaging();
  const [showRsvpEdit, setShowRsvpEdit] = useState(false);
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState<EditableRSVPStatus>('attending');
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState('');

  const { guest, isLoading, error } = useGuestDetail(id);
  const invitation = useMemo(
    () => invitations.find((inv) => inv.guestId === guest?.id) ?? null,
    [invitations, guest?.id]
  );
  const rsvpRecord = useMemo(
    () => rsvps.find((item) => item.guestId === guest?.id) ?? null,
    [rsvps, guest?.id]
  );
  const rsvp = rsvpRecord as RSVPDetail | null;
  const rsvpCfg = rsvp ? rsvpConfig[rsvp.status] || rsvpConfig['no_response'] : rsvpConfig['no_response'];
  const invitationCode = invitation?.qrCodeUrl || invitation?.shortLink || invitation?.id || '';
  const invitationLabel = invitation ? `Tamu ${guest?.fullName ?? ''}` : 'Belum ada undangan';
  const canReadInvitations = access?.permissions.includes('invitation:read') ?? false;
  const canWriteInvitations = access?.permissions.includes('invitation:write') ?? false;
  const whatsappTemplates = useMemo(
    () => templates.filter((template: Template) => template.channel === 'whatsapp' && template.isActive),
    [templates]
  );
  const roleLabel: Record<string, string> = {
    tenant_owner: 'Tenant Owner',
    event_manager: 'Event Manager',
    rsvp_officer: 'RSVP Officer',
    registration_officer: 'Registration Officer',
    usher: 'Usher',
    gift_officer: 'Gift Officer',
    viewer: 'Viewer',
  };

  const openRsvpEdit = () => {
    setSelectedRsvpStatus(rsvp?.status === 'not_attending' || rsvp?.status === 'maybe' ? rsvp.status : 'attending');
    setShowRsvpEdit(true);
  };

  const handleSaveRsvp = async () => {
    if (!guest) {
      toast.error('Data tamu belum siap');
      return;
    }

    setIsSavingRsvp(true);
    try {
      let activeInvitation = invitation;
      if (!activeInvitation) {
        if (!canWriteInvitations) {
          throw new Error('RSVP belum dapat disimpan karena tamu belum memiliki undangan dan role Anda tidak dapat membuat undangan');
        }
        activeInvitation = await createInvitation({ guestId: guest.id });
        if (!activeInvitation) {
          throw new Error('Gagal menyiapkan undangan untuk RSVP. Pastikan tamu terdaftar pada acara aktif.');
        }
      }

      const saved = await saveRSVPForGuest(guest.id, {
        status: selectedRsvpStatus,
        guestCount: selectedRsvpStatus === 'not_attending' ? 0 : rsvpRecord?.guestCount || 1,
      });
      toast.success(saved ? 'Status RSVP disimpan' : 'Status RSVP diperbarui');
      setShowRsvpEdit(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui RSVP';
      toast.error(msg);
    } finally {
      setIsSavingRsvp(false);
    }
  };

  const handleDownloadQr = () => {
    if (!guest || !invitationCode) {
      toast.error('QR code belum tersedia');
      return;
    }

    downloadQRCodeSvg(invitationCode, `qr-guest-${guest.id}.svg`);
  };

  const handleCopyInvitationLink = async () => {
    if (!invitationCode) {
      toast.error('Link undangan belum tersedia');
      return;
    }

    try {
      await navigator.clipboard.writeText(invitationCode);
      toast.success('Link undangan disalin');
    } catch {
      toast.error('Gagal menyalin link undangan');
    }
  };

  const handleCreateInvitation = async () => {
    if (!guest) return;
    if (!currentEventId) {
      toast.error('Pilih acara aktif terlebih dahulu');
      return;
    }
    if (isLoadingAccess || !access) {
      toast.error('Akses acara sedang dimuat, coba lagi sebentar');
      return;
    }
    if (!canWriteInvitations) {
      toast.error('Role Anda tidak memiliki akses untuk membuat undangan');
      return;
    }
    setIsCreatingInvitation(true);
    try {
      const created = await createInvitation({ guestId: guest.id });
      if (created) {
        toast.success('Undangan berhasil dibuat');
      } else {
        toast.error('Gagal membuat undangan. Pastikan tamu terdaftar pada acara aktif dan role memiliki akses.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat undangan';
      toast.error(msg);
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const openWhatsAppModal = () => {
    if (!guest?.phone?.trim()) {
      toast.error('Nomor WhatsApp tamu belum diisi');
      return;
    }
    setSelectedWhatsAppTemplate(whatsappTemplates[0]?.id || '');
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!guest) return;
    try {
      await sendWhatsApp({ guest_ids: [guest.id], template_id: selectedWhatsAppTemplate });
      toast.success('WhatsApp berhasil dikirim');
      setIsWhatsAppModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim WhatsApp');
    }
  };

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOutExpo }}
        className="space-y-6"
      >
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-9 w-9 rounded-lg" />
          <SkeletonPulse className="h-4 w-40" />
        </div>
        {/* Profile header skeleton */}
        <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-4">
            <SkeletonPulse className="w-16 h-16 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <SkeletonPulse className="h-6 w-48" />
              <SkeletonPulse className="h-4 w-64" />
            </div>
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="border-b border-[#e2e8f0] dark:border-[#334155]">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <div key={tab.key} className="px-4 py-2.5">
                <SkeletonPulse className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
            <SkeletonBlock />
          </div>
          <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
            <SkeletonBlock />
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Error State ── */
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
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] transition-all"
        >
          <RefreshCw size={15} />
          Muat Ulang
        </button>
      </motion.div>
    );
  }

  /* ── Not Found State ── */
  if (!guest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOutExpo }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
          <User size={32} className="text-[#94a3b8]" />
        </div>
        <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-2">Tamu tidak ditemukan</h2>
        <p className="text-sm text-[#64748b] mb-4">ID tamu tidak valid atau data telah dihapus.</p>
        <button
          onClick={() => navigate('/tamu')}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] transition-all"
        >
          <ArrowLeft size={15} />
          Kembali ke Daftar Tamu
        </button>
      </motion.div>
    );
  }

  const checkins = (guest.checkins || []).map((ci) => ({
    eventId: (ci as unknown as Record<string, unknown>).eventId as string | undefined,
    checkedInAt: ci.checkedInAt,
    seatAssignment: ci.seatAssignment,
    checkinMethod: ci.checkinMethod,
  })) as CheckinRecord[];
  const typeKey = guest.category || 'other';
  const typeLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
      className="space-y-6"
    >
      {/* ── Breadcrumb + Back ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tamu')}
          className="p-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#64748b] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1 text-sm text-[#94a3b8]">
          <span className="hover:text-[#4f46e5] cursor-pointer" onClick={() => navigate('/tamu')}>Tamu</span>
          <ChevronRight size={14} />
          <span className="text-[#0f172a] dark:text-[#f8fafc] font-medium">{guest.fullName}</span>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {getGuestInitials(guest.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[#0f172a] dark:text-[#f8fafc]">{guest.fullName}</h1>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeConfig[typeKey]?.bg || 'bg-[#f1f5f9]', typeConfig[typeKey]?.text || 'text-[#64748b]')}>
                {typeLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
              {guest.email && <span className="flex items-center gap-1.5"><Mail size={14} />{guest.email}</span>}
              {guest.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{guest.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[#e2e8f0] dark:border-[#334155]">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg',
                activeTab === tab.key
                  ? 'text-[#4f46e5]'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
              )}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tamuDetailTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f46e5] rounded-full"
                  transition={{ duration: 0.2, ease: easeOutExpo }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {/* ═══════ Tab: Ringkasan ═══════ */}
        {activeTab === 'ringkasan' && (
          <motion.div key="ringkasan"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: easeOutExpo }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc]">Informasi Pribadi</h3>
                <button className="text-xs text-[#4f46e5] hover:underline font-medium flex items-center gap-1">
                  <Edit3 size={12} /> Ubah
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Nama Lengkap</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">{guest.fullName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">{guest.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Telepon</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc] font-mono">{guest.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">ID Tamu</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc] font-mono">{guest.id}</p>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Klasifikasi</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Tipe Tamu</p>
                  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', typeConfig[typeKey]?.bg, typeConfig[typeKey]?.text)}>
                    {typeLabel}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Subgrup</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">{guest.subgroup || '-'}</p>
                </div>
                {guest.dietaryRestrictions && (
                  <div>
                    <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Restriksi Makanan</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fef3c7] text-[#b45309] border border-[#fcd34d]">
                      <AlertTriangle size={12} className="mr-1" />
                      {guest.dietaryRestrictions}
                    </span>
                  </div>
                )}
                {guest.plusOne && (
                  <div>
                    <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Plus One</p>
                    <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">{guest.plusOneName || 'Ya'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="lg:col-span-2 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-[#94a3b8]" />
                Catatan
              </h3>
              <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-4 border border-[#e2e8f0] dark:border-[#334155]">
                <p className="text-sm text-[#64748b] italic">{guest.notes || 'Tidak ada catatan'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ Tab: RSVP ═══════ */}
        {activeTab === 'rsvp' && (
          <motion.div key="rsvp"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: easeOutExpo }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSVP Status */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-6">Status RSVP</h3>
              <div className="flex flex-col items-center text-center">
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-3', rsvpCfg.bg)}>
                  <span className={rsvpCfg.text}>{rsvpCfg.icon}</span>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border mb-2', rsvpCfg.bg, rsvpCfg.text, rsvpCfg.border)}>
                  {rsvpCfg.label}
                </span>
                <p className="text-xs text-[#64748b] mb-4">{rsvpCfg.desc}</p>
                {rsvp?.respondedAt && (
                  <div className="w-full space-y-2 text-left bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-4">
                    <p className="text-xs text-[#94a3b8]">
                      Direspons pada {format(new Date(rsvp.respondedAt), 'd MMM yyyy, HH:mm', { locale: idID })}
                    </p>
                    {rsvp.respondedVia && (
                      <p className="text-xs text-[#94a3b8]">Via {rsvp.respondedVia}</p>
                    )}
                  </div>
                )}
                {!rsvp?.respondedAt && (
                  <div className="w-full text-left bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-4">
                    <p className="text-xs text-[#94a3b8]">Belum ada respons</p>
                  </div>
                )}
              </div>
            </div>

            {/* RSVP Details */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Detail Kehadiran</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Jumlah Tamu</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">
                    {rsvp?.guestCount ? `${rsvp.guestCount} orang` : '-'}
                  </p>
                </div>
                {rsvp?.message && (
                  <div>
                    <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Pesan dari Tamu</p>
                    <blockquote className="text-sm text-[#64748b] italic border-l-2 border-[#e2e8f0] pl-3 py-1">
                      &ldquo;{rsvp.message}&rdquo;
                    </blockquote>
                  </div>
                )}
                {!rsvp && (
                  <p className="text-sm text-[#94a3b8]">Belum ada data RSVP.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-2 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Tindakan</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openRsvpEdit}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all"
                >
                  <Edit3 size={15} />
                  Ubah Status RSVP
                </button>
                <button
                  onClick={openWhatsAppModal}
                  disabled={!guest?.phone?.trim()}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                  Kirim WhatsApp
                </button>
                {!guest?.phone?.trim() && (
                  <p className="basis-full text-xs text-[#b45309]">Isi nomor WhatsApp tamu terlebih dahulu untuk mengaktifkan pengiriman.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ Tab: Undangan ═══════ */}
        {activeTab === 'undangan' && (
          <motion.div key="undangan"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: easeOutExpo }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invitation History */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc]">Riwayat Undangan</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">Acara: {currentEvent?.name || 'Belum dipilih'}</p>
                </div>
                {access?.role && (
                  <span className="shrink-0 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] px-2.5 py-1 text-[11px] font-medium text-[#64748b]">
                    {roleLabel[access.role] || access.role}
                  </span>
                )}
              </div>
              {isLoadingAccess || isLoadingInvitations ? (
                <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-6 text-center border border-[#e2e8f0] dark:border-[#334155]">
                  <Loader2 size={24} className="mx-auto text-[#4f46e5] mb-2 animate-spin" />
                  <p className="text-sm text-[#64748b]">Memeriksa akses undangan...</p>
                </div>
              ) : !canReadInvitations ? (
                <div className="bg-[#fff7ed] dark:bg-[#2a211b] rounded-lg p-5 border border-[#fed7aa] dark:border-[#7c2d12]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#c2410c]" />
                    <div>
                      <p className="text-sm font-medium text-[#9a3412] dark:text-[#fdba74]">Akses undangan tidak tersedia</p>
                      <p className="text-xs text-[#c2410c] dark:text-[#fdba74] mt-1">
                        Role {roleLabel[access?.role || ''] || 'Anda'} tidak memiliki izin untuk membaca atau membuat undangan pada acara ini.
                      </p>
                      <p className="text-xs text-[#c2410c] dark:text-[#fdba74] mt-2">
                        Gunakan RSVP Officer, Event Manager, atau Tenant Owner untuk mengelola undangan.
                      </p>
                    </div>
                  </div>
                </div>
              ) : invitation ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#1e293b] p-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Status Delivery</p>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        invitation.deliveryStatus === 'failed'
                          ? 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
                          : invitation.deliveryStatus === 'not_sent'
                            ? 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'
                            : 'bg-[#d1fae5] text-[#059669] border-[#a7f3d0]'
                      )}>
                        {invitation.deliveryStatus === 'failed' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        {deliveryStatusLabels[invitation.deliveryStatus] || invitation.deliveryStatus}
                      </span>
                      {invitation.deliveryProviderHttpStatus && (
                        <p className="mt-1 text-[11px] text-[#94a3b8]">
                          Bukti provider: HTTP {invitation.deliveryProviderHttpStatus}
                        </p>
                      )}
                      {invitation.deliveryStatus === 'sent' && !invitation.deliveryProviderHttpStatus && (
                        <p className="mt-1 text-[11px] text-[#b45309]">
                          Receipt provider belum tercatat pada data lama
                        </p>
                      )}
                      {invitation.deliveryErrorMessage && (
                        <p className="mt-1 text-[11px] text-[#be123c]">{invitation.deliveryErrorMessage}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Lifecycle Undangan</p>
                      <p className="text-sm text-[#0f172a] dark:text-[#f8fafc]">
                        {invitationStatusLabels[invitation.status] || invitation.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Link Undangan</p>
                      <p className="text-sm text-[#0f172a] dark:text-[#f8fafc] break-all font-mono">{invitationCode || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Kanal</p>
                        <p className="text-[#0f172a] dark:text-[#f8fafc]">
                          {invitation.channel === 'whatsapp' ? 'WhatsApp' : invitation.channel === 'email' ? 'Email' : 'Keduanya'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">Dibuat</p>
                        <p className="text-[#0f172a] dark:text-[#f8fafc]">
                          {invitation.createdAt ? format(new Date(invitation.createdAt), 'd MMM yyyy, HH:mm', { locale: idID }) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : invitationError ? (
                <div className="bg-[#fff7ed] dark:bg-[#2a211b] rounded-lg p-5 border border-[#fed7aa] dark:border-[#7c2d12]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#c2410c]" />
                    <div>
                      <p className="text-sm font-medium text-[#9a3412] dark:text-[#fdba74]">Undangan belum dapat dimuat</p>
                      <p className="text-xs text-[#c2410c] dark:text-[#fdba74] mt-1">{invitationError}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-6 text-center border border-[#e2e8f0] dark:border-[#334155]">
                  <Mail size={24} className="mx-auto text-[#94a3b8] mb-2" />
                  <p className="text-sm text-[#64748b]">Belum ada riwayat undangan</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Kode QR</h3>
              <div className="flex flex-col items-center">
                {isLoadingAccess || isLoadingInvitations ? (
                  <div className="w-full rounded-xl border border-dashed border-[#e2e8f0] py-12 text-center">
                    <Loader2 size={40} className="mx-auto text-[#4f46e5] mb-3 animate-spin" />
                    <p className="text-sm text-[#64748b]">Memeriksa akses undangan...</p>
                  </div>
                ) : !canReadInvitations ? (
                  <div className="w-full rounded-xl border border-dashed border-[#fed7aa] bg-[#fff7ed] dark:bg-[#2a211b] py-10 px-5 text-center">
                    <AlertTriangle size={40} className="mx-auto text-[#c2410c] mb-3" />
                    <p className="text-sm font-medium text-[#9a3412] dark:text-[#fdba74]">QR tidak dapat diakses</p>
                    <p className="text-xs text-[#c2410c] dark:text-[#fdba74] mt-1">Pilih akun dengan akses undangan untuk membuat atau melihat QR.</p>
                  </div>
                ) : invitationCode ? (
                  <>
                    <div className="w-[220px] min-h-[220px] bg-white rounded-xl border-2 border-dashed border-[#e2e8f0] flex flex-col items-center justify-center gap-3 mb-4 p-4">
                      <QRCodeSVG code={invitationCode} size={200} />
                      <span className="text-[10px] text-[#94a3b8] font-mono text-center break-all">{invitationLabel}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-4">Scan untuk check-in</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={handleDownloadQr}
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors"
                      >
                        <Download size={14} />
                        Unduh QR
                      </button>
                      <button
                        onClick={handleCopyInvitationLink}
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                      >
                        <QrCode size={14} />
                        Salin Link
                      </button>
                    </div>
                  </>
                ) : canWriteInvitations ? (
                  <div className="w-full rounded-xl border border-dashed border-[#e2e8f0] py-12 text-center">
                    <QrCode size={40} className="mx-auto text-[#94a3b8] mb-3" />
                    <p className="text-sm text-[#64748b]">QR code belum tersedia</p>
                    <p className="text-xs text-[#94a3b8] mt-1">Buat undangan terlebih dahulu untuk tamu ini.</p>
                    <button
                      onClick={handleCreateInvitation}
                      disabled={!guest || isCreatingInvitation}
                      className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] disabled:opacity-60"
                    >
                      {isCreatingInvitation ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                      Buat Undangan
                    </button>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] dark:bg-[#1e293b] py-10 px-5 text-center">
                    <QrCode size={40} className="mx-auto text-[#94a3b8] mb-3" />
                    <p className="text-sm font-medium text-[#475569] dark:text-[#cbd5e1]">Belum ada undangan</p>
                    <p className="text-xs text-[#64748b] mt-1">Role Anda hanya dapat membaca data. Minta RSVP Officer atau Event Manager membuat undangan.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ Tab: Check-in ═══════ */}
        {activeTab === 'checkin' && (
          <motion.div key="checkin"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: easeOutExpo }}
            className="space-y-6">
            {/* Check-in Status */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Status Check-in</h3>
              {checkins.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-[#059669]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#059669]">Sudah Check-in</p>
                    <p className="text-xs text-[#64748b]">
                      {format(new Date(checkins[0].checkedInAt), 'd MMM yyyy, HH:mm', { locale: idID })}
                      {' '}WIB
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Metode: {checkins[0].checkinMethod}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                    <Clock size={24} className="text-[#94a3b8]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#64748b]">Belum Check-in</p>
                    <p className="text-xs text-[#94a3b8]">Tamu belum melakukan check-in</p>
                  </div>
                </div>
              )}
            </div>

            {/* Check-in History */}
            <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Riwayat Check-in</h3>
              <div className="overflow-hidden rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f8fafc] dark:bg-[#1e293b]">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Acara</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tanggal Check-in</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Meja</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((ci, i) => (
                      <tr key={i} className="border-t border-[#f1f5f9] dark:border-[#334155]">
                        <td className="px-4 py-3 text-sm text-[#0f172a] dark:text-[#f8fafc]">{ci.eventId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">
                          {format(new Date(ci.checkedInAt), 'd MMM yyyy, HH:mm', { locale: idID })}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{ci.seatAssignment || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#d1fae5] text-[#059669] border border-[#a7f3d0]">
                            <ScanLine size={11} />
                            {ci.checkinMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {checkins.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-sm text-[#64748b]">
                          Belum ada riwayat check-in
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRsvpEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-sm"
            onClick={() => !isSavingRsvp && setShowRsvpEdit(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_24px_48px_rgba(15,23,42,0.16)] z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
              <h3 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Ubah Status RSVP</h3>
              <p className="text-sm text-[#64748b] mt-1">{guest.fullName}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Status</label>
                <select
                  value={selectedRsvpStatus}
                  onChange={(e) => setSelectedRsvpStatus(e.target.value as EditableRSVPStatus)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5]"
                >
                  <option value="attending">Hadir</option>
                  <option value="not_attending">Tidak Hadir</option>
                  <option value="maybe">Tentatif</option>
                </select>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Perubahan ini akan disimpan ke data RSVP event aktif.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
              <button
                onClick={() => setShowRsvpEdit(false)}
                disabled={isSavingRsvp}
                className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRsvp}
                disabled={isSavingRsvp}
                className={cn(
                  'h-10 px-6 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  isSavingRsvp ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed' : 'bg-[#4f46e5] text-white hover:bg-[#6366f1]'
                )}
              >
                {isSavingRsvp && <Loader2 size={16} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Kirim WhatsApp</DialogTitle>
            <DialogDescription>
              Kirim pesan ke {guest?.fullName || 'tamu'} melalui provider WhatsApp yang terhubung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Nomor tujuan</label>
              <p className="mt-1 text-sm text-[#64748b]">{guest?.phone || 'Nomor belum diisi'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Template</label>
              {whatsappTemplates.length > 0 ? (
                <Select value={selectedWhatsAppTemplate} onValueChange={setSelectedWhatsAppTemplate}>
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
            {selectedWhatsAppTemplate && (
              <Textarea
                readOnly
                value={whatsappTemplates.find((template) => template.id === selectedWhatsAppTemplate)?.body || ''}
                className="min-h-[120px] bg-[#f8fafc] text-sm"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>Batal</Button>
            <Button onClick={handleSendWhatsApp} disabled={!selectedWhatsAppTemplate || isSendingWhatsApp} className="gap-2">
              {isSendingWhatsApp && <Loader2 size={14} className="animate-spin" />}
              Kirim WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
