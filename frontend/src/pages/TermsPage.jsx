import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import LanguageSwitcher from '../components/LanguageSwitcher';

function TermsPage() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = [
    { title: t('terms.acceptanceTitle'), body: t('terms.acceptanceBody') },
    { title: t('terms.accountTitle'), body: t('terms.accountBody') },
    { title: t('terms.serviceTitle'), body: t('terms.serviceBody') },
    { title: t('terms.contentTitle'), body: t('terms.contentBody') },
    { title: t('terms.intellectualTitle'), body: t('terms.intellectualBody') },
    { title: t('terms.paymentTitle'), body: t('terms.paymentBody') },
    { title: t('terms.terminationTitle'), body: t('terms.terminationBody') },
    { title: t('terms.limitationTitle'), body: t('terms.limitationBody') },
    { title: t('terms.governingTitle'), body: t('terms.governingBody') },
    { title: t('terms.changesTitle'), body: t('terms.changesBody') },
    { title: t('terms.contactTitle'), body: t('terms.contactBody') },
  ];

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif]">
      <SEO
        title={t('terms.pageTitle')}
        description={t('terms.pageDescription')}
        path="/terms"
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
        <h1 className="text-2xl font-bold text-white mb-2">{t('terms.heading')}</h1>
        <p className="text-sm text-white/40 mb-10">{t('terms.lastUpdated')}</p>

        <p className="text-sm text-white/60 leading-relaxed mb-8">{t('terms.intro')}</p>

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
            &larr; {t('terms.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
