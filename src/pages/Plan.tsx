import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, CreditCard, Receipt } from 'lucide-react';
import { usePlans, useSubscription, initiateCheckout, usePaymentHistory } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

// Midtrans Snap global types
declare global {
  interface Window {
    snap: any;
  }
}

function formatPaymentDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function Plan() {
  const navigate = useNavigate();
  const { groupedPlans, data: plansData, isLoading: plansLoading } = usePlans();
  const { status, isLoading: subLoading, refetch: refetchSub } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // plan_id

  // Dynamically load Midtrans Snap script
  useEffect(() => {
    if (!plansData?.snap_url || !plansData?.client_key) return;

    // Check if already loaded
    if (document.getElementById('midtrans-snap-script')) return;

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = plansData.snap_url;
    script.setAttribute('data-client-key', plansData.client_key);
    document.body.appendChild(script);

    return () => {
      // We don't remove the script on unmount so it can be reused,
      // but you could if you want.
    };
  }, [plansData]);

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleSubscribe = async (planId: string) => {
    try {
      setIsProcessing(planId);
      const res = await initiateCheckout(planId, billingCycle);

      if (window.snap) {
        window.snap.pay(res.snap_token, {
          onSuccess: async (result: any) => {
            console.log('Payment success:', result);
            await refetchSub();
            navigate('/dashboard');
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            // Optionally tell user to complete payment
          },
          onError: (result: any) => {
            console.error('Payment error:', result);
            alert('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            console.log('Payment popup closed');
          }
        });
      } else {
        alert('Payment gateway failed to load. Please refresh the page.');
      }
    } catch (err: any) {
      console.error('Checkout failed', err);
      alert(err.response?.data?.message || 'Gagal memulai pembayaran.');
    } finally {
      setIsProcessing(null);
    }
  };

  const planOrder = ['starter', 'pro', 'enterprise'];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-4">
          <CreditCard className="w-4 h-4" />
          Paket & Penagihan
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Pilih Paket yang Sesuai untuk Event Anda
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Mulai dari event kecil hingga berskala masif, kami punya paket yang pas untuk kebutuhan Anda.
        </p>

        {status && (
          <div className="inline-flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Paket Aktif Saat Ini:</span>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                {status.display_name}
              </span>
              {status.plan_name !== 'trial' && status.billing_cycle && (
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  ({status.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                </span>
              )}
              {status.plan_name === 'trial' && status.days_left >= 0 && (
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  (Sisa {status.days_left} hari)
                </span>
              )}
            </div>
          </div>
        )}
        {/* Toggle Billing Cycle */}
        <div className="mt-8 flex justify-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex relative gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              {billingCycle === 'monthly' && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Bulanan</span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              {billingCycle === 'yearly' && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                Tahunan
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Hemat 17%
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {planOrder.map((planName) => {
          const plan = groupedPlans[planName]?.[billingCycle];
          if (!plan) return null;

          const isCurrentPlan = status?.plan_name === plan.name && status?.billing_cycle === billingCycle;
          const isPopular = plan.name === 'pro';

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -8 }}
              className={`relative flex flex-col p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all shadow-xl ${isPopular
                ? 'border-indigo-500 ring-4 ring-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800'
                }`}
            >
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                    Paling Populer
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.display_name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    Rp {Math.round(plan.price_idr / (billingCycle === 'yearly' ? 12 : 1)).toLocaleString('id-ID')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">/bulan</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-emerald-600 font-medium mt-2">
                    Ditagih Rp {plan.price_idr.toLocaleString('id-ID')} per tahun
                  </p>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-4">
                  <FeatureItem
                    text={plan.max_events === null ? 'Event Tidak Terbatas' : `Maks. ${plan.max_events} Event`}
                    included={true}
                  />
                  <FeatureItem
                    text={plan.max_guests === null ? 'Tamu Tidak Terbatas' : `Maks. ${plan.max_guests} Tamu per Event`}
                    included={true}
                  />
                  <FeatureItem
                    text={plan.max_team_members === null ? 'Anggota Tim Tidak Terbatas' : `Maks. ${plan.max_team_members} Anggota Tim`}
                    included={true}
                  />
                  <FeatureItem
                    text="Broadcast via WhatsApp"
                    included={plan.features.whatsapp_campaign}
                  />
                  <FeatureItem
                    text="Template Pesan Kustom"
                    included={plan.features.custom_template}
                  />
                  <FeatureItem
                    text="Webhook Integrasi (Zapier/Make)"
                    included={plan.features.webhook}
                  />
                  <FeatureItem
                    text="Laporan & Analitik Lanjutan"
                    included={plan.features.advanced_reports}
                  />
                  <FeatureItem
                    text="Hapus Branding GuestFlow"
                    included={plan.features.remove_branding}
                  />
                </ul>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isProcessing !== null}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCurrentPlan
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                    : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white'
                    }`}
                >
                  {isProcessing === plan.id && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCurrentPlan
                    ? 'Paket Saat Ini'
                    : isProcessing === plan.id
                      ? 'Memproses...'
                      : 'Pilih Paket'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise CTA / Custom */}
      <div className="mt-20 bg-gradient-to-br from-slate-900 to-[#0f172a] rounded-3xl p-8 md:p-12 text-center overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
          <div className="text-left flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">Butuh solusi untuk Agency atau Event berskala masif?</h3>
            <p className="text-slate-300 text-sm">Hubungi tim sales kami untuk paket kustom, dedicated account manager, dan SLA support.</p>
          </div>
          <button className="flex-shrink-0 bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold transition-colors text-sm">
            Hubungi Sales
          </button>
        </div>
      </div>
      {/* Payment History */}
      <PaymentHistory />
    </div>
  );
}

function PaymentHistory() {
  const { data: history, isLoading } = usePaymentHistory();
  const safeHistory = Array.isArray(history) ? history : [];

  if (isLoading) {
    return (
      <div className="mt-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (safeHistory.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Receipt size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Riwayat Pembayaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Daftar transaksi dan langganan Anda sebelumnya.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paket</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nominal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {safeHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {formatPaymentDate(item.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{item.plan?.display_name || '-'}</span>
                      <span className="text-xs text-slate-500 capitalize">{item.billing_cycle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    Rp {item.amount_idr.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${item.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : item.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {item.midtrans_order_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${included ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
        }`}>
        <Check className={`w-3 h-3 ${!included && 'opacity-0'}`} strokeWidth={3} />
      </div>
      <span className={`text-sm ${included ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
        {text}
      </span>
    </li>
  );
}
