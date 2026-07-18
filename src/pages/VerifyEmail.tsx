import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memverifikasi email Anda...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setMessage('Tautan verifikasi tidak lengkap.');
      return;
    }

    api.get('/auth/verify-email', { params: { token } })
      .then(() => {
        setState('success');
        setMessage('Email berhasil diverifikasi. Anda sekarang dapat masuk ke GuestFlow.');
      })
      .catch((error: unknown) => {
        const response = error as { response?: { data?: { message?: string } } };
        setState('error');
        setMessage(response.response?.data?.message ?? 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8 text-center">
        {state === 'loading' && <Loader2 size={42} className="mx-auto mb-5 text-[#4f46e5] animate-spin" />}
        {state === 'success' && <CheckCircle2 size={42} className="mx-auto mb-5 text-[#059669]" />}
        {state === 'error' && <XCircle size={42} className="mx-auto mb-5 text-[#e11d48]" />}
        <h1 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-3">{state === 'success' ? 'Email terverifikasi' : state === 'error' ? 'Verifikasi gagal' : 'Verifikasi email'}</h1>
        <p className="text-sm text-[#64748b] leading-relaxed">{message}</p>
        {state !== 'loading' && (
          <Link to="/login" className="mt-6 w-full h-11 bg-[#4f46e5] hover:bg-[#6366f1] text-white font-medium rounded-lg flex items-center justify-center transition-colors">
            Ke halaman masuk
          </Link>
        )}
      </div>
    </div>
  );
}
