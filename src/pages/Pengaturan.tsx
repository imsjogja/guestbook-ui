import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Bell,
  Shield,
  Plug,
  Globe,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  Mail,
  Loader2,
  QrCode,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSearchParams } from 'react-router-dom';
import { getWhatsAppReadiness, type WhatsAppIntegrationStatus } from '@/lib/whatsapp-onboarding';



const settingTabs = [
  { key: 'profil', label: 'Profil', icon: <User size={18} /> },
  { key: 'tenant', label: 'Branding Tenant', icon: <Building2 size={18} /> },
  { key: 'notifikasi', label: 'Notifikasi', icon: <Bell size={18} /> },
  { key: 'keamanan', label: 'Keamanan', icon: <Shield size={18} /> },
  { key: 'integrasi', label: 'Integrasi', icon: <Plug size={18} /> },
  { key: 'bahasa', label: 'Bahasa & Wilayah', icon: <Globe size={18} /> },
] as const;

type TabKey = typeof settingTabs[number]['key'];

function getInitials(name?: string | null): string {
  return (name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function OnboardingStep({ number, label, complete }: { number: string; label: string; complete: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
      complete
        ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
        : 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] dark:border-[#334155] dark:bg-[#1e293b]'
    )}>
      <span className={cn(
        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
        complete ? 'bg-[#22c55e] text-white' : 'bg-[#e2e8f0] text-[#64748b] dark:bg-[#334155]'
      )}>
        {complete ? <CheckCircle2 size={13} /> : number}
      </span>
      {label}
    </div>
  );
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: 'bg-[#e2e8f0]' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const colors = ['bg-[#f43f5e]', 'bg-[#f59e0b]', 'bg-[#10b981]', 'bg-[#059669]'];
  return { score, label: labels[score - 1] || 'Lemah', color: colors[score - 1] || 'bg-[#f43f5e]' };
}

