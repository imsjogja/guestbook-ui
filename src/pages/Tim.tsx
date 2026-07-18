import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Settings,
  Users,
  Shield,
  Eye,
  Clock,
  Trash2,
  Crown,
  ScanLine,
  ClipboardCheck,
  Gift,
  UserCog,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeam, useTenantAccess } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { TeamMember, TenantRole } from '@/types';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

type MemberStatus = 'active' | 'pending' | 'inactive';

const roleOptions: TenantRole[] = [
  'event_manager',
  'rsvp_officer',
  'registration_officer',
  'usher',
  'gift_officer',
  'viewer',
];
const allRoles: TenantRole[] = ['tenant_owner', ...roleOptions];

const roleConfig: Record<TenantRole, { label: string; description: string; className: string; icon: React.ReactNode; can: string[]; cannot: string[] }> = {
  tenant_owner: {
    label: 'Tenant Owner',
    description: 'Pemilik workspace dengan akses penuh.',
    className: 'bg-[#4f46e5] text-white',
    icon: <Crown size={10} />,
    can: ['Akses penuh ke seluruh tenant', 'Mengelola anggota dan peran', 'Mengelola billing dan pengaturan'],
    cannot: [],
  },
  event_manager: {
    label: 'Event Manager',
    description: 'Mengelola acara dan seluruh operasional acara.',
    className: 'bg-[#6366f1] text-white',
    icon: <Shield size={10} />,
    can: ['Mengelola acara, tamu, RSVP, check-in, dan seating', 'Mengelola komunikasi dan laporan'],
    cannot: ['Mengelola anggota tenant'],
  },
  rsvp_officer: {
    label: 'RSVP Officer',
    description: 'Mengelola undangan, RSVP, dan komunikasi tamu.',
    className: 'bg-[#0ea5e9] text-white',
    icon: <ClipboardCheck size={10} />,
    can: ['Mengelola tamu, undangan, RSVP, dan komunikasi'],
    cannot: ['Mengelola check-in dan seating'],
  },
  registration_officer: {
    label: 'Registration Officer',
    description: 'Menangani registrasi dan proses check-in.',
    className: 'bg-[#10b981] text-white',
    icon: <ScanLine size={10} />,
    can: ['Melihat dan mengelola tamu', 'Memproses check-in dan walk-in'],
    cannot: ['Mengelola undangan dan RSVP'],
  },
  usher: {
    label: 'Usher',
    description: 'Membantu kedatangan tamu dan penempatan tempat duduk.',
    className: 'bg-[#14b8a6] text-white',
    icon: <UserCog size={10} />,
    can: ['Melihat status kedatangan tamu', 'Memproses check-in dan melihat seating'],
    cannot: ['Mengubah data tamu dan undangan'],
  },
  gift_officer: {
    label: 'Gift Officer',
    description: 'Menangani penerimaan hadiah dan souvenir.',
    className: 'bg-[#f59e0b] text-white',
    icon: <Gift size={10} />,
    can: ['Melihat data tamu untuk kebutuhan hadiah'],
    cannot: ['Mengelola check-in, RSVP, dan undangan'],
  },
  viewer: {
    label: 'Viewer',
    description: 'Akses baca untuk pemantauan dan laporan.',
    className: 'bg-[#64748b] text-white',
    icon: <Eye size={10} />,
    can: ['Melihat data dan laporan yang tersedia'],
    cannot: ['Mengubah data atau mengelola anggota'],
  },
};

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-[#d1fae5] text-[#059669] border-[#a7f3d0]' },
  pending: { label: 'Menunggu', className: 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]' },
  inactive: { label: 'Nonaktif', className: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]' },
};

