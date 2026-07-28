import { CheckCircle2, MessageCircle, Settings2, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  getWhatsAppReadiness,
  type WhatsAppIntegrationStatus,
} from '@/lib/whatsapp-onboarding';

interface WhatsAppOnboardingCardProps {
  status: WhatsAppIntegrationStatus | null;
  onOpenSettings: () => void;
}

export function WhatsAppOnboardingCard({ status, onOpenSettings }: WhatsAppOnboardingCardProps) {
  const readiness = getWhatsAppReadiness(status);
  if (readiness.ready) return null;

  const enabled = status?.enabled === true;
  const configured = status?.configured === true;

  return (
    <div className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-4 dark:border-[#7c2d12] dark:bg-[#2b170d]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffedd5] text-[#c2410c] dark:bg-[#431407]">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#7c2d12] dark:text-[#fed7aa]">{readiness.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#9a3412] dark:text-[#fdba74]">{readiness.message}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenSettings}
          className="border-[#fdba74] bg-white text-[#c2410c] hover:bg-[#ffedd5] dark:bg-transparent dark:text-[#fdba74]"
        >
          <Settings2 size={15} />
          Buka Integrasi
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Step label="Aktifkan pengiriman" complete={enabled} icon={<Settings2 size={14} />} />
        <Step label="Hubungkan nomor" complete={configured && status?.connection?.logged_in === true} icon={<Smartphone size={14} />} />
        <Step label="Uji koneksi" complete={false} icon={<CheckCircle2 size={14} />} />
      </div>
    </div>
  );
}

function Step({ label, complete, icon }: { label: string; complete: boolean; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#fed7aa] bg-white/70 px-3 py-2 text-xs dark:border-[#7c2d12] dark:bg-black/10">
      <span className={complete ? 'text-[#16a34a]' : 'text-[#c2410c]'}>{complete ? <CheckCircle2 size={14} /> : icon}</span>
      <span className={complete ? 'text-[#166534]' : 'text-[#9a3412]'}>{label}</span>
    </div>
  );
}
