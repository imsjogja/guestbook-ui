import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Plus, ShieldCheck, Trash2, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEventMembers } from '@/hooks/useEventMembers';
import { useTeam } from '@/hooks/useTeam';
import { useTenantStore } from '@/store/tenantStore';
import type { EventRole } from '@/types';

const roleConfig: Record<EventRole, { label: string; description: string; className: string }> = {
  rsvp_officer: {
    label: 'Petugas RSVP',
    description: 'Mengelola RSVP, undangan, dan komunikasi acara.',
    className: 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]',
  },
  registration_officer: {
    label: 'Petugas Registrasi',
    description: 'Mengelola check-in dan registrasi tamu.',
    className: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
  },
  usher: {
    label: 'Usher',
    description: 'Membantu kedatangan dan tempat duduk tamu.',
    className: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  },
  gift_officer: {
    label: 'Petugas Hadiah',
    description: 'Mengelola penerimaan hadiah acara.',
    className: 'bg-[#fdf4ff] text-[#a21caf] border-[#f5d0fe]',
  },
  viewer: {
    label: 'Viewer Acara',
    description: 'Akses baca untuk data acara.',
    className: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]',
  },
};

export default function TimAcara() {
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const { members: tenantMembers, isLoading: isTeamLoading } = useTeam();
  const {
    members,
    access,
    isLoading,
    error,
    assignMember,
    updateMemberRole,
    removeMember,
  } = useEventMembers(currentEvent?.id);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<EventRole>('viewer');
  const [isSaving, setIsSaving] = useState(false);

  const availableMembers = useMemo(
    () => tenantMembers.filter((member) => !members.some((assigned) => assigned.userId === member.userId)),
    [members, tenantMembers]
  );

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Pilih anggota tenant terlebih dahulu');
      return;
    }
    setIsSaving(true);
    try {
      await assignMember(selectedUserId, selectedRole);
      setSelectedUserId('');
      toast.success('Anggota berhasil ditambahkan ke acara');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan anggota acara');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: EventRole) => {
    try {
      await updateMemberRole(userId, role);
      toast.success('Role acara diperbarui');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui role acara');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Cabut akses user ini dari acara?')) return;
    try {
      await removeMember(userId);
      toast.success('Akses acara dicabut');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencabut akses acara');
    }
  };

  if (!currentEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#eef2ff] flex items-center justify-center mb-4">
          <Users2 size={26} className="text-[#4f46e5]" />
        </div>
        <h1 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Pilih acara terlebih dahulu</h1>
        <p className="mt-2 text-sm text-[#64748b]">Tim acara hanya dapat dikelola setelah acara aktif dipilih.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f46e5]">Akses acara</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Tim Acara</h1>
        <p className="mt-1 text-sm text-[#64748b]">{currentEvent.name}</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {access && (
        <div className="flex items-center gap-3 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-4 py-3 text-sm text-[#3730a3]">
          <ShieldCheck size={17} />
          <span>Akses Anda: <strong>{access.role}</strong> ({access.scope === 'tenant' ? 'seluruh tenant' : 'acara ini'})</span>
        </div>
      )}

      {access?.permissions.includes('event_team:write') && (
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-[#334155] dark:bg-[#151c2c]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">Tambah anggota acara</h2>
              <p className="mt-1 text-sm text-[#64748b]">Pilih anggota yang sudah terdaftar di tenant ini.</p>
            </div>
            <Plus size={18} className="text-[#4f46e5]" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#6366f1] dark:border-[#475569] dark:bg-[#0f172a] dark:text-[#f8fafc]">
              <option value="">Pilih anggota tenant</option>
              {availableMembers.map((member) => <option key={member.userId} value={member.userId}>{member.user?.fullName} · {member.user?.email}</option>)}
            </select>
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as EventRole)} className="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#6366f1] dark:border-[#475569] dark:bg-[#0f172a] dark:text-[#f8fafc]">
              {Object.entries(roleConfig).map(([role, config]) => <option key={role} value={role}>{config.label}</option>)}
            </select>
            <button type="button" onClick={() => void handleAssign()} disabled={isSaving || isTeamLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-sm font-medium text-white hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Tambahkan
            </button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-[#334155] dark:bg-[#151c2c]">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4 dark:border-[#334155]">
          <div>
            <h2 className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">Anggota yang ditugaskan</h2>
            <p className="mt-1 text-sm text-[#64748b]">{members.length} anggota event-specific</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#64748b]"><Loader2 size={17} className="animate-spin" /> Memuat tim acara...</div>
        ) : members.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#64748b]">Belum ada anggota yang ditugaskan ke acara ini.</div>
        ) : (
          <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
            {members.map((member) => {
              const config = roleConfig[member.role];
              return (
                <div key={member.userId} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{member.user.fullName}</p>
                    <p className="mt-0.5 text-xs text-[#64748b]">{member.user.email}</p>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.className}`}>{config.label}</span>
                  </div>
                  {access?.permissions.includes('event_team:write') && (
                    <div className="flex items-center gap-2">
                      <select value={member.role} onChange={(event) => void handleRoleChange(member.userId, event.target.value as EventRole)} className="h-9 rounded-lg border border-[#cbd5e1] bg-white px-2 text-xs text-[#334155] dark:border-[#475569] dark:bg-[#0f172a] dark:text-[#f8fafc]">
                        {Object.entries(roleConfig).map(([role, item]) => <option key={role} value={role}>{item.label}</option>)}
                      </select>
                      <button type="button" onClick={() => void handleRemove(member.userId)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#fff1f2] hover:text-[#e11d48]" title="Cabut akses">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
