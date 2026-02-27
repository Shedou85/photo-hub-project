import { useTranslation } from 'react-i18next';
import Dropdown from './primitives/Dropdown';

const LANGUAGES = [
  { value: 'lt', label: 'LT' },
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
];

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();

  return (
    <Dropdown
      value={i18n.language}
      onChange={(code) => i18n.changeLanguage(code)}
      options={LANGUAGES}
      size="sm"
      className={className}
      minWidth="60px"
    />
  );
}
