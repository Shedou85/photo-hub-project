import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import LanguageSwitcher from '../components/LanguageSwitcher';

function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = [
    { title: t('privacy.infoCollectTitle'), body: t('privacy.infoCollectBody') },
    { title: t('privacy.howWeUseTitle'), body: t('privacy.howWeUseBody') },
    { title: t('privacy.dataStorageTitle'), body: t('privacy.dataStorageBody') },
    { title: t('privacy.cookiesTitle'), body: t('privacy.cookiesBody') },
    { title: t('privacy.thirdPartyTitle'), body: t('privacy.thirdPartyBody') },
    { title: t('privacy.yourRightsTitle'), body: t('privacy.yourRightsBody') },
    { title: t('privacy.childrenTitle'), body: t('privacy.childrenBody') },
    { title: t('privacy.changesTitle'), body: t('privacy.changesBody') },
    { title: t('privacy.contactTitle'), body: t('privacy.contactBody') },
  ];

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif]">
      <SEO
        title={t('privacy.pageTitle')}
        description={t('privacy.pageDescription')}
        path="/privacy"
      />

      {/* Fixed Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-surface-darker/90 backdrop-blur-md border-b border-white/[0.07] shadow-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">PF</span>
            </div>
            <span className="font-semibold text-white text-base tracking-tight">PixelForge</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-2xl font-bold text-white mb-2">{t('privacy.heading')}</h1>
        <p className="text-sm text-white/40 mb-10">{t('privacy.lastUpdated')}</p>

        <p className="text-sm text-white/60 leading-relaxed mb-8">{t('privacy.intro')}</p>

        {sections.map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-base font-semibold text-white/90 mb-2">{`${i + 1}. ${section.title}`}</h2>
            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{section.body}</p>
          </div>
        ))}

        <div className="mt-12 pt-6 border-t border-white/[0.08]">
          <Link
            to="/"
            className="text-sm text-indigo-400 hover:text-indigo-300 no-underline transition-colors"
          >
            &larr; {t('privacy.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
