import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SessionExpiredModal() {
  const { t } = useTranslation();
  const { sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionExpired) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sessionExpired]);

  if (!sessionExpired) return null;

  const handleSignIn = () => {
    clearSessionExpired();
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-sm mx-4 px-6 py-5 text-center animate-scale-in">
        {/* Clock icon */}
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 id="session-expired-title" className="text-base font-semibold text-white mb-2">
          {t('errors.session_expired_title')}
        </h3>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          {t('errors.session_expired_message')}
        </p>

        <button
          onClick={handleSignIn}
          className="w-full py-2.5 px-4 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:brightness-110 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
        >
          {t('errors.session_expired_cta')}
        </button>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
