import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { value: 'lt', label: 'LT' },
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
];

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();

  const activeIndex = LANGUAGES.findIndex((l) => l.value === i18n.language);

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={`relative flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 ${className || ''}`}
    >
      {/* Sliding active indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md segmented-active-bg transition-transform duration-200"
        style={{
          width: `${100 / LANGUAGES.length}%`,
          transform: `translateX(${(activeIndex < 0 ? 0 : activeIndex) * 100}%)`,
        }}
      />

      {LANGUAGES.map((lang) => {
        const isActive = i18n.language === lang.value;
        return (
          <button
            key={lang.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => i18n.changeLanguage(lang.value)}
            className={`relative z-10 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer bg-transparent border-none transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
