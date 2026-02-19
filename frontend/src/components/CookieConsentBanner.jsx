import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { initGA, trackPageView } from '../lib/analytics';

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookieConsent');
      if (consent === null) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function handleAcceptAll() {
    try { localStorage.setItem('cookieConsent', 'accepted'); } catch { /* storage unavailable */ }
    initGA();
    trackPageView(window.location.pathname);
    setVisible(false);
  }

  function handleEssentialOnly() {
    try { localStorage.setItem('cookieConsent', 'declined'); } catch { /* storage unavailable */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-white border border-gray-200 rounded-[10px] shadow-lg px-6 py-5">
      <p className="text-[15px] font-semibold text-gray-900">
        {t('cookieConsent.title')}
      </p>
      <p className="text-[13px] text-gray-500 mt-1">
        {t('cookieConsent.description')}
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={handleEssentialOnly}
          className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {t('cookieConsent.essentialOnly')}
        </button>
        <button
          onClick={handleAcceptAll}
          className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity"
        >
          {t('cookieConsent.acceptAll')}
        </button>
      </div>
    </div>
  );
}
