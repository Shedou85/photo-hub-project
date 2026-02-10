import React from 'react';
import { useTranslation } from 'react-i18next';

const PaymentsPage = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        padding: "28px 24px",
        fontFamily: "sans-serif",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "28px",
          gap: "14px",
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          💳
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {t('payments.title')}
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Billing &amp; payment history
          </p>
        </div>
      </div>

      {/* ── Payment History Card ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Payment History
        </h2>

        {/* Empty state */}
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#6b7280",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          {t('payments.noPayments')}
        </p>
      </div>
    </div>
  );
};

export default PaymentsPage;
