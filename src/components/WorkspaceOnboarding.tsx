import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Building2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTenants } from '@/hooks/useTenants';
import { slugifyTenantName } from '@/lib/slugify';
import { toast } from 'sonner';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function WorkspaceOnboarding() {
  const { createTenant, isCreating, error } = useTenants();
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setTenantSlug(slugifyTenantName(tenantName));
    }
  }, [tenantName, slugTouched]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = tenantName.trim();
    const slug = slugifyTenantName(tenantSlug || tenantName);

    if (!name || !slug) {
      return;
    }

    try {
      await createTenant({ name, slug });
      toast.success('Tenant berhasil dibuat');
      setTenantName('');
      setTenantSlug('');
      setSlugTouched(false);
    } catch {
      // Error state is rendered inline.
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#f8fafc] dark:bg-[#0b0f19] p-4 sm:p-6">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOutExpo }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-3xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#151c2c] shadow-[0_20px_80px_rgba(15,23,42,0.12)] p-8 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)] px-3 py-1 text-xs font-semibold text-[#4f46e5] mb-6">
              <Sparkles size={14} />
              Langkah pertama workspace
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc] leading-tight">
              Buat tenant dulu, lalu lanjut ke acara, tamu, undangan, dan check-in.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#64748b] leading-relaxed">
              Akun Anda belum terhubung ke tenant. Isi nama tenant di sebelah kanan untuk mulai pakai GuestFlow tanpa harus pindah halaman.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#475569]">
              {[
                'Tenant baru akan langsung dipilih sebagai workspace aktif.',
                'Setelah itu Anda bisa membuat acara pertama dari menu Acara.',
                'Barcode undangan, RSVP, check-in, dan seating akan aktif setelah event dibuat.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#4f46e5]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#151c2c] shadow-[0_20px_80px_rgba(15,23,42,0.12)] p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.15)] flex items-center justify-center text-[#4f46e5]">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                  Buat Tenant
                </h2>
                <p className="text-sm text-[#64748b]">
                  Mulai dari nama yang mudah dikenali.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#fff1f2] px-4 py-3 text-sm text-[#e11d48]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#64748b]">
                  Nama Tenant
                </label>
                <Input
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="PT Sukses Abadi"
                  autoComplete="organization"
                  required
                  className="h-11 border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#64748b]">
                  Slug / Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tenantSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setTenantSlug(slugifyTenantName(e.target.value));
                    }}
                    placeholder="sukses-abadi"
                    autoComplete="off"
                    required
                    className="h-11 border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20"
                  />
                  <span className="hidden sm:inline-flex h-11 items-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs text-[#64748b]">
                    .guestflow.id
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-[#4f46e5] hover:bg-[#6366f1] gap-2"
                disabled={isCreating}
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Buat Tenant dan Lanjutkan
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
