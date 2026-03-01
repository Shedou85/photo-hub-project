import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { photoUrl } from '../utils/photoUrl';
import SEO from '../components/SEO';
import LanguageSwitcher from '../components/LanguageSwitcher';

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
    <circle cx="8" cy="8" r="8" fill="rgba(99,102,241,0.18)" />
    <path d="M5 8l2 2 4-4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div className={`lp-fade ${delay} bg-white border border-gray-200 rounded-lg p-7 flex flex-col gap-4`}>
      <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-serif-display text-xl font-semibold text-gray-900 mb-2 leading-snug">{title}</h3>
        <p className="text-base text-gray-700 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PlanCard({ name, price, perMonth, features, ctaLabel, highlighted, badge }) {
  return (
    <div
      className={`relative flex flex-col rounded-lg p-8 ${
        highlighted
          ? 'bg-[linear-gradient(160deg,#1e2a4a_0%,#1a1f35_100%)] border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
          : 'bg-white/[0.04] border border-white/10'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] rounded-full text-white text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
          {badge}
        </div>
      )}
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-2">{name}</p>
        <div className="flex items-end gap-1.5">
          <span className="font-serif-display text-[42px] font-bold text-white leading-none">{price}</span>
          {perMonth && <span className="text-sm text-white/60 mb-1.5">{perMonth}</span>}
        </div>
      </div>
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
            {CHECK_ICON}
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/login"
        className={`block text-center py-3 px-6 rounded text-sm font-semibold no-underline transition-all duration-150 ${
          highlighted
            ? 'bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white hover:opacity-90 shadow-[0_4px_16px_rgba(99,102,241,0.4)]'
            : 'bg-white/[0.08] text-white/80 border border-white/10 hover:bg-white/[0.14] hover:text-white'
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

const MAX_PROMO_PHOTOS = 12;

function HomePage() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [promoPhotos, setPromoPhotos] = useState([]);
  const featuresRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_BASE_URL + '/promotional')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.status === 'OK' && data.photos?.length > 0) {
          setPromoPhotos(data.photos.slice(0, MAX_PROMO_PHOTOS));
        }
      })
      .catch(() => {});
  }, []);

  const scrollToFeatures = (e) => {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroPhotoSrc = (index) => {
    const photo = promoPhotos[index];
    if (!photo) return null;
    return photoUrl(photo.thumbnailPath || photo.storagePath);
  };

  const plans = [
    {
      name: t('home.plans.free'),
      price: t('home.plans.freePrice'),
      perMonth: null,
      features: [t('home.plans.freeF1'), t('home.plans.freeF2'), t('home.plans.freeF3')],
      ctaLabel: t('home.plans.freeCta'),
      highlighted: false,
    },
    {
      name: t('home.plans.standard'),
      price: t('home.plans.standardPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [t('home.plans.standardF1'), t('home.plans.standardF2'), t('home.plans.standardF3')],
      ctaLabel: t('home.plans.standardCta'),
      highlighted: true,
      badge: t('home.plans.popular'),
    },
    {
      name: t('home.plans.pro'),
      price: t('home.plans.proPrice'),
      perMonth: t('home.plans.perMonth'),
      features: [t('home.plans.proF1'), t('home.plans.proF2'), t('home.plans.proF3')],
      ctaLabel: t('home.plans.proCta'),
      highlighted: false,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'PixelForge',
        url: 'https://pixelforge.pro',
        logo: 'https://pixelforge.pro/logo.png',
        description: t('seo.homeDescription'),
      },
      {
        '@type': 'SoftwareApplication',
        name: 'PixelForge',
        applicationCategory: 'PhotographyApplication',
        operatingSystem: 'Web',
        offers: [
          { '@type': 'Offer', name: 'Free Trial', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Standard', price: '15', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif]">
      <SEO
        description={t('seo.homeDescription')}
        path="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ── Fixed Nav ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-surface-darker/90 backdrop-blur-md border-b border-white/[0.07] shadow-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PixelForge" className="w-10 h-10 rounded-full" />
            <div className="hidden sm:flex items-baseline" aria-label="PixelForge">
              {'Pixel'.split('').map((char, i) => (
                <span
                  key={i}
                  className="brand-letter font-extrabold text-base tracking-[0.04em] drop-shadow-[0_0_6px_rgba(99,102,241,0.12)] will-change-[color]"
                  style={{
                    color: '#d4d8eb',
                    animation: `brandShimmer 5s ease-in-out ${i * 0.12}s infinite`,
                  }}
                >
                  {char}
                </span>
              ))}
              {'Forge'.split('').map((char, i) => (
                <span
                  key={i + 5}
                  className="brand-letter font-bold text-base tracking-[0.04em] drop-shadow-[0_0_6px_rgba(99,102,241,0.12)] will-change-[color]"
                  style={{
                    color: '#d4d8eb',
                    animation: `brandShimmer 5s ease-in-out ${(i + 5) * 0.12}s infinite`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Right: lang switcher + login */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Login CTA + Sign up CTA */}
            <div className="flex gap-3">
              <Link
                to="/register"
                className="hidden sm:inline-flex px-4 py-2 rounded-sm text-sm font-semibold text-white/80 no-underline bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] transition-colors duration-150"
              >
                {t('home.navSignup')}
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-sm text-sm font-semibold text-white no-underline bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
              >
                {t('home.navLogin')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-surface-darker">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Gradient glow */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.08] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text content */}
          <div>
            <p className="lp-fade lp-fade-d1 text-sm font-medium text-indigo-400 uppercase tracking-[0.15em] mb-5">
              {t('home.hero.eyebrow')}
            </p>
            <h1 className="lp-fade lp-fade-d2 font-serif-display font-bold text-white leading-[1.05] mb-6">
              <span className="block text-[clamp(44px,7vw,76px)]">{t('home.hero.headline1')}</span>
              <span className="block text-[clamp(44px,7vw,76px)] italic text-transparent bg-clip-text bg-[linear-gradient(135deg,#60a5fa_0%,#a78bfa_100%)]">
                {t('home.hero.headline2')}
              </span>
            </h1>
            <p className="lp-fade lp-fade-d3 text-base text-white/50 leading-relaxed max-w-[420px] mb-10">
              {t('home.hero.subtext')}
            </p>
            <div className="lp-fade lp-fade-d4 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 py-3.5 px-7 rounded text-base font-semibold text-white no-underline bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
              >
                {t('home.hero.cta')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <a
                href="#features"
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 py-3.5 px-7 rounded text-base font-semibold text-white/70 no-underline border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:text-white transition-all duration-150"
              >
                {t('home.hero.ctaSecondary')}
              </a>
            </div>
          </div>

          {/* Right: Decorative photo grid */}
          <div className="lp-fade lp-fade-d3 hidden lg:block">
            <div className="lp-float relative">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-2xl scale-110" />
              <div className="relative grid grid-cols-2 gap-3 p-1">
                {/* Col 1 */}
                <div className="flex flex-col gap-3">
                  <div className="rounded-md bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] relative overflow-hidden">
                    {heroPhotoSrc(0) && (
                      <img src={heroPhotoSrc(0)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[9px] text-white/90 font-medium">DRAFT</span>
                    </div>
                  </div>
                  <div className="rounded-md bg-gradient-to-br from-slate-700 via-slate-800 to-blue-950 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    {heroPhotoSrc(1) && (
                      <img src={heroPhotoSrc(1)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 70%, rgba(99,102,241,0.4) 0%, transparent 50%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[9px] text-white/90 font-medium">SELECTING</span>
                    </div>
                  </div>
                  <div className="rounded-md bg-gradient-to-br from-indigo-900 to-violet-950 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    {heroPhotoSrc(2) && (
                      <img src={heroPhotoSrc(2)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full border border-white/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                </div>
                {/* Col 2 — offset */}
                <div className="flex flex-col gap-3 mt-8">
                  <div className="rounded-md bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden">
                    {heroPhotoSrc(3) && (
                      <img src={heroPhotoSrc(3)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-[9px] text-white/90 font-medium">REVIEWING</span>
                    </div>
                  </div>
                  <div className="rounded-md bg-gradient-to-br from-blue-800 to-slate-900 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    {heroPhotoSrc(4) && (
                      <img src={heroPhotoSrc(4)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.5) 0%, transparent 50%)' }} />
                    <div className="absolute top-3 right-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9l5 5 9-9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <div className="rounded-md bg-gradient-to-br from-indigo-600 to-blue-700 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] relative overflow-hidden">
                    {heroPhotoSrc(5) && (
                      <img src={heroPhotoSrc(5)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.classList.add('hidden')} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" /><circle cx="7" cy="7" r="3" fill="rgba(255,255,255,0.2)" /></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-white/90 font-medium">DELIVERED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[11px] text-white tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="bg-surface-light py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-gray-900 mb-4 leading-tight">
              {t('home.features.title')}
            </h2>
            <p className="lp-fade lp-fade-d1 text-base text-gray-700 max-w-lg mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🗂️"
              title={t('home.features.f1Title')}
              desc={t('home.features.f1Desc')}
              delay="lp-fade-d1"
            />
            <FeatureCard
              icon="✦"
              title={t('home.features.f2Title')}
              desc={t('home.features.f2Desc')}
              delay="lp-fade-d2"
            />
            <FeatureCard
              icon="📦"
              title={t('home.features.f3Title')}
              desc={t('home.features.f3Desc')}
              delay="lp-fade-d3"
            />
          </div>
        </div>
      </section>

      {/* ── Why PixelForge ───────────────────────────────────────── */}
      <section className="bg-surface-darker py-24 px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/[0.06] blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/[0.05] blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-white mb-4 leading-tight">
              {t('home.why.title')}
            </h2>
            <p className="lp-fade lp-fade-d1 text-base text-white/60 max-w-lg mx-auto">
              {t('home.why.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                ),
                title: t('home.why.w1Title'),
                desc: t('home.why.w1Desc'),
                delay: 'lp-fade-d1',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                  </svg>
                ),
                title: t('home.why.w2Title'),
                desc: t('home.why.w2Desc'),
                delay: 'lp-fade-d2',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                ),
                title: t('home.why.w3Title'),
                desc: t('home.why.w3Desc'),
                delay: 'lp-fade-d3',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                ),
                title: t('home.why.w4Title'),
                desc: t('home.why.w4Desc'),
                delay: 'lp-fade-d4',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`lp-fade ${item.delay} group bg-white/[0.04] border border-white/10 rounded-lg p-6 flex items-start gap-5 hover:bg-white/[0.07] hover:border-white/[0.16] transition-all duration-300`}
              >
                <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-semibold text-white mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio showcase ───────────────────────────────────── */}
      {promoPhotos.length > 0 && (
        <section className="bg-surface-darker py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-white mb-4 leading-tight">
                {t('promotional.homeSectionTitle')}
              </h2>
            </div>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {promoPhotos.map((photo) => {
                const src = photoUrl(photo.thumbnailPath || photo.storagePath);
                return (
                  <div
                    key={photo.photoId}
                    className="overflow-hidden rounded-lg break-inside-avoid group"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { e.target.closest('.break-inside-avoid')?.classList.add('hidden'); }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Plans ────────────────────────────────────────────────── */}
      <section id="plans" className="bg-surface-darker py-24 px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/[0.07] blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-white mb-4 leading-tight">
              {t('home.plans.title')}
            </h2>
            <p className="lp-fade lp-fade-d1 text-base text-white/60 max-w-md mx-auto">
              {t('home.plans.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <PlanCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-surface-darkest border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PixelForge" className="w-8 h-8 rounded-full" />
            <span className="text-sm text-white/60">{t('home.footer.tagline')}</span>
          </div>
          <p className="text-xs text-white/50">{t('home.footer.rights')}</p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;
