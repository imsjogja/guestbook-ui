import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  X,
  Users,
  MoreVertical,
  Send,
  Trash2,
  Pencil,
  UserPlus,
  UserMinus,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGuestFirstName, getGuestInitials } from '@/lib/normalizers';
import { useGuests } from '@/hooks';
import type { Guest } from '@/types';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Types ─── */
interface HouseholdMember {
  id: string;
  name: string;
  type: string;
  rsvp: 'hadir' | 'tidak-hadir' | 'mungkin' | 'belum';
  initials: string;
  gradient: string;
}

interface Household {
  id: string;
  name: string;
  eventName: string;
  members: HouseholdMember[];
}

/* ─── Avatar Gradients ─── */
const gradients = [
  'from-[#4f46e5] to-[#6366f1]',
  'from-[#e11d48] to-[#f43f5e]',
  'from-[#059669] to-[#10b981]',
  'from-[#b45309] to-[#f59e0b]',
  'from-[#0369a1] to-[#0ea5e9]',
  'from-[#7c3aed] to-[#8b5cf6]',
];

const getGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
};

/* ─── RSVP Config ─── */
const rsvpDot: Record<string, string> = {
  'hadir': '#10b981',
  'tidak-hadir': '#f43f5e',
  'mungkin': '#f59e0b',
  'belum': '#94a3b8',
};

