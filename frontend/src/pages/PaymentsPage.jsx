import React from 'react';
import { useTranslation } from 'react-i18next';

const PaymentsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="py-7 px-6 font-sans max-w-[720px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-[14px]">
        {/* Icon circle */}
        <div
          className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center text-[22px] shrink-0 select-none"
        >
          💳
        </div>

        <div>
          <h1 className="m-0 text-[22px] font-bold text-[#111827] leading-tight">
            {t('payments.title')}
          </h1>
          <p className="mt-0.5 mb-0 text-[13px] text-[#6b7280]">
            {t('payments.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Payment History Card ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-[#374151] uppercase tracking-[0.05em]">
          {t('payments.historyTitle')}
        </h2>

        {/* Empty state */}
        <p className="m-0 text-sm text-[#6b7280] text-center py-6">
          {t('payments.noPayments')}
        </p>
      </div>
    </div>
  );
};

export default PaymentsPage;
