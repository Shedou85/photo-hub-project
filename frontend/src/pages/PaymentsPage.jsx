import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-blue-500 flex-shrink-0"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="8" r="8" className="fill-blue-50" />
    <path
      d="M5 8l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlanCard = ({ name, price, perMonth, features, isCurrent, highlighted, badge }) => {
  const { t } = useTranslation();

  if (isCurrent) {
    return (
      <div className="relative rounded-[12px] p-[2px] bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-lg">
        <div className="bg-white rounded-[10px] px-6 py-5 flex flex-col gap-5 h-full">
          {/* Top accent strip */}
          <div className="absolute top-[2px] left-[2px] right-[2px] h-1 rounded-t-[10px] bg-[linear-gradient(90deg,#3b82f6_0%,#6366f1_100%)]" />

          {/* Badge */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              {name}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
              {t('payments.currentPlan')}
            </span>
          </div>

          {/* Price */}
          <div>
            <p className="text-4xl font-bold text-gray-900 leading-none">
              {price}
            </p>
            {perMonth && (
              <p className="text-sm text-gray-400 mt-1">{perMonth}</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Features */}
          <ul className="flex flex-col gap-3 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            disabled
            className="w-full py-2.5 rounded-[8px] text-sm font-semibold bg-blue-50 text-blue-400 cursor-not-allowed"
          >
            {t('payments.currentPlan')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'relative bg-white border rounded-[12px] px-6 py-5 flex flex-col gap-5 transition-shadow hover:shadow-md',
        highlighted ? 'border-indigo-200 shadow-sm' : 'border-gray-200',
      ].join(' ')}
    >
      {/* Highlighted top accent */}
      {highlighted && (
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full bg-[linear-gradient(90deg,#6366f1_0%,#3b82f6_100%)]" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <span className={[
          'text-xs font-semibold uppercase tracking-widest',
          highlighted ? 'text-indigo-500' : 'text-gray-400',
        ].join(' ')}>
          {name}
        </span>
        {badge && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50">
            {badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        <p className="text-4xl font-bold text-gray-900 leading-none">
          {price}
        </p>
        {perMonth && (
          <p className="text-sm text-gray-400 mt-1">{perMonth}</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Features */}
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled
        className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-gray-200 text-gray-400 cursor-not-allowed"
      >
        {t('payments.comingSoon')}
      </button>
    </div>
  );
};

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userPlan = user?.plan ?? 'FREE_TRIAL';

  const plans = [
    {
      key: 'FREE_TRIAL',
      name: t('home.plans.free'),
      price: t('home.plans.freePrice'),
      perMonth: null,
      features: [
        t('home.plans.freeF1'),
        t('home.plans.freeF2'),
        t('home.plans.freeF3'),
      ],
    },
    {
      key: 'STANDARD',
      name: t('home.plans.standard'),
      price: t('home.plans.standardPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [
        t('home.plans.standardF1'),
        t('home.plans.standardF2'),
        t('home.plans.standardF3'),
      ],
      highlighted: true,
      badge: t('home.plans.popular'),
    },
    {
      key: 'PRO',
      name: t('home.plans.pro'),
      price: t('home.plans.proPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [
        t('home.plans.proF1'),
        t('home.plans.proF2'),
        t('home.plans.proF3'),
      ],
    },
  ];

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <PageHeader
        icon="💳"
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
      />

      {/* ── Plans Section ── */}
      <div className="mb-6">
        <h2 className="mt-0 mb-1 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('payments.plansTitle')}
        </h2>
        <p className="mt-0 mb-4 text-sm text-gray-500">{t('payments.plansSubtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              name={plan.name}
              price={plan.price}
              perMonth={plan.perMonth}
              features={plan.features}
              isCurrent={userPlan === plan.key}
              highlighted={plan.highlighted}
              badge={plan.badge}
            />
          ))}
        </div>
      </div>

      {/* ── Payment History Card ── */}
      <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('payments.historyTitle')}
        </h2>
        <p className="m-0 text-sm text-gray-500 text-center py-6">
          {t('payments.noPayments')}
        </p>
      </div>
    </div>
  );
};

export default PaymentsPage;
