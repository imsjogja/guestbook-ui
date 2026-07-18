import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function MagicLogin() {
  const [searchParams] = useSearchParams();
  const { consumeMagicLink } = useAuth();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memproses link masuk...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setMessage('Link masuk tidak lengkap.');
      return;
    }
    consumeMagicLink(token)
      .then(() => {
        setState('success');
        setMessage('Anda berhasil masuk ke GuestFlow.');
        window.setTimeout(() => { window.location.href = '/'; }, 500);
      })
      .catch((err: unknown) => {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'Link masuk tidak valid atau sudah kedaluwarsa.');
      });
  }, [consumeMagicLink, searchParams]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b0f19] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151c2c] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8 text-center">
        {state === 'loading' && <Loader2 size={42} className="mx-auto mb-5 text-[#4f46e5] animate-spin" />}
        {state === 'success' && <CheckCircle2 size={42} className="mx-auto mb-5 text-[#059669]" />}
        {state === 'error' && <XCircle size={42} className="mx-auto mb-5 text-[#e11d48]" />}
        <h1 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-3">{state === 'success' ? 'Berhasil masuk' : state === 'error' ? 'Link tidak dapat digunakan' : 'Link masuk'}</h1>
        <p className="text-sm text-[#64748b] leading-relaxed">{message}</p>
        {state === 'error' && <Link to="/login" className="mt-6 w-full h-11 bg-[#4f46e5] text-white rounded-lg flex items-center justify-center font-medium">Kembali ke halaman masuk</Link>}
      </div>
    </div>
  );
}
