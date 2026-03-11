import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-blue-500 flex-shrink-0"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="8" r="8" className="fill-blue-500/20" />
    <path
      d="M5 8l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlanCard = ({ name, price, perMonth, features, isCurrent, highlighted, badge, planKey, userPlan, subscriptionStatus, onCheckout, loadingPlan }) => {
  const { t } = useTranslation();

  const isUpgrade = (planKey === 'STANDARD' && userPlan === 'FREE_TRIAL') ||
    (planKey === 'PRO' && (userPlan === 'FREE_TRIAL' || userPlan === 'STANDARD'));

  const ctaLabel = planKey === 'STANDARD' ? t('payments.getProfessional') : t('payments.getBusiness');
  const isLoading = loadingPlan === planKey;

  if (isCurrent) {
    return (
      <div className="relative rounded-[12px] p-[2px] bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-lg">
        <div className="bg-surface-dark rounded-[10px] px-6 py-5 flex flex-col gap-5 h-full">
          <div className="absolute top-[2px] left-[2px] right-[2px] h-1 rounded-t-[10px] bg-[linear-gradient(90deg,#3b82f6_0%,#6366f1_100%)]" />
          <div className="flex flex-col gap-5 flex-1">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                {name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                {t('payments.currentPlan')}
              </span>
            </div>

            <div>
              <p className="text-4xl font-bold text-white leading-none">{price}</p>
              {perMonth && <p className="text-sm text-white/50 mt-1">{perMonth}</p>}
            </div>

            <div className="h-px bg-white/[0.06]" />

            <ul className="flex flex-col gap-3 flex-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-2.5 rounded-[8px] text-sm font-semibold bg-blue-500/10 text-blue-400 cursor-not-allowed"
            >
              {t('payments.currentPlan')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'relative bg-white/[0.04] border rounded-[12px] px-6 py-5 flex flex-col gap-5 transition-shadow hover:shadow-md',
        highlighted ? 'border-indigo-500/30 shadow-sm' : 'border-white/10',
      ].join(' ')}
    >
      {highlighted && (
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full bg-[linear-gradient(90deg,#6366f1_0%,#3b82f6_100%)]" />
      )}

      <div className="flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between pt-1">
          <span className={[
            'text-xs font-semibold uppercase tracking-widest',
            highlighted ? 'text-indigo-400' : 'text-white/40',
          ].join(' ')}>
            {name}
          </span>
          {badge && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-indigo-400 bg-indigo-500/15">
              {badge}
            </span>
          )}
        </div>

        <div>
          <p className="text-4xl font-bold text-white leading-none">{price}</p>
          {perMonth && <p className="text-sm text-white/50 mt-1">{perMonth}</p>}
        </div>

        <div className="h-px bg-white/[0.06]" />

        <ul className="flex flex-col gap-3 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-white/60">
              <CheckIcon />
              {f}
            </li>
          ))}
        </ul>

        {planKey === 'FREE_TRIAL' ? (
          <button
            disabled
            className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-white/10 text-white/50 cursor-not-allowed"
          >
            {t('payments.currentPlan')}
          </button>
        ) : isUpgrade ? (
          <button
            onClick={() => onCheckout(planKey)}
            disabled={isLoading}
            className="w-full py-2.5 rounded-[8px] text-sm font-semibold bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)] transition-shadow disabled:opacity-60"
          >
            {isLoading ? t('payments.loadingCheckout') : ctaLabel}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-white/10 text-white/50 cursor-not-allowed"
          >
            {t('payments.currentPlan')}
          </button>
        )}
      </div>
    </div>
  );
};

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [toast, setToast] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const userPlan = user?.plan ?? 'FREE_TRIAL';
  const subscriptionStatus = user?.subscriptionStatus;
  const hasActiveSubscription = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'CANCELED';
  const isCanceling = subscriptionStatus === 'CANCELED';

  const isActiveTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'FREE_TRIAL';
  const isExpiredTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE';

  // Handle checkout success redirect
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setToast({ type: 'success', message: t('payments.checkoutSuccess') });
      refreshUser();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser, t]);

  // Load payment history
  useEffect(() => {
    async function loadPayments() {
      const { data } = await api.get('/payments/history');
      if (data?.payments) {
        setPayments(data.payments);
      }
      setPaymentsLoading(false);
    }
    loadPayments();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCheckout = async (plan) => {
    setLoadingPlan(plan);
    const { data, error } = await api.post('/payments/checkout', { plan });
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setToast({ type: 'error', message: t('payments.checkoutError') });
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    const { data } = await api.post('/payments/portal');
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setToast({ type: 'error', message: t('payments.portalError') });
    }
    setLoadingPortal(false);
  };

  const plans = [
    {
      key: 'FREE_TRIAL',
      name: isActiveTrial ? t('plans.trialBadge') : isExpiredTrial ? t('plans.freePlanBadge') : t('home.plans.free'),
      price: t('home.plans.freePrice'),
      perMonth: null,
      features: isActiveTrial ? [
        t('plans.trialActiveF1'),
        t('plans.trialActiveF2'),
        t('plans.trialActiveF3'),
        t('plans.trialActiveF4'),
      ] : [
        t('plans.freeF1'),
        t('plans.freeF2'),
        t('plans.freeF3'),
        t('plans.freeF4'),
      ],
    },
    {
      key: 'STANDARD',
      name: t('home.plans.professional'),
      price: t('home.plans.professionalPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [
        t('home.plans.professionalF1'),
        t('home.plans.professionalF2'),
        t('home.plans.professionalF3'),
        t('plans.professionalF4'),
      ],
      highlighted: true,
      badge: t('home.plans.popular'),
    },
    {
      key: 'PRO',
      name: t('home.plans.business'),
      price: t('home.plans.businessPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [
        t('home.plans.businessF1'),
        t('home.plans.businessF2'),
        t('home.plans.businessF3'),
        t('plans.businessF4'),
      ],
    },
  ];

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAmount = (cents, currency) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'usd' }).format(cents / 100);
  };

  const statusBadge = (status) => {
    const styles = {
      succeeded: 'bg-emerald-500/10 text-emerald-400',
      failed: 'bg-red-500/10 text-red-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
    };
    const labels = {
      succeeded: t('payments.statusSucceeded'),
      failed: t('payments.statusFailed'),
      pending: t('payments.statusPending'),
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <PageHeader
        icon="💳"
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
      />

      {/* Canceling banner */}
      {isCanceling && user?.subscriptionEndsAt && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          {t('payments.cancelingStatus')} — {t('payments.accessUntil', { date: formatDate(user.subscriptionEndsAt) })}
        </div>
      )}

      {/* Manage Subscription button */}
      {hasActiveSubscription && (
        <div className="mb-4">
          <button
            onClick={handlePortal}
            disabled={loadingPortal}
            className="px-4 py-2 rounded-[8px] text-sm font-semibold bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1] transition-colors disabled:opacity-60"
          >
            {loadingPortal ? t('payments.loadingCheckout') : t('payments.manageSubscription')}
          </button>
        </div>
      )}

      {/* Plans Section */}
      <div className="mb-6">
        <h2 className="mt-0 mb-1 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
          {t('payments.plansTitle')}
        </h2>
        <p className="mt-0 mb-4 text-sm text-white/50">{t('payments.plansSubtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              planKey={plan.key}
              name={plan.name}
              price={plan.price}
              perMonth={plan.perMonth}
              features={plan.features}
              isCurrent={userPlan === plan.key}
              highlighted={plan.highlighted}
              badge={plan.badge}
              userPlan={userPlan}
              subscriptionStatus={subscriptionStatus}
              onCheckout={handleCheckout}
              loadingPlan={loadingPlan}
            />
          ))}
        </div>
      </div>

      {/* Payment History Card */}
      <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
          {t('payments.historyTitle')}
        </h2>
        {paymentsLoading ? (
          <p className="m-0 text-sm text-white/50 text-center py-6">...</p>
        ) : payments.length === 0 ? (
          <p className="m-0 text-sm text-white/50 text-center py-6">
            {t('payments.noPayments')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 text-white/50 font-medium">{t('payments.date')}</th>
                  <th className="text-left py-2 text-white/50 font-medium">{t('payments.plan')}</th>
                  <th className="text-left py-2 text-white/50 font-medium">{t('payments.amount')}</th>
                  <th className="text-left py-2 text-white/50 font-medium">{t('payments.status')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04]">
                    <td className="py-2.5 text-white/70">{formatDate(p.createdAt)}</td>
                    <td className="py-2.5 text-white/70">
                      {p.plan === 'STANDARD' ? 'Professional' : p.plan === 'PRO' ? 'Business' : p.plan || '—'}
                    </td>
                    <td className="py-2.5 text-white/70">{formatAmount(p.amount, p.currency)}</td>
                    <td className="py-2.5">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
