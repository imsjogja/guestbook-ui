import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Download,
  Search,
  MessageCircle,
  Send,
  CheckCheck,
  Eye,
  AlertCircle,
  Clock,
  ChevronRight,
  RotateCcw,
  User,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks';
import { useTenantStore } from '@/store/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

const statusConfig: Record<MessageStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Menunggu', color: 'text-[#d97706]', bgColor: 'bg-[#fef3c7]', icon: <Clock size={12} /> },
  sent: { label: 'Terkirim', color: 'text-[#4f46e5]', bgColor: 'bg-[#eef2ff]', icon: <Send size={12} /> },
  delivered: { label: 'Tersampaikan', color: 'text-[#059669]', bgColor: 'bg-[#d1fae5]', icon: <CheckCheck size={12} /> },
  read: { label: 'Dibaca', color: 'text-[#2563eb]', bgColor: 'bg-[#dbeafe]', icon: <Eye size={12} /> },
  failed: { label: 'Gagal', color: 'text-[#e11d48]', bgColor: 'bg-[#ffe4e6]', icon: <AlertCircle size={12} /> },
};

export default function RiwayatPesan() {
  const currentEvent = useTenantStore((state) => state.currentEvent);
  const currentEventId = currentEvent?.id;
  const { messages, isLoading, error, refetch } = useMessages(currentEventId);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<import('@/types').Message | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    setSearchQuery('');
    setChannelFilter('all');
    setStatusFilter('all');
    setSelectedMessage(null);
    setIsDetailOpen(false);
  }, [currentEventId]);

  const totalStats = {
    total: messages.length,
    sent: messages.filter((m) => m.status === 'sent').length,
    delivered: messages.filter((m) => m.status === 'delivered').length,
    read: messages.filter((m) => m.status === 'read').length,
    failed: messages.filter((m) => m.status === 'failed').length,
  };

  const filteredMessages = messages.filter((m) => {
    const matchesSearch = !searchQuery || m.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'all' || m.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const openDetail = (msg: import('@/types').Message) => {
    setSelectedMessage(msg);
    setIsDetailOpen(true);
  };

  const handleRetry = (_id: string) => {
    toast.success('Pesan dikirim ulang');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle size={48} className="text-[#f43f5e] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Gagal memuat pesan</p>
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
          <h1 className="text-[2.25rem] font-bold text-[#0f172a] dark:text-[#f8fafc]">Riwayat Pesan</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Lacak status pengiriman pesan{currentEvent ? ` untuk ${currentEvent.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b]"
            onClick={() => refetch()}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b]"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Ekspor Log</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pesan', value: totalStats.total, color: 'text-[#64748b]', bg: 'bg-[#f8fafc] dark:bg-[#1e293b]' },
          { label: 'Terkirim', value: totalStats.sent, color: 'text-[#4f46e5]', bg: 'bg-[#eef2ff]' },
          { label: 'Tersampaikan', value: totalStats.delivered, color: 'text-[#059669]', bg: 'bg-[#d1fae5]' },
          { label: 'Gagal', value: totalStats.failed, color: 'text-[#e11d48]', bg: 'bg-[#ffe4e6]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05, ease: easeOutExpo }}
            className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4"
          >
            <p className="text-[12px] font-medium text-[#94a3b8] uppercase tracking-wider">{stat.label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className={cn('text-[1.5rem] font-semibold font-mono mt-1', stat.color)}>{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari isi pesan..."
            className="pl-9 h-10 border-[#e2e8f0] dark:border-[#334155]"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px] h-10 border-[#e2e8f0] dark:border-[#334155]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10 border-[#e2e8f0] dark:border-[#334155]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="sent">Terkirim</SelectItem>
            <SelectItem value="delivered">Tersampaikan</SelectItem>
            <SelectItem value="read">Dibaca</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
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
                  {['Waktu', 'Channel', 'Isi Pesan', 'Status', 'Aksi'].map((h) => (
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
                  {filteredMessages.map((msg, index) => {
                    const st = statusConfig[msg.status as MessageStatus] || statusConfig.sent;
                    return (
                      <motion.tr
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={cn(
                          'border-t border-[#f1f5f9] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors cursor-pointer',
                          msg.status === 'failed' && 'bg-[#fff1f2] dark:bg-[rgba(244,63,94,0.05)]'
                        )}
                        onClick={() => openDetail(msg)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] font-mono text-[#64748b]">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                msg.channel === 'whatsapp' ? 'bg-[#10b981]' : 'bg-[#3b82f6]'
                              )}
                            />
                            <span className="text-[12px] text-[#64748b] capitalize">{msg.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[400px]">
                          <p className="text-[13px] text-[#64748b] truncate">
                            {msg.subject || msg.body}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                              st.bgColor,
                              st.color
                            )}
                          >
                            {st.icon}
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {msg.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(msg.id)}
                                className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                                title="Kirim Ulang"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => openDetail(msg)}
                              className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                              title="Lihat Detail"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredMessages.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-sm text-[#64748b]">Tidak ada pesan yang sesuai dengan filter.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Detail Drawer */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-[440px] overflow-y-auto">
          {selectedMessage && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[1.25rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eef2ff] flex items-center justify-center">
                    <User size={16} className="text-[#4f46e5]" />
                  </div>
                  Pesan
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      selectedMessage.channel === 'whatsapp' ? 'bg-[#10b981]' : 'bg-[#3b82f6]'
                    )}
                  />
                  <span className="capitalize">{selectedMessage.channel}</span>
                  <span className="text-[#94a3b8]">|</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                      statusConfig[selectedMessage.status as MessageStatus]?.bgColor || 'bg-[#f1f5f9]',
                      statusConfig[selectedMessage.status as MessageStatus]?.color || 'text-[#64748b]'
                    )}
                  >
                    {statusConfig[selectedMessage.status as MessageStatus]?.icon || <Send size={12} />}
                    {statusConfig[selectedMessage.status as MessageStatus]?.label || selectedMessage.status}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Message Content */}
                {selectedMessage.channel === 'whatsapp' ? (
                  <div className="flex justify-center">
                    <div className="w-full max-w-[280px] rounded-[20px] border-4 border-[#1e293b] overflow-hidden bg-[#f0f2f5]">
                      <div className="bg-[#008069] px-3 py-2 flex items-center gap-2">
                        <MessageCircle size={14} className="text-white" />
                        <span className="text-white text-[12px] font-medium">GuestFlow</span>
                      </div>
                      <div className="p-3 min-h-[150px]">
                        <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                          <p className="text-[13px] text-[#1e293b] leading-relaxed whitespace-pre-wrap">
                            {selectedMessage.body}
                          </p>
                          <span className="text-[10px] text-[#94a3b8] mt-1 block text-right">
                            {selectedMessage.sentAt ? new Date(selectedMessage.sentAt).toLocaleTimeString('id-ID', { hour12: false }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-[#e2e8f0] dark:border-[#334155] rounded-lg p-4 space-y-3">
                    {selectedMessage.subject && (
                      <div className="flex gap-2 text-[13px]">
                        <span className="text-[#94a3b8] w-14 flex-shrink-0">Subject:</span>
                        <span className="text-[#1e293b] dark:text-[#f8fafc] font-medium">{selectedMessage.subject}</span>
                      </div>
                    )}
                    <div className="flex gap-2 text-[13px]">
                      <span className="text-[#94a3b8] w-14 flex-shrink-0">From:</span>
                      <span className="text-[#64748b]">GuestFlow &lt;noreply@guestflow.id&gt;</span>
                    </div>
                    <div className="border-t border-[#e2e8f0] dark:border-[#334155] pt-3">
                      <p className="text-[13px] text-[#1e293b] dark:text-[#f8fafc] leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.body}
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivery Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-3">Timeline Pengiriman</h4>
                  <div className="space-y-0">
                    {selectedMessage.status !== 'pending' && selectedMessage.sentAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#dbeafe] flex items-center justify-center">
                            <Send size={10} className="text-[#2563eb]" />
                          </div>
                          {selectedMessage.deliveredAt && <div className="w-[2px] h-8 bg-[#e2e8f0]" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-[12px] font-medium text-[#1e293b] dark:text-[#f8fafc]">Terkirim</p>
                          <p className="text-[11px] font-mono text-[#94a3b8]">{new Date(selectedMessage.sentAt).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                    {selectedMessage.deliveredAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#d1fae5] flex items-center justify-center">
                            <CheckCheck size={10} className="text-[#059669]" />
                          </div>
                          {selectedMessage.readAt && <div className="w-[2px] h-8 bg-[#e2e8f0]" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-[12px] font-medium text-[#1e293b] dark:text-[#f8fafc]">Tersampaikan</p>
                          <p className="text-[11px] font-mono text-[#94a3b8]">{new Date(selectedMessage.deliveredAt).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                    {selectedMessage.readAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#eef2ff] flex items-center justify-center">
                            <Eye size={10} className="text-[#4f46e5]" />
                          </div>
                        </div>
                        <div className="pb-4">
                          <p className="text-[12px] font-medium text-[#1e293b] dark:text-[#f8fafc]">Dibaca</p>
                          <p className="text-[11px] font-mono text-[#94a3b8]">{new Date(selectedMessage.readAt).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                    {selectedMessage.status === 'pending' && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#fef3c7] flex items-center justify-center">
                            <Clock size={10} className="text-[#d97706]" />
                          </div>
                        </div>
                        <div className="pb-4">
                          <p className="text-[12px] font-medium text-[#1e293b] dark:text-[#f8fafc]">Menunggu</p>
                          <p className="text-[11px] font-mono text-[#94a3b8]">{selectedMessage.sentAt ? new Date(selectedMessage.sentAt).toLocaleString('id-ID') : '-'}</p>
                        </div>
                      </div>
                    )}
                    {selectedMessage.status === 'failed' && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#ffe4e6] flex items-center justify-center">
                            <AlertCircle size={10} className="text-[#e11d48]" />
                          </div>
                        </div>
                        <div className="pb-4">
                          <p className="text-[12px] font-medium text-[#f43f5e]">Gagal</p>
                          <p className="text-[11px] text-[#94a3b8]">{selectedMessage.failedReason || 'Tidak diketahui'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {selectedMessage.status === 'failed' && (
                    <Button
                      onClick={() => { handleRetry(selectedMessage.id); setIsDetailOpen(false); }}
                      className="flex-1 bg-[#4f46e5] hover:bg-[#6366f1] text-white gap-2"
                    >
                      <RotateCcw size={14} />
                      Kirim Ulang
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 border-[#e2e8f0] text-[#64748b] gap-2"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