export default function Pengaturan() {
  const { user, logout } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const { currentTenant, setTenant } = useTenantStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('profil');
  const [isSaving, setIsSaving] = useState(false);

  // Profil state
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePosition, setProfilePosition] = useState(user?.position || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordExpanded, setPasswordExpanded] = useState(false);

  // Tenant state
  const [tenantName, setTenantName] = useState(currentTenant?.name || 'PT. Sukses Abadi');
  const tenantSubdomain = currentTenant?.subdomain || 'perusahaan.guestflow.id';
  const [tenantIndustry, setTenantIndustry] = useState('Pernikahan');
  const [tenantTimezone, setTenantTimezone] = useState(currentTenant?.settings?.timezone || 'Asia/Jakarta');
  const [tenantDateFormat, setTenantDateFormat] = useState('15 Januari 2025');
  const [primaryColor, setPrimaryColor] = useState(currentTenant?.primaryColor || '#4f46e5');
  const [emailFromName, setEmailFromName] = useState(`GuestFlow \u2014 ${currentTenant?.name || 'Tenant'}`);
  const [emailSignature, setEmailSignature] = useState('Salam,\n[{{nama_tenant}}]\n---\nDikirim via GuestFlow');

  // Notifikasi state
  const [notifRSVP, setNotifRSVP] = useState(true);
  const [notifCheckin, setNotifCheckin] = useState(true);
  const [notifInviteFailed, setNotifInviteFailed] = useState(true);
  const [notifDailyDigest, setNotifDailyDigest] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true);
  const [notifTeamActivity, setNotifTeamActivity] = useState(false);
  const [notifWAUrgent, setNotifWAUrgent] = useState(true);
  const [notifWADaily, setNotifWADaily] = useState(false);
  const [notifWAOTP, setNotifWAOTP] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifSound, setNotifSound] = useState(false);
  const [notifBrowser, setNotifBrowser] = useState(false);

  // WhatsApp integration state. Connection details are managed by the platform.
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppIntegrationStatus | null>(null);
  const [whatsappPairing, setWhatsappPairing] = useState(false);
  const [whatsappQR, setWhatsappQR] = useState<string | null>(null);
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('');
  const [whatsappTestMessage, setWhatsappTestMessage] = useState('Tes koneksi WhatsApp GuestFlow.');
  const [whatsappTestSending, setWhatsappTestSending] = useState(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<{ to: string; sent_at?: string } | null>(null);

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const whatsappReadiness = getWhatsAppReadiness(whatsappStatus);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (settingTabs.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab as TabKey);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.fullName || '');
    setProfileEmail(user.email || '');
    setProfilePhone(user.phone || '');
    setProfilePosition(user.position || '');
    setProfileBio(user.bio || '');
  }, [user]);

  useEffect(() => {
    if (!currentTenant) return;
    const settings = (currentTenant.settings ?? {}) as unknown as Record<string, unknown>;
    const notification = (settings.notification_preferences ?? {}) as Record<string, unknown>;
    setTenantName(currentTenant.name || '');
    setTenantTimezone(typeof settings.timezone === 'string' ? settings.timezone : 'Asia/Jakarta');
    setTenantDateFormat(typeof settings.date_format === 'string' ? settings.date_format : '15 Januari 2025');
    setTenantIndustry(typeof settings.industry === 'string' ? settings.industry : 'Pernikahan');
    setPrimaryColor(currentTenant.primaryColor || '#4f46e5');
    setEmailFromName(typeof settings.email_from_name === 'string' ? settings.email_from_name : `GuestFlow - ${currentTenant.name}`);
    setEmailSignature(typeof settings.email_signature === 'string' ? settings.email_signature : 'Salam,\n[{{nama_tenant}}]\n---\nDikirim via GuestFlow');
    setNotifRSVP(notification.email_rsvp !== false);
    setNotifCheckin(notification.email_checkin !== false);
    setNotifInviteFailed(notification.email_invite_failed !== false);
    setNotifDailyDigest(notification.email_daily_digest === true);
    setNotifWeeklyDigest(notification.email_weekly_digest !== false);
    setNotifTeamActivity(notification.email_team_activity === true);
    setNotifWAUrgent(notification.whatsapp_urgent !== false);
    setNotifWADaily(notification.whatsapp_daily === true);
    setNotifWAOTP(notification.whatsapp_otp !== false);
    setNotifInApp(notification.in_app !== false);
    setNotifSound(notification.sound === true);
    setNotifBrowser(notification.browser === true);
  }, [currentTenant]);

  useEffect(() => {
    if (activeTab !== 'integrasi' || !currentTenant?.id) return;
    let mounted = true;
    let firstLoad = true;
    const loadStatus = async () => {
      try {
        const response = await api.get<{ data: WhatsAppIntegrationStatus }>('/integrations/whatsapp');
        if (!mounted) return;
        const nextStatus = response.data.data;
        setWhatsappStatus(nextStatus);
        if (firstLoad) {
          setWhatsappEnabled(nextStatus.enabled);
          firstLoad = false;
        }
        if (nextStatus.connection?.logged_in) {
          setWhatsappPairing(false);
          setWhatsappQR((current) => {
            if (current) URL.revokeObjectURL(current);
            return null;
          });
        }
      } catch {
        if (mounted) setWhatsappStatus(null);
      }
    };
    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      setWhatsappPairing(false);
      setWhatsappQR((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [activeTab, currentTenant?.id]);

  const handleSaveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error('Nama lengkap dan email wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.patch<{ user: NonNullable<typeof user> }>('/auth/me', {
        full_name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        position: profilePosition.trim(),
        bio: profileBio.trim(),
      });
      setUser(response.data.user);
      toast.success('Profil berhasil disimpan');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field kata sandi wajib diisi');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Kata sandi baru tidak cocok');
      return;
    }
    if (passwordStrength.score < 2) {
      toast.error('Kata sandi terlalu lemah');
      return;
    }
    setIsSaving(true);
    try {
      await api.patch('/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordExpanded(false);
      toast.success('Kata sandi berhasil diperbarui. Silakan masuk kembali.');
      logout();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal memperbarui kata sandi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTenant = async () => {
    if (!currentTenant?.id) {
      toast.error('Tenant aktif belum dipilih');
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.patch<{ data: NonNullable<typeof currentTenant> }>(`/tenants/${currentTenant.id}`, {
        name: tenantName.trim(),
        primary_color: primaryColor,
        settings: {
          ...(currentTenant.settings ?? {}),
          timezone: tenantTimezone,
          date_format: tenantDateFormat,
          industry: tenantIndustry,
          email_from_name: emailFromName,
          email_signature: emailSignature,
        },
      });
      setTenant(response.data.data);
      toast.success('Pengaturan tenant berhasil disimpan');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal menyimpan pengaturan tenant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotif = async () => {
    if (!currentTenant?.id) {
      toast.error('Tenant aktif belum dipilih');
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.patch<{ data: NonNullable<typeof currentTenant> }>(`/tenants/${currentTenant.id}`, {
        settings: {
          ...(currentTenant.settings ?? {}),
          notification_preferences: {
            email_rsvp: notifRSVP,
            email_checkin: notifCheckin,
            email_invite_failed: notifInviteFailed,
            email_daily_digest: notifDailyDigest,
            email_weekly_digest: notifWeeklyDigest,
            email_team_activity: notifTeamActivity,
            whatsapp_urgent: notifWAUrgent,
            whatsapp_daily: notifWADaily,
            whatsapp_otp: notifWAOTP,
            in_app: notifInApp,
            sound: notifSound,
            browser: notifBrowser,
          },
        },
      });
      setTenant(response.data.data);
      toast.success('Preferensi notifikasi berhasil disimpan');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal menyimpan preferensi notifikasi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    setIsSaving(true);
    try {
      const response = await api.patch<{ data: WhatsAppIntegrationStatus }>('/integrations/whatsapp', {
        enabled: whatsappEnabled,
      });
      setWhatsappStatus(response.data.data);
      toast.success('Pengaturan WhatsApp disimpan dan langsung diterapkan');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal menyimpan pengaturan WhatsApp');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartWhatsAppPairing = async () => {
    if (!whatsappStatus?.configured) {
      toast.error('Aktifkan pengiriman WhatsApp terlebih dahulu');
      return;
    }
    setWhatsappPairing(true);
    try {
      await api.post('/integrations/whatsapp/pair');
      const response = await api.get<Blob>('/integrations/whatsapp/qr', { responseType: 'blob' });
      const nextQR = URL.createObjectURL(response.data);
      setWhatsappQR((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextQR;
      });
      toast.success('QR pairing siap dipindai dari WhatsApp');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Gagal menghubungkan WhatsApp');
    } finally {
      setWhatsappPairing(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!whatsappTestPhone.trim()) {
      toast.error('Masukkan nomor WhatsApp tujuan untuk uji kirim');
      return;
    }
    if (!whatsappTestMessage.trim()) {
      toast.error('Masukkan pesan uji kirim');
      return;
    }
    setWhatsappTestSending(true);
    setWhatsappTestResult(null);
    try {
      const response = await api.post<{ data: { to: string; sent_at?: string } }>('/integrations/whatsapp/test', {
        to: whatsappTestPhone,
        message: whatsappTestMessage,
      });
      setWhatsappTestResult(response.data.data);
      toast.success('Pesan uji berhasil dikirim');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Pesan uji gagal dikirim');
    } finally {
      setWhatsappTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[2.25rem] font-bold text-[#0f172a] dark:text-[#f8fafc]">Pengaturan</h1>
        <p className="text-sm text-[#64748b] mt-1">Kelola profil, branding tenant, dan preferensi akun</p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left navigation */}
        <div className="lg:w-[240px] flex-shrink-0">
          {/* Mobile horizontal tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {settingTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  activeTab === tab.key
                    ? 'bg-[#eef2ff] text-[#4f46e5]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9]'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop vertical nav */}
          <nav className="hidden lg:flex flex-col gap-0.5 border-r border-[#e2e8f0] dark:border-[#334155] pr-4">
            {settingTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left',
                  activeTab === tab.key
                    ? 'bg-[#eef2ff] text-[#4f46e5]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 max-w-[720px]">
          <AnimatePresence mode="wait">
            {/* TAB: PROFIL */}
            {activeTab === 'profil' && (
              <motion.div
                key="profil"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Foto Profil Card */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Foto Profil</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white text-[1.5rem] font-semibold flex-shrink-0">
                      {user?.fullName ? getInitials(user.fullName) : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] text-[#64748b]">Foto profil belum tersedia.</p>
                        <p className="text-[11px] text-[#94a3b8]">Gunakan inisial akun untuk sementara.</p>
                      </div>
                  </div>
                </div>

                {/* Informasi Dasar Card */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Informasi Dasar</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="prof-name">Nama Lengkap <span className="text-[#f43f5e]">*</span></Label>
                      <Input
                        id="prof-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prof-email">Email <span className="text-[#f43f5e]">*</span></Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prof-phone">Nomor Telepon</Label>
                      <Input
                        id="prof-phone"
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prof-position">Jabatan</Label>
                      <Input
                        id="prof-position"
                        value={profilePosition}
                        onChange={(e) => setProfilePosition(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prof-bio">Bio</Label>
                      <Textarea
                        id="prof-bio"
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        placeholder="Deskripsi singkat tentang Anda"
                        className="mt-1.5 min-h-[80px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                      {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>

                {/* Ubah Kata Sandi Card */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setPasswordExpanded(!passwordExpanded)}
                    className="w-full flex items-center justify-between p-6 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-[#64748b]" />
                      <div className="text-left">
                        <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">Ubah Kata Sandi</h2>
                        <p className="text-[12px] text-[#94a3b8]">Perbarui kata sandi akun Anda</p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className={cn(
                        'text-[#94a3b8] transition-transform duration-200',
                        passwordExpanded && 'rotate-90'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {passwordExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 space-y-4 border-t border-[#e2e8f0] dark:border-[#334155] pt-4">
                          <div>
                            <Label htmlFor="curr-pass">Kata Sandi Saat Ini <span className="text-[#f43f5e]">*</span></Label>
                            <div className="relative mt-1.5">
                              <Input
                                id="curr-pass"
                                type={showPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="h-10 pr-10"
                              />
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="new-pass">Kata Sandi Baru <span className="text-[#f43f5e]">*</span></Label>
                            <div className="relative mt-1.5">
                              <Input
                                id="new-pass"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-10 pr-10"
                              />
                              <button
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                              >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                  {[1, 2, 3, 4].map((i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        'h-1.5 flex-1 rounded-full transition-colors',
                                        i <= passwordStrength.score ? passwordStrength.color : 'bg-[#e2e8f0]'
                                      )}
                                    />
                                  ))}
                                </div>
                                <p className={cn('text-[11px]', passwordStrength.color.replace('bg-', 'text-'))}>
                                  {passwordStrength.label}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="confirm-pass">Konfirmasi Kata Sandi Baru <span className="text-[#f43f5e]">*</span></Label>
                            <Input
                              id="confirm-pass"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={cn(
                                'mt-1.5 h-10',
                                confirmPassword && !passwordsMatch && 'border-[#f43f5e] focus-visible:ring-[#f43f5e]'
                              )}
                            />
                            {confirmPassword && !passwordsMatch && (
                              <p className="text-[11px] text-[#f43f5e] mt-1">Kata sandi tidak cocok</p>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={handleSavePassword} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                              Perbarui Kata Sandi
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Logout Section */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[1.125rem] font-semibold text-[#f43f5e]">Keluar</h2>
                      <p className="text-[12px] text-[#94a3b8] mt-0.5">Keluar dari akun Anda</p>
                    </div>
                    <Button variant="destructive" onClick={logout}>
                      Keluar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: TENANT */}
            {activeTab === 'tenant' && (
              <motion.div
                key="tenant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Informasi Tenant */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Informasi Tenant</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tenant-name">Nama Tenant <span className="text-[#f43f5e]">*</span></Label>
                      <Input
                        id="tenant-name"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-subdomain">Subdomain <span className="text-[#f43f5e]">*</span></Label>
                      <Input
                        id="tenant-subdomain"
                        value={tenantSubdomain}
                        disabled
                        className="mt-1.5 h-10 bg-[#f8fafc] dark:bg-[#1e293b] text-[#94a3b8]"
                      />
                      <p className="text-[11px] text-[#94a3b8] mt-1">Subdomain tidak dapat diubah</p>
                    </div>
                    <div>
                      <Label htmlFor="tenant-industry">Industri</Label>
                      <Select value={tenantIndustry} onValueChange={setTenantIndustry}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pernikahan">Pernikahan</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Korporat">Korporat</SelectItem>
                          <SelectItem value="Pemerintah">Pemerintah</SelectItem>
                          <SelectItem value="Lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenant-timezone">Zona Waktu <span className="text-[#f43f5e]">*</span></Label>
                      <Select value={tenantTimezone} onValueChange={setTenantTimezone}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                          <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                          <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenant-date-format">Format Tanggal</Label>
                      <Select value={tenantDateFormat} onValueChange={setTenantDateFormat}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15 Januari 2025">15 Januari 2025</SelectItem>
                          <SelectItem value="Jan 15, 2025">Jan 15, 2025</SelectItem>
                          <SelectItem value="2025-01-15">2025-01-15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Logo & Warna */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Logo & Warna</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Logo Tenant</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="w-[120px] h-[120px] rounded-xl border-2 border-dashed border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center bg-[#f8fafc] dark:bg-[#1e293b]">
                          <div className="w-12 h-12 rounded-lg bg-[#4f46e5] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">G</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-[#64748b]">Upload logo belum tersedia.</p>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] mt-2">Disarankan: SVG transparan, 1:1 ratio, maks 1MB</p>
                    </div>

                    <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#334155]">
                      <Label className="flex items-center gap-2">
                        <Palette size={16} className="text-[#64748b]" />
                        Warna Tema
                      </Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[#e2e8f0] cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-32 h-10 font-mono text-[13px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryColor('#4f46e5')}
                          className="text-[#94a3b8] hover:text-[#64748b]"
                        >
                          Reset ke Default
                        </Button>
                      </div>
                      {/* Preview */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[11px] text-[#94a3b8]">Pratinjau:</span>
                        <button
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-colors"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Tombol
                        </button>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{ backgroundColor: primaryColor + '15', color: primaryColor, borderColor: primaryColor + '30' }}
                        >
                          Badge
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Branding */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Email Branding</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email-from">Dari Nama</Label>
                      <Input
                        id="email-from"
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-from-addr">Dari Email</Label>
                      <Input
                        id="email-from-addr"
                        value={`noreply@${tenantSubdomain}`}
                        disabled
                        className="mt-1.5 h-10 bg-[#f8fafc] dark:bg-[#1e293b] text-[#94a3b8]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-sig">Signature</Label>
                      <Textarea
                        id="email-sig"
                        value={emailSignature}
                        onChange={(e) => setEmailSignature(e.target.value)}
                        className="mt-1.5 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveTenant} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Simpan Perubahan
                  </Button>
                </div>
              </motion.div>
            )}

            {/* TAB: NOTIFIKASI */}
            {activeTab === 'notifikasi' && (
              <motion.div
                key="notifikasi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Notifikasi Email */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4 flex items-center gap-2">
                    <Mail size={18} className="text-[#64748b]" />
                    Notifikasi Email
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: 'RSVP Baru', desc: 'Tamu baru merespons RSVP', value: notifRSVP, onChange: setNotifRSVP },
                      { label: 'Check-in', desc: 'Tamu melakukan check-in', value: notifCheckin, onChange: setNotifCheckin },
                      { label: 'Undangan Gagal', desc: 'Gagal mengirim undangan ke tamu', value: notifInviteFailed, onChange: setNotifInviteFailed },
                      { label: 'Ringkasan Harian', desc: 'Ringkasan aktivitas harian', value: notifDailyDigest, onChange: setNotifDailyDigest },
                      { label: 'Ringkasan Mingguan', desc: 'Ringkasan aktivitas mingguan setiap Senin', value: notifWeeklyDigest, onChange: setNotifWeeklyDigest },
                      { label: 'Aktivitas Tim', desc: 'Anggota tim melakukan perubahan', value: notifTeamActivity, onChange: setNotifTeamActivity },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">{item.label}</p>
                          <p className="text-[12px] text-[#94a3b8]">{item.desc}</p>
                        </div>
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                          className="data-[state=checked]:bg-[#4f46e5]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifikasi WhatsApp */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10b981]">
                      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                      <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                      <path d="M9.5 15.5a5 5 0 0 0 5 0" />
                    </svg>
                    Notifikasi WhatsApp (Admin)
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Peringatan Urgent', desc: 'RSVP Gagal, Check-in masalah', value: notifWAUrgent, onChange: setNotifWAUrgent },
                      { label: 'Ringkasan Harian via WA', desc: 'Ringkasan aktivitas harian', value: notifWADaily, onChange: setNotifWADaily },
                      { label: 'Kode OTP untuk Login', desc: 'Notifikasi kode verifikasi', value: notifWAOTP, onChange: setNotifWAOTP },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">{item.label}</p>
                          <p className="text-[12px] text-[#94a3b8]">{item.desc}</p>
                        </div>
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                          className="data-[state=checked]:bg-[#4f46e5]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifikasi di Aplikasi */}
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4 flex items-center gap-2">
                    <Bell size={18} className="text-[#64748b]" />
                    Notifikasi di Aplikasi
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Notifikasi Real-time', desc: 'Tampilkan notifikasi saat ada aktivitas', value: notifInApp, onChange: setNotifInApp },
                      { label: 'Bunyi Notifikasi', desc: 'Mainkan suara saat notifikasi masuk', value: notifSound, onChange: setNotifSound },
                      { label: 'Notifikasi Browser', desc: 'Izinkan push notification di browser', value: notifBrowser, onChange: setNotifBrowser },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">{item.label}</p>
                          <p className="text-[12px] text-[#94a3b8]">{item.desc}</p>
                        </div>
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                          className="data-[state=checked]:bg-[#4f46e5]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotif} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Simpan Perubahan
                  </Button>
                </div>
              </motion.div>
            )}

            {/* TAB: KEAMANAN */}
            {activeTab === 'keamanan' && (
              <motion.div
                key="keamanan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Pengaturan Keamanan</h2>
                  <p className="text-sm text-[#64748b]">Fitur keamanan lanjutan akan segera tersedia.</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="text-[#64748b]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Autentikasi Dua Faktor (2FA)</p>
                          <p className="text-[11px] text-[#94a3b8]">Nonaktif</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#94a3b8]">Segera tersedia</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-[#64748b]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Sesi Aktif</p>
                          <p className="text-[11px] text-[#94a3b8]">1 perangkat saat ini</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#94a3b8]">Segera tersedia</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: INTEGRASI */}
            {activeTab === 'integrasi' && (
              <motion.div
                key="integrasi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">WhatsApp Business</h2>
                      <p className="text-xs text-[#64748b] mt-1">Hubungkan WhatsApp untuk mengirim undangan kepada tamu.</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border',
                      whatsappReadiness.ready
                        ? 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/30'
                        : whatsappStatus?.enabled
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30'
                          : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
                    )}>
                      {whatsappReadiness.ready ? 'Siap digunakan' : whatsappStatus?.enabled ? 'Perlu diselesaikan' : 'Belum aktif'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <OnboardingStep number="1" label="Aktifkan" complete={whatsappStatus?.enabled === true} />
                      <OnboardingStep number="2" label="Hubungkan nomor" complete={whatsappStatus?.connection?.logged_in === true} />
                      <OnboardingStep number="3" label="Uji kirim" complete={whatsappTestResult !== null} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#f8fafc] dark:bg-[#1e293b] p-3">
                      <div>
                        <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Aktifkan pengiriman WhatsApp</p>
                      <p className="text-[11px] text-[#94a3b8]">Perubahan langsung diterapkan.</p>
                      </div>
                      <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} className="data-[state=checked]:bg-[#10b981]" />
                    </div>

                    <div className="rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Status WhatsApp</p>
                          <p className="text-[11px] text-[#64748b] mt-1">
                            {whatsappReadiness.message}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleStartWhatsAppPairing}
                          disabled={whatsappPairing || !whatsappStatus?.enabled || !whatsappStatus?.configured}
                          className="border-[#c7d2fe] text-[#4338ca] hover:bg-[#eef2ff]"
                        >
                          {whatsappPairing ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                          {whatsappStatus?.connection?.logged_in ? 'Pair ulang' : 'Hubungkan WhatsApp'}
                        </Button>
                      </div>
                      {whatsappStatus?.connection?.error && (
                        <p className="text-[11px] text-[#dc2626] mt-3">{whatsappStatus.connection.error}</p>
                      )}
                      {whatsappQR && (
                        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-[#f8fafc] dark:bg-[#1e293b] p-4">
                          <img src={whatsappQR} alt="Kode penghubung WhatsApp" className="w-56 h-56 rounded-lg bg-white p-2" />
                          <p className="text-xs text-center text-[#64748b]">Buka WhatsApp &gt; Perangkat tertaut &gt; Tautkan perangkat, lalu pindai kode ini.</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-[#059669]"><MessageCircle size={18} /></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Uji kirim WhatsApp</p>
                          <p className="text-[11px] text-[#64748b] mt-1">Kirim satu pesan percobaan ke nomor Anda sebelum mengirim undangan.</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        <Input
                          value={whatsappTestPhone}
                          onChange={(event) => setWhatsappTestPhone(event.target.value)}
                          placeholder="Nomor tujuan, contoh 0812..."
                          disabled={!whatsappReadiness.ready || whatsappTestSending}
                        />
                        <Textarea
                          value={whatsappTestMessage}
                          onChange={(event) => setWhatsappTestMessage(event.target.value)}
                          rows={3}
                          disabled={!whatsappReadiness.ready || whatsappTestSending}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] text-[#94a3b8]">Gunakan format 08xx atau 62xx.</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestWhatsApp}
                            disabled={!whatsappReadiness.ready || whatsappTestSending}
                            className="border-[#a7f3d0] text-[#047857] hover:bg-[#ecfdf5]"
                          >
                            {whatsappTestSending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                            Uji Kirim
                          </Button>
                        </div>
                        {whatsappTestResult && (
                          <div className="flex items-start gap-2 rounded-lg bg-[#ecfdf5] px-3 py-2 text-xs text-[#166534]">
                            <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                            <span>Pesan diterima layanan untuk {whatsappTestResult.to}. Periksa WhatsApp tujuan.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-5">
                    <Button onClick={handleSaveWhatsApp} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                      {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Simpan & Terapkan
                    </Button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Koneksi Layanan Lain</h2>
                  <div className="flex items-center gap-3 p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                    <Mail size={20} className="text-[#3b82f6]" />
                    <div>
                      <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Email SMTP</p>
                      <p className="text-[11px] text-[#10b981]">Status mengikuti konfigurasi environment server</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: BAHASA */}
            {activeTab === 'bahasa' && (
              <motion.div
                key="bahasa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-6">
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Preferensi Lokal</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Bahasa</Label>
                      <Select defaultValue="id">
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                          <SelectItem value="en" disabled>English (Coming Soon)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-[#94a3b8] mt-1">Saat ini hanya Bahasa Indonesia yang tersedia.</p>
                    </div>
                    <div>
                      <Label>Zona Waktu</Label>
                      <Select defaultValue="asia-jakarta">
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asia-jakarta">Asia/Jakarta (WIB, UTC+7)</SelectItem>
                          <SelectItem value="asia-makassar">Asia/Makassar (WITA, UTC+8)</SelectItem>
                          <SelectItem value="asia-jayapura">Asia/Jayapura (WIT, UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Format Tanggal</Label>
                      <div className="mt-2 space-y-2">
                        {['15 Januari 2025', 'Jan 15, 2025', '15/01/2025', '2025-01-15'].map((fmt) => (
                          <div
                            key={fmt}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              tenantDateFormat === fmt
                                ? 'border-[#4f46e5] bg-[#eef2ff]'
                                : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
                            )}
                            onClick={() => setTenantDateFormat(fmt)}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                tenantDateFormat === fmt ? 'border-[#4f46e5]' : 'border-[#cbd5e1]'
                              )}
                            >
                              {tenantDateFormat === fmt && <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />}
                            </div>
                            <span className="text-sm text-[#1e293b] dark:text-[#f8fafc]">{fmt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Mata Uang</Label>
                      <Select defaultValue="idr">
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idr">IDR - Rupiah Indonesia</SelectItem>
                          <SelectItem value="usd">USD - US Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveTenant} disabled={isSaving} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Simpan Perubahan
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