function getInitials(name?: string | null) {
  return (name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Tim() {
  const { members, isLoading, error, refetch, inviteMember, updateRole, removeMember } = useTeam();
  const { access, isLoading: isLoadingAccess } = useTenantAccess();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('rsvp_officer');

  const canManageTeam = access?.permissions.includes('team:write') ?? false;

  const ensureCanManageTeam = () => {
    if (isLoadingAccess) {
      toast.info('Memeriksa akses pengelolaan tim');
      return false;
    }
    if (!canManageTeam) {
      toast.error('Hanya Tenant Owner yang dapat mengubah anggota dan peran tenant');
      return false;
    }
    return true;
  };

  const stats = {
    total: members.length,
    management: members.filter((m) => m.role === 'tenant_owner' || m.role === 'event_manager').length,
    rsvp: members.filter((m) => m.role === 'rsvp_officer').length,
    operational: members.filter((m) => m.role === 'registration_officer' || m.role === 'usher' || m.role === 'gift_officer').length,
    viewer: members.filter((m) => m.role === 'viewer').length,
    pending: members.filter((m) => m.status === 'pending').length,
  };

  const handleSendInvite = async () => {
    if (!ensureCanManageTeam()) return;
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Masukkan email yang valid');
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await inviteMember({ email: inviteEmail, role: inviteRole });
      if (success) {
        setInviteSent(true);
        toast.success('Undangan terkirim');
        setTimeout(() => {
          setIsInviteOpen(false);
          setInviteSent(false);
          setInviteEmail('');
          setInviteRole('rsvp_officer');
        }, 2000);
      } else {
        toast.error('Gagal mengirim undangan');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim undangan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!ensureCanManageTeam()) return;
    if (member.role === 'tenant_owner') {
      toast.error('Peran Tenant Owner tidak dapat dihapus');
      return;
    }
    if (!window.confirm(`Nonaktifkan akses ${member.user?.fullName || member.user?.email || 'anggota ini'}?`)) {
      return;
    }

    try {
      const success = await removeMember(member.id);
      if (success) {
        toast.success('Akses anggota berhasil dinonaktifkan');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menonaktifkan anggota');
    }
  };

  const openEditRole = (member: TeamMember) => {
    if (!ensureCanManageTeam()) return;
    if (member.role === 'tenant_owner') {
      toast.info('Peran Tenant Owner tidak dapat diubah');
      return;
    }
    setEditingMember(member);
    setIsEditRoleOpen(true);
  };

  const handleSaveRole = async () => {
    if (!ensureCanManageTeam()) return;
    if (!editingMember) return;
    setIsSubmitting(true);
    try {
      if (editingMember.role === 'tenant_owner') {
        toast.error('Peran Tenant Owner tidak dapat dipilih');
        return;
      }
      const success = await updateRole(editingMember.id, editingMember.role);
      if (success) {
        toast.success('Peran berhasil diperbarui');
        setIsEditRoleOpen(false);
      } else {
        toast.error('Gagal memperbarui peran');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui peran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle size={48} className="text-[#f43f5e] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Gagal memuat anggota tim</p>
        <p className="text-sm text-[#64748b] mb-4">{error}</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] font-bold text-[#0f172a] dark:text-[#f8fafc]">Tim</h1>
          <p className="text-sm text-[#64748b] mt-1">{stats.total} anggota tim</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRoleManagerOpen(true)}
            className="h-10 gap-2 border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b]"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Kelola Peran</span>
          </Button>
          <Button
            onClick={() => setIsInviteOpen(true)}
            disabled={isLoadingAccess || !canManageTeam}
            className="h-10 gap-2 bg-[#4f46e5] hover:bg-[#6366f1] text-white"
          >
            <UserPlus size={16} />
            Undang Anggota
          </Button>
        </div>
      </div>

      {!isLoadingAccess && !canManageTeam && (
        <div className="flex items-start gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p>Anda dapat melihat anggota dan katalog peran. Hanya Tenant Owner yang dapat mengundang anggota, mengubah peran, atau menonaktifkan akses.</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total Anggota', value: stats.total, icon: <Users size={16} />, color: 'text-[#64748b]', bg: 'bg-[#f8fafc] dark:bg-[#1e293b]' },
          { label: 'Manajemen', value: stats.management, icon: <Shield size={16} />, color: 'text-[#6366f1]', bg: 'bg-[#eef2ff]' },
          { label: 'RSVP', value: stats.rsvp, icon: <ClipboardCheck size={16} />, color: 'text-[#0284c7]', bg: 'bg-[#e0f2fe]' },
          { label: 'Operasional', value: stats.operational, icon: <ScanLine size={16} />, color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
          { label: 'Viewer', value: stats.viewer, icon: <Eye size={16} />, color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]' },
          { label: 'Menunggu', value: stats.pending, icon: <Clock size={16} />, color: 'text-[#94a3b8]', bg: 'bg-[#f1f5f9]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05, ease: easeOutExpo }}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#334155]', stat.bg)}
          >
            <span className={stat.color}>{stat.icon}</span>
            <div>
              <p className="text-[11px] font-medium text-[#94a3b8]">{stat.label}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-6 mt-0.5" />
              ) : (
                <p className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] font-mono leading-tight">{stat.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOutExpo }}
          className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-[#1e293b]">
                  {['Nama', 'Peran', 'Status', 'Bergabung', 'Aksi'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {members.map((member, index) => {
                    const role = roleConfig[member.role] || roleConfig.viewer;
                    const status = statusConfig[member.status as MemberStatus] || statusConfig.active;
                    return (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="border-t border-[#f1f5f9] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
                              {getInitials(member.user?.fullName || 'U')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">{member.user?.fullName || 'Unknown'}</p>
                              <p className="text-[11px] text-[#94a3b8]">{member.user?.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium',
                              role.className
                            )}
                          >
                            {role.icon}
                            {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border',
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-[#64748b]">
                            {member.acceptedAt ? new Date(member.acceptedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditRole(member)}
                              disabled={isLoadingAccess || !canManageTeam || member.role === 'tenant_owner'}
                              className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#64748b]"
                              title={member.role === 'tenant_owner' ? 'Role Tenant Owner tidak dapat diubah' : 'Ubah Peran'}
                            >
                              <Shield size={14} />
                            </button>
                            {member.role !== 'tenant_owner' && (
                              <button
                                onClick={() => handleDelete(member)}
                                disabled={isLoadingAccess || !canManageTeam}
                                className="p-1.5 rounded-md text-[#64748b] hover:text-[#f43f5e] hover:bg-[#ffe4e6] transition-colors"
                                title="Nonaktifkan"
                              >
                                <Trash2 size={14} />
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
        </motion.div>
      )}

      {/* Role Catalog Modal */}
      <Dialog open={isRoleManagerOpen} onOpenChange={setIsRoleManagerOpen}>
        <DialogContent className="max-w-[680px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              Kelola Peran
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Peran tenant menentukan akses dasar anggota. Penugasan role khusus acara dilakukan di menu Tim Acara.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {allRoles.map((role) => {
              const config = roleConfig[role];
              return (
                <div key={role} className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn('mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg', config.className)}>
                      {config.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1e293b] dark:text-[#f8fafc]">{config.label}</p>
                      <p className="mt-1 text-xs text-[#64748b]">{config.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {config.can.map((permission) => (
                      <div key={permission} className="flex items-start gap-2 text-xs text-[#475569] dark:text-[#cbd5e1]">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#10b981]" />
                        <span>{permission}</span>
                      </div>
                    ))}
                    {config.cannot.map((permission) => (
                      <div key={permission} className="flex items-start gap-2 text-xs text-[#94a3b8]">
                        <X size={13} className="mt-0.5 shrink-0" />
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              Undang Anggota Tim
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Kirim undangan bergabung ke tim Anda
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {inviteSent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-[#059669]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-1">
                  Undangan terkirim!
                </h3>
                <p className="text-sm text-[#64748b]">
                  Undangan telah dikirim ke {inviteEmail}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 mt-2"
              >
                <div>
                  <Label htmlFor="invite-email">Alamat Email <span className="text-[#f43f5e]">*</span></Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="mt-1.5 h-10"
                  />
                </div>

                <div>
                  <Label>Peran</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as TenantRole)}
                  >
                    <SelectTrigger className="mt-1.5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>{roleConfig[role].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Permission summary */}
                <div className="p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg space-y-2">
                  <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Ringkasan Izin</p>
                  <div className="space-y-1">
                    {roleConfig[inviteRole].can.map((p) => (
                      <div key={p} className="flex items-start gap-2 text-[12px]">
                        <CheckCircle2 size={12} className="text-[#10b981] mt-0.5 flex-shrink-0" />
                        <span className="text-[#1e293b] dark:text-[#f8fafc]">{p}</span>
                      </div>
                    ))}
                    {roleConfig[inviteRole].cannot.map((p) => (
                      <div key={p} className="flex items-start gap-2 text-[12px]">
                        <X size={12} className="text-[#94a3b8] mt-0.5 flex-shrink-0" />
                        <span className="text-[#94a3b8]">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!inviteSent && (
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-[#64748b]">
                Batal
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={isSubmitting}
                className="bg-[#4f46e5] hover:bg-[#6366f1] text-white gap-2"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Kirim Undangan
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              Ubah Peran — {editingMember?.user?.fullName || 'Anggota'}
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Peran saat ini: <span className="font-medium">{editingMember && roleConfig[editingMember.role]?.label}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Peran Baru</Label>
              {editingMember?.role === 'tenant_owner' ? (
                <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                  Peran Tenant Owner bersifat permanen dan tidak dapat diubah dari halaman ini.
                </div>
              ) : (
                <Select
                  value={editingMember?.role || 'viewer'}
                  onValueChange={(v) =>
                    setEditingMember((prev) => prev ? { ...prev, role: v as TenantRole } : null)
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>{roleConfig[role].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {editingMember && (
              <div className="p-3 bg-[#fef3c7] rounded-lg flex items-start gap-2">
                <AlertTriangle size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-[#92400e]">
                  {editingMember?.user?.fullName || 'Anggota'} akan memiliki izin sesuai peran baru. Pastikan Anda memberikan peran yang sesuai.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={isSubmitting || isLoadingAccess || !canManageTeam || editingMember?.role === 'tenant_owner'}
              className="bg-[#4f46e5] hover:bg-[#6366f1] text-white"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
