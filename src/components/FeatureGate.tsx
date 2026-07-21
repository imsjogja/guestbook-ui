import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSubscription, type PlanFeatures } from '@/hooks/useSubscription';

interface FeatureGateProps {
  /** The feature key to check against the current plan */
  feature: keyof PlanFeatures;
  /** Content to show when feature is accessible */
  children: React.ReactNode;
  /** Optional custom message for locked state */
  lockedMessage?: string;
  /** If true, render a minimal inline badge instead of a full overlay */
  inline?: boolean;
}

/**
 * FeatureGate wraps content that should only be accessible on certain plans.
 * Shows a locked UI when the current plan doesn't include the feature.
 *
 * Usage:
 * ```tsx
 * <FeatureGate feature="whatsapp_campaign">
 *   <WhatsAppCampaignSection />
 * </FeatureGate>
 * ```
 */
export default function FeatureGate({ feature, children, lockedMessage, inline = false }: FeatureGateProps) {
  const navigate = useNavigate();
  const { hasFeature, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;
  if (hasFeature(feature)) return <>{children}</>;

  const featureLabels: Record<keyof PlanFeatures, string> = {
    whatsapp_campaign: 'Kirim via WhatsApp',
    custom_template: 'Template Kustom',
    webhook: 'Webhook Integrasi',
    advanced_reports: 'Laporan Lanjutan',
    remove_branding: 'Hapus Branding GuestFlow',
    priority_support: 'Prioritas Support',
  };

  const planForFeature: Record<keyof PlanFeatures, string> = {
    whatsapp_campaign: 'Pro',
    custom_template: 'Pro',
    webhook: 'Pro',
    advanced_reports: 'Pro',
    remove_branding: 'Enterprise',
    priority_support: 'Enterprise',
  };

  if (inline) {
    return (
      <span
        onClick={() => navigate('/plan')}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                   bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400
                   cursor-pointer hover:bg-amber-200 transition-colors"
        title={`Fitur ${featureLabels[feature]} tersedia di paket ${planForFeature[feature]}`}
      >
        <Lock className="w-3 h-3" />
        {planForFeature[feature]}
      </span>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred children */}
      <div className="pointer-events-none select-none filter blur-[2px] opacity-50">
        {children}
      </div>

      {/* Locked overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3
                   bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full
                        bg-amber-100 dark:bg-amber-900/30">
          <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="text-center px-6">
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-1">
            {lockedMessage ?? `Fitur ${featureLabels[feature]}`}
          </p>
          <p className="text-xs text-[#64748b]">
            Tersedia di paket <strong>{planForFeature[feature]}</strong> ke atas
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/plan')}
          className="px-4 py-2 rounded-lg text-sm font-semibold
                     bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                     hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm"
        >
          Lihat Paket
        </motion.button>
      </motion.div>
    </div>
  );
}
