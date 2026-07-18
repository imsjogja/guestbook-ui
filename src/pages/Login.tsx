import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, requestPasswordReset, requestMagicLink } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailActionMessage, setEmailActionMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/');
    } catch {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(forgotEmail || email);
      setEmailActionMessage('Jika akun tersedia, link reset kata sandi sudah dikirim. Periksa Inbox atau Spam.');
    } catch {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setEmailActionMessage('Isi email terlebih dahulu untuk menerima link masuk.');
      return;
    }
    try {
      await requestMagicLink(email);
      setEmailActionMessage('Jika akun tersedia dan sudah terverifikasi, link masuk sudah dikirim.');
    } catch {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#f8fafc] dark:bg-[#0b0f19]">
      {/* Left panel - decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[#f8fafc]" />
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#4f46e5]/5 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#4f46e5]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#6366f1]/5 blur-2xl" />
        </div>
        <div className="relative z-10 max-w-md px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#4f46e5] flex items-center justify-center mb-8 shadow-lg">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc] mb-4 leading-snug">
              Kelola tamu acara Anda dengan elegan dan efisien.
            </h2>
            <p className="text-[#64748b] leading-relaxed">
              GuestFlow membantu Anda mengelola undangan, RSVP, check-in QR, dan pengaturan tempat duduk — semua dalam satu platform terpadu.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-[#e2e8f0] border-2 border-white dark:border-[#151c2c] flex items-center justify-center text-xs font-medium text-[#64748b]"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#64748b]">
                <span className="font-semibold text-[#1e293b] dark:text-[#f8fafc]">1,200+</span> event organizer mempercayai GuestFlow
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Dot grid background pattern */}
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
            <div className="w-12 h-12 rounded-xl bg-[#4f46e5] flex items-center justify-center mx-auto mb-4 shadow-md lg:hidden">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">
              GuestFlow
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Platform Manajemen Tamu & Undangan
            </p>
          </div>

          {/* Login card */}
          <motion.div
            animate={shakeError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8 sm:p-10"
          >
            <h2 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-6">
              Masuk ke Akun Anda
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
                    placeholder="••••••••"
                    required
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

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e2e8f0] text-[#4f46e5] focus:ring-[#4f46e5]/20"
                  />
                  <span className="text-sm text-[#64748b]">Ingat Saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setShowForgotPassword((value) => !value); setEmailActionMessage(null); }}
                  className="text-sm text-[#4f46e5] hover:underline transition-colors"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#4f46e5] hover:bg-[#6366f1] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            {showForgotPassword && (
              <form onSubmit={handleForgotPassword} className="mt-5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0b0f19] p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#1e293b] dark:text-[#f8fafc]">Reset kata sandi</p>
                  <p className="text-xs text-[#64748b] mt-1">Masukkan email untuk menerima link reset.</p>
                </div>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#151c2c] text-sm text-[#0f172a] dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                />
                <button type="submit" disabled={isLoading} className="w-full h-10 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-sm font-medium disabled:opacity-70">
                  {isLoading ? 'Mengirim...' : 'Kirim link reset'}
                </button>
              </form>
            )}

            {emailActionMessage && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-[#ecfdf5] border border-[#10b981]/20 text-sm text-[#047857]">
                {emailActionMessage}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#e2e8f0] dark:bg-[#334155]" />
              <span className="text-xs text-[#94a3b8] font-medium">atau</span>
              <div className="flex-1 h-px bg-[#e2e8f0] dark:bg-[#334155]" />
            </div>

            {/* Magic link button */}
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={isLoading}
              className="w-full h-10 bg-[#f1f5f9] hover:bg-[#e2e8f0] dark:bg-[#1e293b] dark:hover:bg-[#334155] text-[#1e293b] dark:text-[#f8fafc] font-medium rounded-lg flex items-center justify-center gap-2 border border-[#e2e8f0] dark:border-[#334155] transition-all duration-150"
            >
              <LinkIcon size={16} />
              Kirim Link Masuk via Email
            </button>
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-[#94a3b8]">
              Belum punya akun?{' '}
              <Link to="/register" className="text-[#4f46e5] hover:underline font-medium">
                Daftar sekarang
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
