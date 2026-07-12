import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSeating } from '@/hooks';
import { useGuests } from '@/hooks';
import {
  Armchair,
  Plus,
  X,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  GripVertical,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Helpers ──────────────────────────────────────────

function getCategoryBadge(category: string) {
  switch (category) {
    case 'vip': return <Badge className="bg-[#d4af37] text-white border-0 text-[10px]">VIP</Badge>;
    case 'family': return <Badge className="bg-[#ffe4e6] text-[#e11d48] border-[#fecdd3] text-[10px]">Keluarga</Badge>;
    case 'friend': return <Badge className="bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe] text-[10px]">Teman</Badge>;
    case 'colleague': return <Badge className="bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] text-[10px]">Rekan</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">Lainnya</Badge>;
  }
}

function getCategoryDot(category: string) {
  switch (category) {
    case 'vip': return 'bg-[#d4af37]';
    case 'family': return 'bg-[#f43f5e]';
    case 'friend': return 'bg-[#4f46e5]';
    case 'colleague': return 'bg-[#64748b]';
    default: return 'bg-[#94a3b8]';
  }
}

function getOccupancyColor(percentage: number) {
  if (percentage >= 100) return 'text-[#f43f5e]';
  if (percentage >= 80) return 'text-[#f59e0b]';
  return 'text-[#10b981]';
}

function getOccupancyRingColor(percentage: number) {
  if (percentage >= 100) return '#f43f5e';
  if (percentage >= 80) return '#f59e0b';
  return '#10b981';
}

function getTableBorderColor(tableType: string, occupancyPct: number) {
  if (occupancyPct >= 100) return 'border-[#f43f5e]/40';
  switch (tableType) {
    case 'vip': return 'border-[#d4af37]/50';
    case 'family': return 'border-[#f43f5e]/25';
    default: return 'border-[#e2e8f0]';
  }
}

function getTableBgTint(tableType: string) {
  switch (tableType) {
    case 'vip': return 'bg-[#fefce8]/50 dark:bg-[#fefce8]/5';
    case 'family': return 'bg-[#fff1f2]/30 dark:bg-[#fff1f2]/5';
    default: return '';
  }
}

function ShapeIcon({ shape, size = 16 }: { shape: string; size?: number }) {
  const className = "text-[#94a3b8]";
  switch (shape) {
    case 'round': return <div className={cn("rounded-full border-2 border-current", className)} style={{ width: size, height: size }} />;
    case 'square': return <div className={cn("rounded-sm border-2 border-current", className)} style={{ width: size, height: size }} />;
    case 'rectangle': return <div className={cn("rounded-sm border-2 border-current", className)} style={{ width: size * 1.4, height: size * 0.8 }} />;
    default: return <Armchair size={size} className={className} />;
  }
}

// ── Capacity Ring SVG ────────────────────────────────

function CapacityRing({ occupied, capacity }: { occupied: number; capacity: number }) {
  const percentage = Math.min(100, (occupied / capacity) * 100);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getOccupancyRingColor(percentage);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
        <motion.circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        />
      </svg>
      <span className={cn("absolute text-[10px] font-bold", getOccupancyColor(percentage))}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

// ── Table Card Component ─────────────────────────────

function TableCard({
  table,
  assignedGuests,
  isSelected,
  onSelect,
}: {
  table: import('@/types').Table;
  assignedGuests: import('@/types').Guest[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const occupancy = assignedGuests.length;
  const capacityPct = (occupancy / table.capacity) * 100;
  const isFull = occupancy >= table.capacity;
  const isEmpty = occupancy === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: easeOutExpo }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
      onClick={onSelect}
      className={cn(
        'bg-white dark:bg-[#151c2c] rounded-2xl border p-4 cursor-pointer transition-all duration-150',
        'w-full min-w-[200px]',
        getTableBorderColor('general', capacityPct),
        getTableBgTint('general'),
        isSelected && 'ring-2 ring-[#4f46e5] ring-offset-2 ring-offset-[#f8fafc] dark:ring-offset-[#0b0f19]',
        isEmpty && 'border-dashed opacity-70',
        isFull && 'border-[#f43f5e]/40',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShapeIcon shape={table.shape} />
          <div>
            <h3 className="font-semibold text-sm text-[#0f172a] dark:text-[#f8fafc]">{table.name}</h3>
          </div>
        </div>
        <CapacityRing occupied={occupancy} capacity={table.capacity} />
      </div>

      {/* Capacity Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("text-xs font-semibold", getOccupancyColor(capacityPct))}>
          {occupancy}/{table.capacity}
        </span>
        <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getOccupancyRingColor(capacityPct) }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, capacityPct)}%` }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
          />
        </div>
      </div>

      {/* Guest Chips */}
      <div className="space-y-1.5">
        {assignedGuests.slice(0, 3).map((guest) => (
          <div
            key={guest.id}
            className="flex items-center gap-2 py-1 px-2 rounded-md bg-[#f8fafc] dark:bg-[#1e293b]"
          >
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getCategoryDot(guest.category))} />
            <span className="text-xs text-[#0f172a] dark:text-[#f8fafc] truncate flex-1">{guest.fullName}</span>
          </div>
        ))}
        {assignedGuests.length > 3 && (
          <p className="text-[10px] text-[#94a3b8] pl-2">+{assignedGuests.length - 3} lainnya</p>
        )}
        {assignedGuests.length === 0 && (
          <p className="text-[11px] text-[#94a3b8] italic text-center py-2">Kosong</p>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-3 pt-2 border-t border-[#f1f5f9] dark:border-[#334155]">
        {isFull ? (
          <Badge className="bg-[#ffe4e6] text-[#e11d48] border-[#fecdd3] text-[10px] w-full justify-center">Penuh</Badge>
        ) : isEmpty ? (
          <Badge variant="outline" className="text-[#94a3b8] border-[#e2e8f0] text-[10px] w-full justify-center">Tersedia</Badge>
        ) : (
          <Badge className="bg-[#d1fae5] text-[#059669] border-[#a7f3d0] text-[10px] w-full justify-center">{table.capacity - occupancy} kursi kosong</Badge>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Seating Page ────────────────────────────────

export default function TempatDuduk() {
  const { tables, isLoading, error, refetch, assignGuest, unassignGuest, autoAssign } = useSeating();
  const { guests } = useGuests();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignAlgo, setAutoAssignAlgo] = useState('guest_type');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  // Build a mapping of table ID to assigned guest objects
  const assignments = useMemo(() => {
    const map: Record<string, import('@/types').Guest[]> = {};
    for (const table of tables) {
      map[table.id] = table.assignedGuests
        .map(guestId => guests.find(g => g.id === guestId))
        .filter((g): g is import('@/types').Guest => !!g);
    }
    return map;
  }, [tables, guests]);

  // Find guests not assigned to any table
  const assignedGuestIds = useMemo(() => {
    const ids = new Set<string>();
    for (const table of tables) {
      for (const guestId of table.assignedGuests) {
        ids.add(guestId);
      }
    }
    return ids;
  }, [tables]);

  const unassignedGuests = useMemo(() => {
    return guests.filter(g => !assignedGuestIds.has(g.id));
  }, [guests, assignedGuestIds]);

  const stats = useMemo(() => {
    const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
    const occupied = assignedGuestIds.size;
    const empty = totalSeats - occupied;
    const unassigned = unassignedGuests.length;
    return { totalSeats, occupied, empty, unassigned, totalTables: tables.length };
  }, [tables, assignedGuestIds, unassignedGuests]);

  const filteredUnassigned = useMemo(() => {
    let result = unassignedGuests;
    if (filterCategory !== 'all') {
      result = result.filter(g => g.category === filterCategory);
    }
    if (searchQuery.length >= 2) {
      result = result.filter(g => g.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [unassignedGuests, filterCategory, searchQuery]);

  const handleAssignGuest = async (guestId: string, tableId: string) => {
    setIsAssigning(true);
    try {
      const success = await assignGuest(tableId, guestId);
      if (success) {
        toast.success('Tamu berhasil ditugaskan ke meja');
      }
    } catch {
      toast.error('Gagal menugaskan tamu ke meja');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignGuest = async (guestId: string, tableId: string) => {
    try {
      const success = await unassignGuest(tableId, guestId);
      if (success) {
        toast.success('Tamu berhasil dipindahkan dari meja');
      }
    } catch {
      toast.error('Gagal memindahkan tamu dari meja');
    }
  };

  const handleAutoAssignClick = async () => {
    setIsAutoAssigning(true);
    try {
      // Use the first eventId from tables if available, or empty string
      const eventId = tables[0]?.eventId || '';
      if (!eventId) {
        toast.error('Tidak ada acara yang tersedia');
        return;
      }
      const success = await autoAssign(eventId);
      if (success) {
        toast.success('Penempatan otomatis berhasil diterapkan');
      }
    } catch {
      toast.error('Gagal menerapkan penempatan otomatis');
    } finally {
      setIsAutoAssigning(false);
      setShowAutoAssign(false);
    }
  };

  const handleReset = () => {
    // Reset: unassign all guests from the selected table
    if (selectedTableId) {
      const tableGuests = assignments[selectedTableId] || [];
      tableGuests.forEach(g => {
        unassignGuest(selectedTableId, g.id);
      });
    }
    setShowResetConfirm(false);
    setSelectedTableId(null);
    toast.success('Meja telah dikosongkan');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle size={48} className="text-[#f43f5e] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Gagal memuat data tempat duduk</p>
        <p className="text-sm text-[#64748b] mb-4">{error}</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RotateCcw size={16} />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
      className="flex flex-col xl:flex-row gap-6"
    >
      {/* Main Area */}
      <div className="flex-1 min-w-0">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Tempat Duduk</h1>
            <p className="text-sm text-[#64748b] mt-1">Atur tata letak meja dan penempatan tamu</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" className="gap-2 bg-[#4f46e5] hover:bg-[#6366f1]">
              <Plus size={16} />
              Tambah Meja
            </Button>
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setShowAutoAssign(true)}>
              <Sparkles size={16} />
              Auto-Assign
            </Button>
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setShowResetConfirm(true)}>
              <RotateCcw size={16} />
              Reset
            </Button>
            <div className="flex items-center bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-lg p-0.5 ml-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-[#eef2ff] text-[#4f46e5]' : 'text-[#94a3b8] hover:text-[#64748b]'
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-[#eef2ff] text-[#4f46e5]' : 'text-[#94a3b8] hover:text-[#64748b]'
                )}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-4 lg:px-6 py-3 mb-6">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-2 w-24" />
            </>
          ) : (
            <>
              <div className="text-sm">
                <span className="text-[#64748b]">Total Meja: </span>
                <strong className="text-[#0f172a] dark:text-[#f8fafc] font-mono">{stats.totalTables}</strong>
              </div>
              <div className="text-sm">
                <span className="text-[#64748b]">Total Kursi: </span>
                <strong className="text-[#0f172a] dark:text-[#f8fafc] font-mono">{stats.totalSeats}</strong>
              </div>
              <div className="text-sm">
                <span className="text-[#64748b]">Terisi: </span>
                <strong className="text-[#10b981] font-mono">{stats.occupied}</strong>
              </div>
              <div className="text-sm">
                <span className="text-[#64748b]">Kosong: </span>
                <strong className="text-[#f59e0b] font-mono">{stats.empty}</strong>
              </div>
              <div className="text-sm">
                <span className="text-[#64748b]">Belum Ditugaskan: </span>
                <strong className="text-[#f43f5e] font-mono">{stats.unassigned}</strong>
              </div>
              <div className="flex-1 min-w-[120px]">
                <Progress value={stats.totalSeats > 0 ? (stats.occupied / stats.totalSeats) * 100 : 0} className="h-2" />
              </div>
            </>
          )}
        </div>

        {/* Table Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] p-4">
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div
            className="relative bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl overflow-hidden"
            style={{
              minHeight: 640,
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.25, ease: easeOutExpo }}
                >
                  <TableCard
                    table={table}
                    assignedGuests={assignments[table.id] || []}
                    isSelected={selectedTableId === table.id}
                    onSelect={() => setSelectedTableId(selectedTableId === table.id ? null : table.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Meja</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Kapasitas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Tamu</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                  {tables.map((table) => {
                    const assigned = assignments[table.id] || [];
                    const occupancy = assigned.length;
                    const capacityPct = (occupancy / table.capacity) * 100;
                    return (
                      <tr
                        key={table.id}
                        className={cn(
                          "hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] cursor-pointer transition-colors",
                          selectedTableId === table.id && "bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)]"
                        )}
                        onClick={() => setSelectedTableId(selectedTableId === table.id ? null : table.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ShapeIcon shape={table.shape} size={14} />
                            <span className="font-medium text-sm text-[#0f172a] dark:text-[#f8fafc]">{table.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-semibold", getOccupancyColor(capacityPct))}>
                              {occupancy}/{table.capacity}
                            </span>
                            <div className="w-20 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, capacityPct)}%`, backgroundColor: getOccupancyRingColor(capacityPct) }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center -space-x-1.5">
                            {assigned.slice(0, 4).map((g) => (
                              <div
                                key={g.id}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 border-white dark:border-[#151c2c] flex items-center justify-center text-[9px] font-bold text-white",
                                  g.category === 'vip' ? 'bg-[#d4af37]' :
                                  g.category === 'family' ? 'bg-[#f43f5e]' :
                                  g.category === 'friend' ? 'bg-[#4f46e5]' : 'bg-[#64748b]'
                                )}
                                title={g.fullName}
                              >
                                {g.fullName.charAt(0)}
                              </div>
                            ))}
                            {assigned.length > 4 && (
                              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#151c2c] bg-[#f1f5f9] flex items-center justify-center text-[8px] font-bold text-[#64748b]">
                                +{assigned.length - 4}
                              </div>
                            )}
                            {assigned.length === 0 && <span className="text-xs text-[#94a3b8]">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {occupancy >= table.capacity ? (
                            <Badge className="bg-[#ffe4e6] text-[#e11d48] border-[#fecdd3] text-[10px]">Penuh</Badge>
                          ) : occupancy === 0 ? (
                            <Badge variant="outline" className="text-[#94a3b8] border-[#e2e8f0] text-[10px]">Kosong</Badge>
                          ) : (
                            <Badge className="bg-[#d1fae5] text-[#059669] border-[#a7f3d0] text-[10px]">Tersedia</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}
                          >
                            Kelola
                            <ChevronRight size={12} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="w-[340px] bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden h-fit">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#f1f5f9] dark:border-[#334155]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">{selectedTable.name}</h3>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {(assignments[selectedTable.id] || []).length}/{selectedTable.capacity} kursi &middot; {' '}
                    {selectedTable.shape === 'round' ? 'Bulat' : selectedTable.shape === 'square' ? 'Persegi' : 'Persegi Panjang'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTableId(null)}
                  className="p-1.5 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                >
                  <X size={16} className="text-[#94a3b8]" />
                </button>
              </div>

              {/* Progress */}
              <div className="px-4 py-3 border-b border-[#f1f5f9] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#64748b]">Kapasitas</span>
                  <span className={cn("text-xs font-semibold", getOccupancyColor(((assignments[selectedTable.id] || []).length / selectedTable.capacity) * 100))}>
                    {(assignments[selectedTable.id] || []).length}/{selectedTable.capacity}
                  </span>
                </div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getOccupancyRingColor(((assignments[selectedTable.id] || []).length / selectedTable.capacity) * 100) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((assignments[selectedTable.id] || []).length / selectedTable.capacity) * 100)}%` }}
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                  />
                </div>
              </div>

              {/* Assigned Guests */}
              <div className="p-4 border-b border-[#f1f5f9] dark:border-[#334155]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
                  Tamu Ditugaskan ({(assignments[selectedTable.id] || []).length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(assignments[selectedTable.id] || []).length === 0 ? (
                    <p className="text-xs text-[#94a3b8] text-center py-4">Belum ada tamu</p>
                  ) : (
                    (assignments[selectedTable.id] || []).map((guest) => (
                      <motion.div
                        key={guest.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] group"
                      >
                        <GripVertical size={14} className="text-[#e2e8f0] cursor-grab" />
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0", getCategoryDot(guest.category))}>
                          {guest.fullName.charAt(0)}
                        </div>
                        <span className="text-xs text-[#0f172a] dark:text-[#f8fafc] flex-1 truncate">{guest.fullName}</span>
                        {getCategoryBadge(guest.category)}
                        <button
                          onClick={() => handleUnassignGuest(guest.id, selectedTable.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#ffe4e6] transition-all"
                          title="Hapus dari meja"
                        >
                          <X size={12} className="text-[#f43f5e]" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-[#f1f5f9] dark:border-[#334155]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">Aksi Cepat</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => {
                      const el = document.getElementById('unassigned-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Plus size={14} />
                    Tambah ke Meja Ini
                  </Button>
                  {(assignments[selectedTable.id] || []).length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 text-xs text-[#f43f5e] hover:text-[#f43f5e] hover:bg-[#fff1f2]"
                      onClick={() => {
                        const assigned = assignments[selectedTable.id] || [];
                        assigned.forEach(g => handleUnassignGuest(g.id, selectedTable.id));
                      }}
                    >
                      <RotateCcw size={14} />
                      Kosongkan Meja
                    </Button>
                  )}
                </div>
              </div>

              {/* Unassigned Guests */}
              <div id="unassigned-section" className="p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
                  Tamu Belum Ditugaskan ({unassignedGuests.length})
                </h4>

                {/* Search & Filter */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      placeholder="Cari tamu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs border-[#e2e8f0]"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {['all', 'vip', 'family', 'friend', 'colleague'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors',
                          filterCategory === cat
                            ? 'bg-[#eef2ff] text-[#4f46e5]'
                            : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                        )}
                      >
                        {cat === 'all' ? 'Semua' : cat === 'vip' ? 'VIP' : cat === 'family' ? 'Keluarga' : cat === 'friend' ? 'Teman' : 'Rekan'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unassigned List */}
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {filteredUnassigned.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] text-center py-4">
                      {unassignedGuests.length === 0 ? 'Semua tamu sudah ditugaskan' : 'Tidak ada tamu yang cocok'}
                    </p>
                  ) : (
                    filteredUnassigned.map((guest) => (
                      <motion.div
                        key={guest.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] group"
                      >
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0", getCategoryDot(guest.category))}>
                          {guest.fullName.charAt(0)}
                        </div>
                        <span className="text-xs text-[#0f172a] dark:text-[#f8fafc] flex-1 truncate">{guest.fullName}</span>
                        {(assignments[selectedTable.id] || []).length < selectedTable.capacity ? (
                          <button
                            onClick={() => handleAssignGuest(guest.id, selectedTable.id)}
                            disabled={isAssigning}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#d1fae5] transition-all disabled:opacity-50"
                            title="Tambahkan ke meja"
                          >
                            {isAssigning ? <Loader2 size={12} className="animate-spin text-[#10b981]" /> : <Plus size={12} className="text-[#10b981]" />}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#f43f5e]">Penuh</span>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Assign Modal */}
      <Dialog open={showAutoAssign} onOpenChange={setShowAutoAssign}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#4f46e5]" />
              Penempatan Otomatis
            </DialogTitle>
            <DialogDescription>
              Sistem akan menempatkan tamu berdasarkan kriteria yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#64748b]">Algoritma Penempatan</label>
              <div className="space-y-2">
                {[
                  { value: 'guest_type', label: 'Berdasarkan Tipe Tamu', desc: 'Meja VIP didahulukan, lalu berdasarkan tipe tamu' },
                  { value: 'household', label: 'Berdasarkan Kelompok Keluarga', desc: 'Pertahankan keluarga di meja yang sama' },
                  { value: 'segment', label: 'Berdasarkan Segmen', desc: 'Kelompokkan berdasarkan segmen acara' },
                  { value: 'random', label: 'Acak Merata', desc: 'Distribusikan tamu secara merata ke semua meja' },
                ].map((algo) => (
                  <label
                    key={algo.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      autoAssignAlgo === algo.value
                        ? 'border-[#4f46e5] bg-[#eef2ff]'
                        : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                    )}
                  >
                    <input
                      type="radio"
                      name="algo"
                      value={algo.value}
                      checked={autoAssignAlgo === algo.value}
                      onChange={(e) => setAutoAssignAlgo(e.target.value)}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">{algo.label}</p>
                      <p className="text-xs text-[#64748b]">{algo.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-[#64748b]">
                <AlertCircle size={14} />
                <span>
                  <strong className="text-[#0f172a] dark:text-[#f8fafc]">{stats.unassigned}</strong> tamu belum ditugaskan
                  {' '}akan ditempatkan di meja yang tersedia.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoAssign(false)}>
              Batal
            </Button>
            <Button className="bg-[#4f46e5] hover:bg-[#6366f1] gap-2" onClick={handleAutoAssignClick} disabled={isAutoAssigning}>
              {isAutoAssigning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Terapkan Penempatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={18} className="text-[#f43f5e]" />
              Konfirmasi Reset
            </DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus semua penempatan tamu dari meja yang dipilih. Tamu akan kembali ke daftar belum ditugaskan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Reset Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
