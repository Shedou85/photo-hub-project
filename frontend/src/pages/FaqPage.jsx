import React from 'react';
import { useTranslation } from 'react-i18next';
import Accordion from '../components/Accordion';
import SEO from '../components/SEO';

function FaqPage() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('home.faq.title')}
        description={t('home.faq.subtitle')}
        path="/faq"
      />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">{t('home.faq.title')}</h1>
          <p className="text-sm text-white/50">{t('home.faq.subtitle')}</p>
        </div>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Accordion
            key={n}
            title={t(`home.faq.q${n}`)}
            titleClassName="mt-0 mb-0 text-base font-medium text-white/90 normal-case tracking-normal"
          >
            <p className="text-sm text-white/60 leading-relaxed m-0">
              {t(`home.faq.a${n}`)}
            </p>
          </Accordion>
        ))}
      </div>
    </>
  );
}

export default FaqPage;
