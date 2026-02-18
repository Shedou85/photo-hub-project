import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

const PaymentsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <PageHeader
        icon="💳"
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
      />

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
