import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { cn } from '@/lib/utils';
import { useCheckin, useEventAccess } from '@/hooks';
import { useGuests } from '@/hooks';
import {
  ScanLine,
  Search,
  Check,
  X,
  UserPlus,
  Clock,
  Camera,
  CameraOff,
  RefreshCw,
  ChevronRight,
  Users,
  Keyboard,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeScanToken } from '@/lib/scan-token';
import { useTenantStore } from '@/store/tenantStore';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Types ────────────────────────────────────────────

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

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0"><Check size={20} className="text-white" /></div>;
    case 'walk_in':
      return <div className="w-10 h-10 rounded-full bg-[#f59e0b] flex items-center justify-center flex-shrink-0"><UserPlus size={20} className="text-white" /></div>;
    case 'error':
      return <div className="w-10 h-10 rounded-full bg-[#f43f5e] flex items-center justify-center flex-shrink-0"><X size={20} className="text-white" /></div>;
    default:
      return null;
  }
}

function getCheckinMethodLabel(method: string): string {
  if (method === 'self_service') return 'Mandiri';
  if (method === 'qr') return 'Scan QR';
  if (method === 'manual') return 'Manual';
  return 'Walk-in';
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.floor(diffHour / 24)} hari lalu`;
}

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Izin kamera ditolak. Izinkan kamera untuk situs ini, lalu tekan Nyalakan Kamera lagi.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Kamera tidak ditemukan pada perangkat ini.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.';
    }
  }
  return 'Kamera belum dapat digunakan. Pastikan halaman dibuka melalui HTTPS dan izin kamera tersedia.';
}

// ── Scanner Tab Component ────────────────────────────

function ScannerTab({ onCheckinSuccess }: { onCheckinSuccess: (name: string) => void }) {
  const [cameraOn, setCameraOn] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [overlay, setOverlay] = useState<'success' | 'error' | null>(null);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const processScanRef = useRef<(rawValue: string) => void>(() => {});
  const lastTokenRef = useRef({ token: '', scannedAt: 0 });
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scanToken } = useCheckin();

  const clearOverlay = () => {
    setOverlay(null);
    setOverlayTitle('');
    setOverlayMessage('');
  };

  useEffect(() => {
    if (!overlay) return;
    overlayTimer.current = setTimeout(() => {
      clearOverlay();
    }, overlay === 'success' ? 2200 : 2800);
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, [overlay]);

  useEffect(() => {
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, []);

  const processScan = useCallback(async (rawValue: string) => {
    const token = normalizeScanToken(rawValue);
    if (!token) {
      setOverlayTitle('Token kosong');
      setOverlayMessage('Tempel token QR, barcode, atau URL undangan terlebih dahulu.');
      setOverlay('error');
      return;
    }

    const now = Date.now();
    if (processingRef.current || (lastTokenRef.current.token === token && now - lastTokenRef.current.scannedAt < 3000)) {
      return;
    }

    processingRef.current = true;
    lastTokenRef.current = { token, scannedAt: now };
    setIsScanning(true);
    setScanInput(rawValue);
    try {
      await scanToken(token, `QR/barcode scan: ${token}`, 1);
      const label = token.length > 18 ? `${token.slice(0, 18)}…` : token;
      setOverlayTitle('Check-in Berhasil');
      setOverlayMessage(label);
      setOverlay('success');
      onCheckinSuccess(label);
      setScanInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memindai QR';
      if (/already checked in|sudah check-in/i.test(msg)) {
        setOverlayTitle('Sudah Check-in');
      } else if (/another event|event lain|acara lain/i.test(msg)) {
        setOverlayTitle('Acara Tidak Sesuai');
      } else {
        setOverlayTitle('QR tidak valid');
      }
      setOverlayMessage(msg);
      setOverlay('error');
    } finally {
      setIsScanning(false);
      processingRef.current = false;
    }
  }, [onCheckinSuccess, scanToken]);

  const handleScan = useCallback(() => {
    void processScan(scanInput);
  }, [processScan, scanInput]);

  useEffect(() => {
    processScanRef.current = processScan;
  }, [processScan]);

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;

    let cancelled = false;
    let controls: IScannerControls | null = null;
    const reader = new BrowserMultiFormatReader();
    const videoElement = videoRef.current;
    setCameraError('');
    setCameraReady(false);

    const startCamera = async () => {
      try {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (cancelled) return;
        controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: 'environment' } } },
          videoElement,
          (result) => {
            if (cancelled || !result) return;
            setCameraReady(true);
            void processScanRef.current(result.getText());
          },
        );
        if (!cancelled) {
          scannerControlsRef.current = controls;
          setCameraReady(true);
        } else {
          controls.stop();
        }
      } catch (error: unknown) {
        if (cancelled) return;
        setCameraReady(false);
        setCameraError(getCameraErrorMessage(error));
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      controls?.stop();
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      const stream = videoElement.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoElement.srcObject = null;
    };
  }, [cameraOn]);

  useEffect(() => () => {
    scannerControlsRef.current?.stop();
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative w-full min-h-[420px] bg-[#0f172a] rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] opacity-80" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(79,70,229,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.06) 0%, transparent 50%)`,
        }} />

        <div className="relative z-10 w-full max-w-xl px-6 py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Scan Mode</p>
              <h3 className="text-2xl font-semibold text-white mt-1">QR / Barcode Check-in</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setCameraOn(!cameraOn)}
            >
              {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}
              {cameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="mb-5 flex items-center justify-center">
              <div className="relative w-[260px] h-[260px]">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-[3px] border-t-[3px] border-[#10b981] rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-[3px] border-t-[3px] border-[#10b981] rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-[3px] border-b-[3px] border-[#10b981] rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-[3px] border-b-[3px] border-[#10b981] rounded-br-sm" />
                {cameraOn && <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full rounded-xl object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="text-center px-6">
                    {!cameraOn && <Camera size={44} className="mx-auto text-white/80 mb-3" />}
                    <p className="text-white font-medium">
                      {cameraOn ? 'Arahkan QR / Barcode ke kamera' : 'Kamera sedang dimatikan'}
                    </p>
                    <p className="text-white/70 text-xs mt-2">
                      {cameraError || (cameraReady ? 'QR akan diproses otomatis saat terbaca.' : 'Menyiapkan kamera...')}
                    </p>
                  </div>
                </div>
                <motion.div
                  className="absolute left-0 right-0 h-[2px] bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  animate={isScanning ? { top: ['0%', '100%', '0%'] } : { top: '50%' }}
                  transition={{ duration: 2, ease: 'linear', repeat: isScanning ? Infinity : 0 }}
                />
              </div>
              </div>

              {cameraError && (
                <p className="mt-3 rounded-lg border border-[#fda4af]/30 bg-[#f43f5e]/10 px-3 py-2 text-center text-xs text-[#fecdd3]">
                  {cameraError}
                </p>
              )}

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Tempel token QR, barcode, atau URL undangan"
                  className="h-11 rounded-lg border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleScan();
                    }
                  }}
                />
                <Button
                  type="button"
                  className="h-11 bg-[#10b981] hover:bg-[#059669] text-white gap-2"
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Proses Scan
                </Button>
              </div>
              <p className="text-xs text-white/55">
                Scanner barcode fisik biasanya langsung mengetikkan token ke kolom ini, jadi alur tetap bisa dipakai di lokasi acara.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {overlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${overlay === 'success' ? 'bg-[#10b981]/95' : 'bg-[#f43f5e]/95'}`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center mb-6"
              >
                {overlay === 'success' ? <Check size={40} className="text-white" /> : <X size={40} className="text-white" />}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white text-2xl font-bold"
              >
                {overlayTitle}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/85 text-sm mt-2 text-center px-8"
              >
                {overlayMessage}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setScanInput('')}>
          <RefreshCw size={16} />
          Bersihkan
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => {
            setCameraOn(true);
            setScanInput('');
          }}
        >
          <Camera size={16} />
          Reset Scanner
        </Button>
      </div>
    </div>
  );
}

// ── Manual Tab Component ─────────────────────────────

function ManualTab({ onCheckinSuccess }: { onCheckinSuccess: (_name: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<import('@/types').Guest | null>(null);
  const [paxCount, setPaxCount] = useState(1);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ fullName: '', phone: '', category: 'friend' as string, pax: 1 });
  const [checkedIn, setCheckedIn] = useState(false);
  const [walkInCheckedIn, setWalkInCheckedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const currentEventId = useTenantStore((s) => s.currentEvent?.id);
  const { guests, isLoading: guestsLoading } = useGuests(currentEventId);
  const { checkin, walkIn } = useCheckin();

  const filteredGuests = searchQuery.length >= 2
    ? guests.filter(g =>
        g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.phone && g.phone.includes(searchQuery))
      )
    : [];

  const handleCheckIn = async () => {
    if (!selectedGuest) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await checkin(selectedGuest.id, 'manual', `Check-in manual, pax: ${paxCount}`, paxCount);
      setCheckedIn(true);
      onCheckinSuccess(selectedGuest.fullName);
      setTimeout(() => {
        setCheckedIn(false);
        setSelectedGuest(null);
        setSearchQuery('');
        setPaxCount(1);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melakukan check-in';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalkIn = async () => {
    if (!walkInForm.fullName) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await walkIn({
        fullName: walkInForm.fullName,
        phone: walkInForm.phone || undefined,
        guestType: walkInForm.category,
        actualPax: walkInForm.pax,
        adults: walkInForm.pax,
        children: 0,
      });
      setWalkInCheckedIn(true);
      onCheckinSuccess(`Walk-in: ${walkInForm.fullName}`);
      setTimeout(() => {
        setWalkInCheckedIn(false);
        setWalkInForm({ fullName: '', phone: '', category: 'friend', pax: 1 });
        setShowWalkIn(false);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan walk-in';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {submitError && (
        <div className="p-3 rounded-lg bg-[#ffe4e6] text-[#e11d48] text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          placeholder="Cari nama tamu, nomor telepon, atau email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedGuest(null); }}
          className="pl-10 h-12 text-base border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20"
        />
        {guestsLoading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#94a3b8]" />
        )}
      </div>

      {/* Search Results */}
      {filteredGuests.length > 0 && !selectedGuest && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-white dark:bg-[#151c2c] divide-y divide-[#f1f5f9]"
        >
          {filteredGuests.map((guest) => (
            <button
              key={guest.id}
              onClick={() => setSelectedGuest(guest)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] flex items-center justify-center">
                  <Users size={18} className="text-[#4f46e5]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#0f172a] dark:text-[#f8fafc]">{guest.fullName}</p>
                  <p className="text-xs text-[#64748b]">{guest.phone || '-'} &middot; {guest.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getCategoryBadge(guest.category)}
                <ChevronRight size={16} className="text-[#94a3b8]" />
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {/* Check-in Form */}
      <AnimatePresence>
        {selectedGuest && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6"
          >
            {checkedIn ? (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center mx-auto mb-4"
                >
                  <Check size={32} className="text-white" />
                </motion.div>
                <p className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Check-in Berhasil!</p>
                <p className="text-sm text-[#64748b] mt-1">{selectedGuest.fullName}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] flex items-center justify-center">
                    <Users size={18} className="text-[#4f46e5]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">{selectedGuest.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getCategoryBadge(selectedGuest.category)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Telepon</label>
                    <div className="flex items-center gap-2 text-sm text-[#0f172a] dark:text-[#f8fafc]">
                      <Phone size={14} className="text-[#94a3b8]" />
                      {selectedGuest.phone || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Email</label>
                    <div className="flex items-center gap-2 text-sm text-[#0f172a] dark:text-[#f8fafc]">
                      <Mail size={14} className="text-[#94a3b8]" />
                      {selectedGuest.email || '-'}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Jumlah Tamu (Pax)</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                    >
                      -
                    </Button>
                    <span className="text-lg font-semibold w-8 text-center">{paxCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setPaxCount(paxCount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedGuest(null)}>
                    Batal
                  </Button>
                  <Button className="flex-1 bg-[#4f46e5] hover:bg-[#6366f1] gap-2" onClick={handleCheckIn} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Check-in
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Walk-in Registration */}
      <div className="border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowWalkIn(!showWalkIn)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center">
              <UserPlus size={16} className="text-[#d97706]" />
            </div>
            <span className="font-medium text-sm text-[#0f172a] dark:text-[#f8fafc]">Daftar Walk-in Baru</span>
          </div>
          <ChevronRight
            size={16}
            className={cn('text-[#94a3b8] transition-transform', showWalkIn && 'rotate-90')}
          />
        </button>

        <AnimatePresence>
          {showWalkIn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: easeOutExpo }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 border-t border-[#f1f5f9] dark:border-[#334155]">
                {walkInCheckedIn ? (
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center mx-auto mb-4"
                    >
                      <Check size={32} className="text-white" />
                    </motion.div>
                    <p className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">Walk-in Berhasil!</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Nama Lengkap <span className="text-[#f43f5e]">*</span></label>
                      <Input
                        placeholder="Nama lengkap tamu"
                        value={walkInForm.fullName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, fullName: e.target.value })}
                        className="border-[#e2e8f0] focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Nomor Telepon</label>
                      <Input
                        placeholder="08xx-xxxx-xxxx"
                        value={walkInForm.phone}
                        onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                        className="border-[#e2e8f0] focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Tipe Tamu</label>
                      <select
                        value={walkInForm.category}
                        onChange={(e) => setWalkInForm({ ...walkInForm, category: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white dark:bg-[#151c2c] text-sm text-[#0f172a] dark:text-[#f8fafc] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none"
                      >
                        <option value="vip">VIP</option>
                        <option value="family">Keluarga</option>
                        <option value="friend">Teman</option>
                        <option value="colleague">Rekan</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Jumlah Tamu <span className="text-[#f43f5e]">*</span></label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setWalkInForm({ ...walkInForm, pax: Math.max(1, walkInForm.pax - 1) })}
                        >
                          -
                        </Button>
                        <span className="text-lg font-semibold w-8 text-center">{walkInForm.pax}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setWalkInForm({ ...walkInForm, pax: walkInForm.pax + 1 })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-[#f59e0b] hover:bg-[#d97706] gap-2"
                      onClick={handleWalkIn}
                      disabled={!walkInForm.fullName || isSubmitting}
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Check-in Walk-in
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Recent Tab Component ─────────────────────────────

function RecentTab({ checkins, isLoading }: { checkins: import('@/types').Checkin[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock size={48} className="text-[#e2e8f0] mx-auto mb-4" />
        <p className="text-[#94a3b8] text-sm">Belum ada check-in hari ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {checkins.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, duration: 0.3, ease: easeOutExpo }}
          className="flex items-center gap-4 p-4 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl hover:shadow-sm transition-shadow"
        >
          {getStatusIcon(item.checkinMethod === 'walk_in' ? 'walk_in' : 'success')}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-[#0f172a] dark:text-[#f8fafc] truncate">
              {item.checkinMethod === 'walk_in' ? `Walk-in: ${item.notes || 'Tamu'}` : item.guestId}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#64748b] font-mono">
                {new Date(item.checkedInAt).toLocaleTimeString('id-ID', { hour12: false })}
              </span>
              <span className="text-[#e2e8f0]">|</span>
              <span className="text-xs text-[#94a3b8]">
              {getCheckinMethodLabel(item.checkinMethod)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] border-[#e2e8f0]">
              {item.checkedInBy}
            </Badge>
            {item.seatAssignment && (
              <Badge className="bg-[#d1fae5] text-[#059669] border-[#a7f3d0] text-[10px]">
                {item.seatAssignment}
              </Badge>
            )}
            <span className="text-xs text-[#94a3b8] ml-1">{formatTimeAgo(item.checkedInAt)}</span>
          </div>
        </motion.div>
      ))}
      <p className="text-center text-xs text-[#94a3b8] pt-2">
        Menampilkan {checkins.length} check-in terbaru
      </p>
    </div>
  );
}

// ── Main Check-in Page ───────────────────────────────

export default function Checkin() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { checkins, stats, isLoading, error, refetch } = useCheckin();
  const { access, isLoading: isLoadingAccess } = useEventAccess();

  const handleCheckinSuccess = useCallback((_name: string) => {
    // Trigger a refetch after a short delay to get updated data
    setTimeout(() => {
      refetch();
    }, 500);
  }, [refetch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle size={48} className="text-[#f43f5e] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Gagal memuat data check-in</p>
        <p className="text-sm text-[#64748b] mb-4">{error}</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!isLoadingAccess && !access?.permissions.includes('checkin:read')) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={48} className="text-[#f59e0b] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Akses check-in terbatas</p>
        <p className="text-sm text-[#64748b] max-w-md">
          Role Anda tidak memiliki izin melihat atau memproses check-in. Gunakan Registration Officer, Usher, Event Manager, atau Tenant Owner.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
    >
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc]">Check-in Tamu</h1>
          <p className="text-sm text-[#64748b] mt-1">Pindai QR code atau cari tamu secara manual</p>
        </div>

        {/* Live Stats */}
        <div className="flex items-center gap-4 lg:gap-6 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-4 py-3">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]" />
                </span>
                <span className="text-sm text-[#0f172a] dark:text-[#f8fafc]">
                  Check-in Hari Ini: <strong className="font-mono">{stats.totalToday}</strong>
                </span>
              </div>
              <div className="text-sm text-[#0f172a] dark:text-[#f8fafc]">
                Total Hadir: <strong className="font-mono">{stats.total}</strong>
              </div>
              <div className="text-sm text-[#64748b]">
                Sisa: <strong className="font-mono">{Math.max(0, stats.total - stats.totalToday)}</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] p-1 h-11">
          <TabsTrigger
            value="scanner"
            className="gap-2 data-[state=active]:bg-[#eef2ff] data-[state=active]:text-[#4f46e5] rounded-lg px-4"
          >
            <ScanLine size={16} />
            Scanner
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="gap-2 data-[state=active]:bg-[#eef2ff] data-[state=active]:text-[#4f46e5] rounded-lg px-4"
          >
            <Keyboard size={16} />
            Manual
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="gap-2 data-[state=active]:bg-[#eef2ff] data-[state=active]:text-[#4f46e5] rounded-lg px-4"
          >
            <Clock size={16} />
            Terbaru
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-0">
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Scanner Area - 60% */}
            <div className="xl:w-[60%]">
              <ScannerTab onCheckinSuccess={handleCheckinSuccess} />
            </div>

            {/* Recent Sidebar - 40% */}
            <div className="xl:w-[40%]">
              <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#f1f5f9] dark:border-[#334155]">
                  <h3 className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">Check-in Terbaru</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8]">Auto-refresh</span>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                </div>
                <div className="p-3 max-h-[560px] overflow-y-auto space-y-2">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : (
                    checkins.slice(0, 8).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={index === 0 ? { opacity: 0, y: -12 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: easeOutExpo }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          item.checkinMethod === 'walk_in' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                        )}>
                          {item.checkinMethod === 'walk_in' ? <UserPlus size={14} className="text-white" /> : <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc] truncate">
                            {item.checkinMethod === 'walk_in' ? `Walk-in: ${item.notes || 'Tamu'}` : item.guestId}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-[#94a3b8] font-mono">
                              {new Date(item.checkedInAt).toLocaleTimeString('id-ID', { hour12: false })}
                            </span>
                            <span className="text-[11px] text-[#94a3b8]">
                          {getCheckinMethodLabel(item.checkinMethod)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.seatAssignment && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d1fae5] text-[#059669]">{item.seatAssignment}</span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-0">
          <div className="max-w-2xl">
            <ManualTab onCheckinSuccess={handleCheckinSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {!isLoading && <RefreshCw size={14} className={cn(autoRefresh && "animate-spin text-[#10b981]")} />}
              <span className="text-sm text-[#64748b]">
                {isLoading ? 'Memuat data...' : autoRefresh ? 'Data terbaru' : 'Auto-refresh dimatikan'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94a3b8]">Auto-refresh</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
          </div>
          <RecentTab checkins={checkins} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
