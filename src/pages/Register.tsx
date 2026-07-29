import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  MailCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Register() {
  const navigate = useNavigate();
  const { register, resendVerification, isLoading, error, errorCode } = useAuth();

  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendFailed, setResendFailed] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
      return;
    }

    if (password.length < 8) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
      return;
    }

    try {
      const result = await register({
        fullName,
        email,
        password,
        tenantName,
      });
      if ('email_verification_required' in result && result.email_verification_required) {
        setVerificationRequired(true);
        setResendMessage(null);
        setResendFailed(false);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? errorCode;
      if (code === 'EMAIL_DELIVERY_FAILED') {
        setVerificationRequired(true);
        setResendFailed(true);
        setResendMessage('Akun owner sudah dibuat, tetapi email awal belum berhasil dikirim. Gunakan tombol di bawah untuk mencoba lagi.');
      }
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification(email);
      setResendFailed(false);
      setResendMessage('Email verifikasi baru sudah dikirim. Periksa Inbox atau Spam.');
    } catch {
      setResendFailed(true);
      setResendMessage('Email belum berhasil dikirim ulang. Periksa konfigurasi email atau coba lagi beberapa saat.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#f8fafc] dark:bg-[#0b0f19]">
      {/* Left panel - video hero (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end bg-[#0f172a]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/guestflow-login-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/80 via-[#0f172a]/25 to-[#4f46e5]/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/85 via-transparent to-transparent" />
        <div className="relative z-10 max-w-xl px-10 pb-12 xl:px-14 xl:pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-8 shadow-lg">
              <img
                src="/logos/guestflow-ikon.svg"
                alt="GuestFlow"
                className="w-12 h-12 rounded-xl"
              />
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
              Mulai kelola acara Anda dengan alur yang lebih rapi.
            </h2>
            <p className="text-white/75 leading-relaxed max-w-lg">
              Daftar sebagai Tenant Owner, verifikasi email, lalu siapkan acara,
              tamu, undangan, RSVP, dan check-in dalam satu workspace.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: 'Trial', value: '14 hari' },
                { label: 'Role', value: 'Owner' },
                { label: 'Email', value: 'Wajib' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Brand header */}
          <div className="text-center mb-8">
            <img
              src="/logos/guestflow-ikon.svg"
              alt="GuestFlow"
              className="w-12 h-12 rounded-xl mx-auto mb-4 shadow-md lg:hidden"
            />
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">
              GuestFlow
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Buat Akun Baru
            </p>
          </div>

          {/* Register card */}
          <motion.div
            animate={shakeError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8 sm:p-10"
          >
            {verificationRequired ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center mx-auto mb-5">
                  <MailCheck size={28} />
                </div>
                <h2 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-3">
                  Cek email Anda
                </h2>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  Tautan verifikasi akan dikirim ke <strong className="text-[#1e293b]">{email}</strong>. Verifikasi email sebelum masuk ke GuestFlow sebagai Tenant Owner.
                </p>
                {error && (
                  <p className="mt-4 px-3 py-2 rounded-lg bg-[#fff1f2] text-sm text-[#e11d48]">
                    {error}
                  </p>
                )}
                {resendMessage && (
                  <p className={`mt-4 px-3 py-2 rounded-lg text-sm ${resendFailed ? 'bg-[#fff1f2] text-[#e11d48]' : 'bg-[#ecfdf5] text-[#047857]'}`}>
                    {resendMessage}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={isLoading}
                  className="mt-6 w-full h-11 border border-[#c7d2fe] text-[#4f46e5] hover:bg-[#eef2ff] font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {isLoading ? 'Mengirim ulang...' : 'Kirim ulang email verifikasi'}
                </button>
                <Link
                  to="/login"
                  className="mt-3 w-full h-11 bg-[#4f46e5] hover:bg-[#6366f1] text-white font-medium rounded-lg flex items-center justify-center transition-colors"
                >
                  Kembali ke halaman masuk
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-6">
                  Daftar Akun GuestFlow
                </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 rounded-lg bg-[#fff1f2] dark:bg-[rgba(244,63,94,0.1)] border border-[#f43f5e]/20 text-sm text-[#f43f5e]"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  />
                </div>
              </div>

              {/* Workspace / tenant */}
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Nama Workspace / Mitra
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Contoh: Wedding Organizer Bambang"
                    required
                    minLength={2}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#94a3b8]">Anda otomatis menjadi Tenant Owner workspace ini.</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    minLength={8}
                    className="w-full h-10 pl-9 pr-10 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    required
                    className="w-full h-10 pl-9 pr-10 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm text-[#0f172a] dark:text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
                  />
                </div>
              </div>

              {/* Register button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#4f46e5] hover:bg-[#6366f1] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  'Daftar'
                )}
              </button>
            </form>
              </>
            )}
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-[#94a3b8]">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#4f46e5] hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
            <p className="text-xs text-[#94a3b8]">
              &copy; 2025 GuestFlow. Hak Cipta Dilindungi.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
