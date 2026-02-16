import React from 'react';
import { useTranslation } from 'react-i18next';

const PaymentsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-3.5">
        {/* Icon circle */}
        <div
          className="w-13 h-13 rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center text-xl shrink-0 select-none"
        >
          💳
        </div>

        <div>
          <h1 className="m-0 text-xl font-bold text-gray-900 leading-tight">
            {t('payments.title')}
          </h1>
          <p className="mt-0.5 mb-0 text-sm text-gray-500">
            {t('payments.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Payment History Card ── */}
      <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('payments.historyTitle')}
        </h2>

        {/* Empty state */}
        <p className="m-0 text-sm text-gray-500 text-center py-6">
          {t('payments.noPayments')}
        </p>
      </div>
    </div>
  );
};

export default PaymentsPage;
