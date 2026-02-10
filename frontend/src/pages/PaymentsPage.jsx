import React from 'react';
import { useTranslation } from 'react-i18next';

const PaymentsPage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t('payments.title')}</h2>
      <p>{t('payments.noPayments')}</p>
    </div>
  );
};

export default PaymentsPage;
