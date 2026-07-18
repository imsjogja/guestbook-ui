import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useTenantStore } from '@/store/tenantStore';
import { cn } from '@/lib/utils';

type EventContextSelectorProps = {
  className?: string;
  prominent?: boolean;
};

function formatEventDate(value: string) {
  if (!value) return 'Tanggal belum ditentukan';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal belum ditentukan';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'published': return 'Dipublikasikan';
    case 'active': return 'Dipublikasikan';
    case 'draft': return 'Draft';
    case 'ongoing': return 'Sedang Berlangsung';
    case 'paused': return 'Sedang Berlangsung';
    case 'completed': return 'Selesai';
    case 'archived': return 'Diarsipkan';
    default: return status;
  }
}

export default function EventContextSelector({ className, prominent = false }: EventContextSelectorProps) {
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const setCurrentEvent = useTenantStore((state) => state.setCurrentEvent);
  const { events, isLoading, error, refetch } = useEvents();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return events;
    return events.filter((event) =>
      event.name.toLowerCase().includes(normalizedQuery) ||
      (event.location ?? '').toLowerCase().includes(normalizedQuery)
    );
  }, [events, query]);

  const handleSelect = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setCurrentEvent(event);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Pilih konteks acara"
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border text-left transition-colors',
          prominent
            ? 'min-h-[66px] border-[#c7d2fe] bg-[#eef2ff] px-4 hover:border-[#818cf8] dark:border-[#4338ca] dark:bg-[rgba(79,70,229,0.12)]'
            : 'h-11 border-[#e2e8f0] bg-white px-3 hover:border-[#c7d2fe] dark:border-[#334155] dark:bg-[#151c2c]',
          !currentEvent && 'border-[#fcd34d] bg-[#fffbeb] dark:border-[#92400e] dark:bg-[rgba(146,64,14,0.16)]'
        )}
      >
        <span className={cn(
          'flex shrink-0 items-center justify-center rounded-lg',
          prominent ? 'h-10 w-10 bg-white text-[#4f46e5] shadow-sm dark:bg-[#151c2c]' : 'h-7 w-7 bg-[#eef2ff] text-[#4f46e5] dark:bg-[rgba(79,70,229,0.15)]'
        )}>
          <CalendarDays size={prominent ? 19 : 15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Konteks acara
          </span>
          <span className={cn(
            'block truncate font-semibold',
            prominent ? 'mt-0.5 text-sm text-[#3730a3] dark:text-[#c7d2fe]' : 'text-xs text-[#1e293b] dark:text-[#f8fafc]'
          )}>
            {currentEvent?.name ?? 'Pilih acara untuk mulai bekerja'}
          </span>
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-[#94a3b8] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-[#334155] dark:bg-[#151c2c]">
          <div className="border-b border-[#e2e8f0] px-4 py-3 dark:border-[#334155]">
            <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">Pilih konteks acara</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#64748b]">
              Status acara menunjukkan lifecycle bisnis. Pilihan ini hanya menentukan data yang sedang dibuka.
            </p>
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau lokasi acara..."
                className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] pl-9 pr-3 text-xs text-[#1e293b] outline-none focus:border-[#818cf8] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc]"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-[#64748b]">
                <Loader2 size={15} className="animate-spin" /> Memuat daftar acara...
              </div>
            ) : error ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-[#be123c]">{error}</p>
                <button type="button" onClick={() => void refetch()} className="mt-2 text-xs font-semibold text-[#4f46e5] hover:underline">
                  Coba lagi
                </button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#64748b]">
                {events.length === 0 ? 'Belum ada acara yang dapat Anda akses.' : 'Acara tidak ditemukan.'}
                <Link to="/acara" onClick={() => setOpen(false)} className="mt-2 block font-semibold text-[#4f46e5] hover:underline">
                  Buka daftar acara
                </Link>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const selected = currentEvent?.id === event.id;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleSelect(event.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                      selected ? 'bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.14)]' : 'hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]'
                    )}
                  >
                    <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-[#4f46e5] text-white' : 'bg-[#f1f5f9] text-[#64748b] dark:bg-[#334155]')}>
                      <CalendarDays size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{event.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#64748b]">
                        {formatEventDate(event.startDate)}{event.location ? ` · ${event.location}` : ''}
                      </span>
                      <span className="mt-1 inline-flex rounded-full border border-[#e2e8f0] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b] dark:border-[#475569]">
                        {getStatusLabel(event.status)}
                      </span>
                    </span>
                    {selected && <Check size={16} className="mt-1 shrink-0 text-[#4f46e5]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
