import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function UpgradeModal({ onClose, showCta = true }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-sm mx-4 px-6 py-5 text-center animate-scale-in">
        {/* Lock icon */}
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h3 id="upgrade-modal-title" className="text-base font-semibold text-white mb-2">
          {showCta ? t('upgrade.title') : t('upgrade.clientTitle')}
        </h3>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          {showCta ? t('upgrade.description') : t('upgrade.clientDescription')}
        </p>

        <div className="flex flex-col gap-2">
          {showCta && (
            <Link
              to="/payments"
              className="block w-full py-2.5 px-4 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:brightness-110 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)] text-center"
            >
              {t('upgrade.cta')}
            </Link>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            {t('upgrade.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
