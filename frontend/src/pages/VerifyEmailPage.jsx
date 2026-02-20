import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif] flex items-center justify-center">
      <div className="relative z-10 w-full max-w-[420px] mx-4 bg-white/[0.04] border border-white/10 rounded-lg px-8 py-9 shadow-xl text-center">
        {status === 'loading' && (
          <p className="text-white/60 text-sm">{t('emailVerification.verifying')}</p>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{t('emailVerification.successTitle')}</h1>
            <p className="text-white/50 text-sm mb-6">{t('emailVerification.successDesc')}</p>
            <Link
              to="/login"
              className="inline-block py-3 px-6 rounded text-sm font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity no-underline"
            >
              {t('emailVerification.loginBtn')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{t('emailVerification.errorTitle')}</h1>
            <p className="text-white/50 text-sm mb-6">{t('emailVerification.errorDesc')}</p>
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 text-sm no-underline transition-colors"
            >
              {t('passwordReset.backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
