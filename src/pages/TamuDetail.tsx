import { useState } from 'react';
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
import { useGuestDetail } from '@/hooks';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Types ─── */
interface RSVPDetail {
  status: 'attending' | 'not_attending' | 'maybe' | 'no_response';
  respondedAt?: string | null;
  respondedVia?: string;
  guestCount?: number;
  message?: string;
}

interface InvitationRecord {
  channel: 'whatsapp' | 'email' | 'both';
  status: string;
  sentAt?: string | null;
}

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

  const { guest, isLoading, error } = useGuestDetail(id);

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

  /* ── Map related data ── */
  const rsvp = guest.rsvp as RSVPDetail | undefined;
  const rsvpCfg = rsvp ? rsvpConfig[rsvp.status] || rsvpConfig['no_response'] : rsvpConfig['no_response'];
  const invitations = (guest.invitations || []) as InvitationRecord[];
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
            {guest.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all">
                  <Edit3 size={15} />
                  Ubah Status RSVP
                </button>
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
                  <Send size={15} />
                  Kirim Reminder
                </button>
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
              <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-4">Riwayat Undangan</h3>
              {invitations.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8fafc] dark:bg-[#1e293b]">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Kanal</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((inv, i) => (
                        <tr key={i} className="border-t border-[#f1f5f9] dark:border-[#334155]">
                          <td className="px-4 py-3 text-sm text-[#0f172a] dark:text-[#f8fafc]">
                            {inv.channel === 'whatsapp' ? 'WhatsApp' : inv.channel === 'email' ? 'Email' : 'Keduanya'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-sm text-[#059669]">
                              <CheckCircle2 size={14} /> {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#64748b]">
                            {inv.sentAt ? format(new Date(inv.sentAt), 'd MMM yyyy, HH:mm', { locale: idID }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div className="w-[200px] h-[200px] bg-white rounded-xl border-2 border-dashed border-[#e2e8f0] flex flex-col items-center justify-center gap-3 mb-4">
                  <QrCode size={80} className="text-[#0f172a]" />
                  <span className="text-[10px] text-[#94a3b8] font-mono">GF-{guest.id}-2025</span>
                </div>
                <p className="text-xs text-[#94a3b8] mb-4">Scan untuk check-in</p>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
                    <Download size={14} />
                    Unduh QR
                  </button>
                  <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                    <RefreshCw size={14} />
                    Buat Ulang
                  </button>
                </div>
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
    </motion.div>
  );
}
