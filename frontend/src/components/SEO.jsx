import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SITE_NAME = 'PixelForge';
const BASE_URL = 'https://pixelforge.pro';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

const LOCALE_MAP = { en: 'en_US', lt: 'lt_LT', ru: 'ru_RU' };

function SEO({ title, description, path = '/', noindex = false, image }) {
  const { i18n } = useTranslation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Professional Photo Delivery for Photographers`;
  const canonicalUrl = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const ogLocale = LOCALE_MAP[i18n.language] || 'en_US';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@PixelForgeApp" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default SEO;
