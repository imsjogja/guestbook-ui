import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export default function TrialBanner() {
  const navigate = useNavigate();
  const { isOnTrial, isTrialExpired, trialDaysLeft, needsUpgrade } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Don't show on active paid plan
  if (!isOnTrial && !needsUpgrade) return null;
  if (dismissed && isOnTrial) return null;

  const isUrgent = isTrialExpired || trialDaysLeft <= 3;

  return (
    <AnimatePresence>
      <motion.div
        key="trial-banner"
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`relative overflow-hidden border-b ${
          isTrialExpired
            ? 'bg-gradient-to-r from-rose-600 to-pink-600 border-rose-700'
            : isUrgent
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-600'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-700'
        }`}
      >
        {/* Animated shimmer */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isTrialExpired ? (
                <AlertTriangle className="w-5 h-5 text-white" />
              ) : isUrgent ? (
                <Clock className="w-5 h-5 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message */}
            <div className="text-sm text-white font-medium">
              {isTrialExpired ? (
                <span>
                  <strong>Trial kamu sudah berakhir.</strong> Akses ke fitur dibatasi.{' '}
                  <span className="opacity-80">Pilih paket untuk melanjutkan.</span>
                </span>
              ) : trialDaysLeft <= 1 ? (
                <span>
                  <strong>Trial berakhir hari ini!</strong> Jangan sampai kehilangan akses.
                </span>
              ) : trialDaysLeft <= 3 ? (
                <span>
                  <strong>Sisa {trialDaysLeft} hari trial</strong> — upgrade sekarang untuk akses penuh.
                </span>
              ) : (
                <span>
                  Kamu sedang dalam masa <strong>trial 14 hari</strong>.{' '}
                  Sisa <strong>{trialDaysLeft} hari</strong>.
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/plan')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                isTrialExpired
                  ? 'bg-white text-rose-600 hover:bg-rose-50'
                  : isUrgent
                  ? 'bg-white text-amber-600 hover:bg-amber-50'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              {isTrialExpired ? 'Upgrade Sekarang' : 'Lihat Paket'}
            </motion.button>

            {/* Dismiss — only for non-expired */}
            {!isTrialExpired && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-white/70 hover:text-white transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
