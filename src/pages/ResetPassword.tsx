import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: searchParams.get('token'), password });
      setMessage('Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.');
    } catch (err: unknown) {
      const response = err as { response?: { data?: { message?: string } } };
      setError(response.response?.data?.message ?? 'Link reset tidak valid atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8">
        <div className="w-12 h-12 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center mx-auto mb-5"><Lock size={21} /></div>
        <h1 className="text-xl font-semibold text-center text-[#0f172a] dark:text-[#f8fafc]">Buat kata sandi baru</h1>
        <p className="text-sm text-[#64748b] text-center mt-2 mb-6">Gunakan kata sandi minimal 8 karakter.</p>
        {error && <div className="mb-4 px-4 py-3 rounded-lg bg-[#fff1f2] border border-[#f43f5e]/20 text-sm text-[#be123c]">{error}</div>}
        {message ? (
          <div className="text-center">
            <p className="text-sm text-[#047857]">{message}</p>
            <Link to="/login" className="mt-6 w-full h-11 bg-[#4f46e5] text-white rounded-lg flex items-center justify-center font-medium">Ke halaman masuk</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required placeholder="Kata sandi baru" className="w-full h-11 px-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required placeholder="Ulangi kata sandi" className="w-full h-11 px-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0b0f19] text-sm" />
            <button type="submit" disabled={loading} className="w-full h-11 bg-[#4f46e5] hover:bg-[#6366f1] text-white rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-70">{loading && <Loader2 size={17} className="animate-spin" />}{loading ? 'Menyimpan...' : 'Simpan kata sandi'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
