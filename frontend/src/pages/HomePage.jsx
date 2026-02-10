import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans text-center">
      <div className="w-16 h-16 rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center">
        <span className="text-white font-bold text-xl">PF</span>
      </div>
      <p className="text-lg font-semibold text-gray-700 mt-3 mb-0 tracking-wide">PixelForge</p>
      <h1 className="text-[28px] font-bold text-gray-900 mt-4 mb-2">
        {t('home.underConstruction')}
      </h1>
      <p className="text-[15px] text-gray-500 mb-8">
        {t('home.comingSoon')}
      </p>
      <Link
        to="/login"
        className="inline-block py-[10px] px-[28px] text-sm font-semibold text-white rounded-md no-underline bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-[0.88] transition-opacity duration-150"
      >
        {t('home.login')}
      </Link>
    </div>
  );
}

export default HomePage;