/* ─── Component ─── */
export default function KelompokKeluarga() {
  const { guests, isLoading, error, refetch, createGuest } = useGuests();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);

  /* Form state */
  const [formName, setFormName] = useState('');
  const [formEvent, setFormEvent] = useState('Pernikahan Aditya & Putri');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberType, setNewMemberType] = useState('Anggota');

  /* ── Derive households from guests ── */
  const households: Household[] = useMemo(() => {
    const groups = new Map<string, Guest[]>();

    // Group guests by householdId
    guests.forEach((g) => {
      const hhId = g.householdId || 'ungrouped';
      if (!groups.has(hhId)) groups.set(hhId, []);
      groups.get(hhId)!.push(g);
    });

    // Convert to Household array
    const result: Household[] = [];
    groups.forEach((members, hhId) => {
      if (hhId === 'ungrouped') {
        // Create individual households for ungrouped guests (each their own group)
        members.forEach((g) => {
          result.push({
            id: `individual-${g.id}`,
            name: g.fullName,
            eventName: formEvent,
            members: [mapGuestToMember(g)],
          });
        });
      } else {
        const firstMember = members[0];
        result.push({
          id: hhId,
          name: firstMember.subgroup || `Keluarga ${getGuestFirstName(firstMember.fullName)}`,
          eventName: formEvent,
          members: members.map(mapGuestToMember),
        });
      }
    });

    return result;
  }, [guests, formEvent]);

  /* Filtered */
  const filtered = households.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteHousehold = (_id: string) => {
    // Since we don't have a direct household delete API, we just remove from UI state locally
    // In a real app this would call deleteGuest for each member or a deleteHousehold API
    setDropdownOpen(null);
  };

  const handleRemoveMember = (_householdId: string, _memberId: string) => {
    // This would call updateGuest to remove householdId
    setDropdownOpen(null);
  };

  const handleCreateHousehold = async () => {
    if (!formName.trim()) return;
    // Create a household by creating a guest with household data
    // The household name is stored in the subgroup field
    await createGuest({
      fullName: formName,
      subgroup: formName,
      eventId: '', // Will be set by backend
      category: 'family',
      plusOne: false,
    });
    setShowCreate(false);
    setFormName('');
  };

  const handleAddMember = (_householdId: string) => {
    if (!newMemberName.trim()) return;
    setNewMemberName('');
    setShowAddMember(null);
  };

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOutExpo }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader2 size={40} className="text-[#4f46e5] animate-spin mb-4" />
        <p className="text-sm text-[#64748b]">Memuat kelompok keluarga...</p>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
      className="space-y-6"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Kelompok Keluarga</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{households.length} kelompok terdaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96] transition-all">
            <Plus size={18} />
            Buat Kelompok
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-3">
        <div className="relative">
          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelompok..."
            className="w-[280px] h-10 pl-9 pr-4 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="ml-auto text-xs text-[#64748b]">{filtered.length} kelompok</div>
      </div>

      {/* ── Card Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((hh, i) => {
            const isExpanded = expandedId === hh.id;
            const visibleAvatars = hh.members.slice(0, 5);
            const overflow = hh.members.length - 5;
            return (
              <motion.div
                key={hh.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.06, ease: easeOutExpo }}
                className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-[#cbd5e1] transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] truncate">{hh.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#64748b]">{hh.members.length} anggota</span>
                      <span className="text-[#e2e8f0]">|</span>
                      <span className="text-xs text-[#94a3b8] truncate">{hh.eventName}</span>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 ml-2">
                    <button onClick={() => setDropdownOpen(dropdownOpen === hh.id ? null : hh.id)}
                      className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8] transition-colors">
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                      {dropdownOpen === hh.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15, ease: easeOutExpo }}
                            className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-lg shadow-lg z-20 py-1">
                            <button onClick={() => { setDropdownOpen(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors flex items-center gap-2">
                              <Pencil size={13} /> Ubah
                            </button>
                            <button onClick={() => { setShowAddMember(hh.id); setDropdownOpen(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors flex items-center gap-2">
                              <UserPlus size={13} /> Tambah Anggota
                            </button>
                            <div className="border-t border-[#e2e8f0] dark:border-[#334155] my-1" />
                            <button onClick={() => handleDeleteHousehold(hh.id)}
                              className="w-full text-left px-3 py-2 text-sm text-[#f43f5e] hover:bg-[#ffe4e6]/50 transition-colors flex items-center gap-2">
                              <Trash2 size={13} /> Hapus
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Avatar Stack */}
                <div className="flex items-center mb-4">
                  <div className="flex -space-x-2 group/avatars">
                    {visibleAvatars.map((m, idx) => (
                      <div
                        key={m.id}
                        title={m.name}
                        className={cn(
                          'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-[#151c2c] transition-transform group-hover/avatars:translate-x-0.5',
                          m.gradient
                        )}
                        style={{ zIndex: visibleAvatars.length - idx }}
                      >
                        {m.initials}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="w-8 h-8 rounded-full bg-[#f1f5f9] border-2 border-white dark:border-[#151c2c] flex items-center justify-center text-[10px] font-semibold text-[#64748b] z-0">
                        +{overflow}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <span>{hh.members.filter((m) => m.rsvp === 'hadir').length} hadir</span>
                      <span className="w-1 h-1 rounded-full bg-[#e2e8f0]" />
                      <span>{hh.members.filter((m) => m.rsvp === 'belum').length} belum</span>
                    </div>
                  </div>
                </div>

                {/* Expand / Collapse */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : hh.id)}
                  className="flex items-center gap-1 text-xs text-[#4f46e5] hover:underline font-medium mb-0 transition-colors"
                >
                  <ChevronDown size={14} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                  {isExpanded ? 'Sembunyikan' : 'Lihat Anggota'}
                </button>

                {/* Expandable Member List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-[#e2e8f0] dark:border-[#334155] space-y-1">
                        {hh.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] group/member transition-colors"
                          >
                            <div className={cn('w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0', m.gradient)}>
                              {m.initials}
                            </div>
                            <span className="text-sm text-[#0f172a] dark:text-[#f8fafc] flex-1 truncate">{m.name}</span>
                            <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{m.type}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rsvpDot[m.rsvp] }} />
                            <button
                              onClick={() => handleRemoveMember(hh.id, m.id)}
                              className="p-1 rounded opacity-0 group-hover/member:opacity-100 hover:bg-[#ffe4e6] text-[#94a3b8] hover:text-[#f43f5e] transition-all"
                              title="Hapus dari kelompok"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        ))}
                        {hh.members.length === 0 && (
                          <p className="text-xs text-[#94a3b8] text-center py-3">Belum ada anggota</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <button onClick={() => setShowAddMember(hh.id)}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors">
                    <Plus size={13} />
                    Tambah Anggota
                  </button>
                  <button className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors">
                    <Send size={13} />
                    Kirim Undangan
                  </button>
                </div>

                {/* Inline Add Member */}
                <AnimatePresence>
                  {showAddMember === hh.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-[#e2e8f0] dark:border-[#334155] space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMember(hh.id)}
                            placeholder="Nama anggota..."
                            autoFocus
                            className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                          />
                          <select
                            value={newMemberType}
                            onChange={(e) => setNewMemberType(e.target.value)}
                            className="h-9 px-2 rounded-lg border border-[#e2e8f0] bg-white text-xs focus:outline-none focus:border-[#4f46e5]"
                          >
                            <option value="Anggota">Anggota</option>
                            <option value="Anak">Anak</option>
                            <option value="Saudara">Saudara</option>
                            <option value="Keponakan">Keponakan</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddMember(hh.id)}
                            disabled={!newMemberName.trim()}
                            className={cn(
                              'h-8 px-3 rounded-lg text-xs font-medium transition-all',
                              !newMemberName.trim()
                                ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                                : 'bg-[#4f46e5] text-white hover:bg-[#6366f1]'
                            )}
                          >
                            Tambah
                          </button>
                          <button
                            onClick={() => { setShowAddMember(null); setNewMemberName(''); }}
                            className="h-8 px-3 rounded-lg text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-[#e2e8f0] mb-4" />
          <p className="text-sm text-[#64748b]">Tidak ada kelompok yang cocok</p>
          <p className="text-xs text-[#94a3b8] mt-1">Coba ubah kata kunci pencarian</p>
        </div>
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="relative w-full max-w-[480px] bg-white dark:bg-[#151c2c] rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] border border-[#e2e8f0] dark:border-[#334155] z-10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155]">
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Buat Kelompok Baru</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-md hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] text-[#94a3b8]"><X size={18} /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Nama Kelompok <span className="text-[#f43f5e]">*</span></label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Keluarga Bapak Ahmad"
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Acara <span className="text-[#f43f5e]">*</span></label>
                  <select value={formEvent} onChange={(e) => setFormEvent(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20">
                    <option>Pernikahan Aditya & Putri</option>
                    <option>Konferensi Teknologi 2025</option>
                    <option>Ulang Tahun Bapak Suryadi</option>
                    <option>Grand Opening Kafe Nusantara</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                <button onClick={() => setShowCreate(false)}
                  className="h-10 px-4 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Batal</button>
                <button onClick={handleCreateHousehold} disabled={!formName.trim()}
                  className={cn('h-10 px-6 rounded-lg text-sm font-medium transition-all',
                    !formName.trim() ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed' : 'bg-[#4f46e5] text-white hover:bg-[#6366f1] hover:scale-[1.02] active:scale-[0.96]')}>
                  Simpan Kelompok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Helper: Map Guest to HouseholdMember ─── */
function mapGuestToMember(g: Guest): HouseholdMember {
  const name = g.fullName;
  const initials = getGuestInitials(name);
  // Map category to a member type label
  const typeMap: Record<string, string> = {
    vip: 'VIP',
    family: 'Keluarga',
    friend: 'Teman',
    colleague: 'Kolega',
    partner: 'Rekan',
    other: 'Lainnya',
  };
  return {
    id: g.id,
    name,
    type: typeMap[g.category] || g.category,
    rsvp: 'belum',
    initials,
    gradient: getGradient(g.id),
  };
}
