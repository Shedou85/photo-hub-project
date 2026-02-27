import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface-darker flex items-center justify-center px-4">
      <SEO title="404" path="/404" noindex />
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white/20 mb-4">404</h1>
        <p className="text-xl text-white/70 mb-8">{t('errors.page_not_found')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white font-medium rounded-lg shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:opacity-90 transition-opacity"
        >
          {t('errors.go_home')}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
