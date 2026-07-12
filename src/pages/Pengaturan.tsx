import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Bell,
  Shield,
  Plug,
  Globe,
  Upload,
  Trash2,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  Mail,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
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



const settingTabs = [
  { key: 'profil', label: 'Profil', icon: <User size={18} /> },
  { key: 'tenant', label: 'Branding Tenant', icon: <Building2 size={18} /> },
  { key: 'notifikasi', label: 'Notifikasi', icon: <Bell size={18} /> },
  { key: 'keamanan', label: 'Keamanan', icon: <Shield size={18} /> },
  { key: 'integrasi', label: 'Integrasi', icon: <Plug size={18} /> },
  { key: 'bahasa', label: 'Bahasa & Wilayah', icon: <Globe size={18} /> },
] as const;

type TabKey = typeof settingTabs[number]['key'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
  const { currentTenant } = useTenantStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profil');
  const [isSaving, setIsSaving] = useState(false);

  // Profil state
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('+62 812-3456-7890');
  const [profilePosition, setProfilePosition] = useState('Event Manager');
  const [profileBio, setProfileBio] = useState('');
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
  const [notifCampaignDone, setNotifCampaignDone] = useState(true);
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

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, call an API to update the profile
      // await api.patch('/users/me', { fullName: profileName, email: profileEmail, ... });
      toast.success('Profil berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan profil');
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
      // await api.patch('/users/me/password', { currentPassword, newPassword });
      toast.success('Kata sandi berhasil diperbarui');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordExpanded(false);
    } catch {
      toast.error('Gagal memperbarui kata sandi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTenant = async () => {
    setIsSaving(true);
    try {
      // await api.patch('/tenants/me', { name: tenantName, settings: { timezone: tenantTimezone, ... } });
      toast.success('Pengaturan tenant berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan tenant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotif = async () => {
    setIsSaving(true);
    try {
      // await api.patch('/users/me/notifications', { ... });
      toast.success('Preferensi notifikasi berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan preferensi notifikasi');
    } finally {
      setIsSaving(false);
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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2 border-[#e2e8f0] text-[#64748b]">
                          <Upload size={14} />
                          Unggah Foto Baru
                        </Button>
                        <Button variant="ghost" size="sm" className="text-[#f43f5e] hover:text-[#e11d48] hover:bg-[#ffe4e6] gap-2">
                          <Trash2 size={14} />
                          Hapus Foto
                        </Button>
                      </div>
                      <p className="text-[11px] text-[#94a3b8]">JPG/PNG, maks 2MB</p>
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
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" className="gap-2 border-[#e2e8f0] text-[#64748b]">
                            <Upload size={14} />
                            Unggah Logo
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[#f43f5e] hover:text-[#e11d48] hover:bg-[#ffe4e6] gap-2">
                            <Trash2 size={14} />
                            Hapus Logo
                          </Button>
                        </div>
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
                      { label: 'Kampanye Selesai', desc: 'Kampanye komunikasi selesai dikirim', value: notifCampaignDone, onChange: setNotifCampaignDone },
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
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] text-[#64748b]">
                        Aktifkan
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-[#64748b]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Sesi Aktif</p>
                          <p className="text-[11px] text-[#94a3b8]">1 perangkat saat ini</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] text-[#f43f5e] hover:text-[#e11d48] hover:bg-[#ffe4e6]">
                        Kelola
                      </Button>
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
                  <h2 className="text-[1.125rem] font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-4">Koneksi Layanan</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10b981]">
                          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">WhatsApp Business</p>
                          <p className="text-[11px] text-[#10b981]">Terhubung — +62 812-3456-7890</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] text-[#f43f5e]">
                        Putuskan
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail size={20} className="text-[#3b82f6]" />
                        <div>
                          <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Email SMTP</p>
                          <p className="text-[11px] text-[#10b981]">Terhubung</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] text-[#64748b]">
                        Pengaturan
                      </Button>
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
                  <Button onClick={() => toast.success('Preferensi berhasil disimpan')} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white">
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


