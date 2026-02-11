import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'lt', label: 'LT' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
    <circle cx="8" cy="8" r="8" fill="rgba(99,102,241,0.18)" />
    <path d="M5 8l2 2 4-4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div className={`lp-fade ${delay} bg-white border border-gray-200 rounded-[14px] p-7 flex flex-col gap-4`}>
      <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-serif-display text-[22px] font-semibold text-gray-900 mb-2 leading-snug">{title}</h3>
        <p className="text-[15px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PlanCard({ name, price, perMonth, features, ctaLabel, highlighted, badge }) {
  return (
    <div
      className={`relative flex flex-col rounded-[16px] p-8 ${
        highlighted
          ? 'bg-[linear-gradient(160deg,#1e2a4a_0%,#1a1f35_100%)] border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
          : 'bg-white/[0.04] border border-white/10'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] rounded-full text-white text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap">
          {badge}
        </div>
      )}
      <div className="mb-6">
        <p className="text-[13px] font-medium text-indigo-400 uppercase tracking-widest mb-2">{name}</p>
        <div className="flex items-end gap-1.5">
          <span className="font-serif-display text-[42px] font-bold text-white leading-none">{price}</span>
          {perMonth && <span className="text-[14px] text-white/40 mb-1.5">{perMonth}</span>}
        </div>
      </div>
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px] text-white/70">
            {CHECK_ICON}
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/login"
        className={`block text-center py-3 px-6 rounded-[10px] text-sm font-semibold no-underline transition-all duration-150 ${
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

function HomePage() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const featuresRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[1];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const scrollToFeatures = (e) => {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-[#0d0f14] font-['Outfit',sans-serif]">

      {/* ── Fixed Nav ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">PF</span>
            </div>
            <span className="font-semibold text-white text-[15px] tracking-tight">PixelForge</span>
          </div>

          {/* Right: lang switcher + login */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((p) => !p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.06] text-xs font-bold text-white/70 hover:bg-white/[0.12] hover:text-white transition-all duration-150"
              >
                {currentLang.label}
                <span className="text-[10px] opacity-60">▾</span>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1.5 bg-[#1a1f35] border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden z-50 min-w-[56px]">
                  {LANGUAGES.filter((l) => l.code !== i18n.language).map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => { i18n.changeLanguage(code); setLangOpen(false); }}
                      className="block w-full px-3 py-2 text-xs font-bold text-left text-white/60 hover:text-white hover:bg-indigo-500/20 transition-colors duration-100"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login CTA */}
            <Link
              to="/login"
              className="px-4 py-2 rounded-[8px] text-sm font-semibold text-white no-underline bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
            >
              {t('home.navLogin')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0d0f14]">
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
            <p className="lp-fade lp-fade-d1 text-[13px] font-medium text-indigo-400 uppercase tracking-[0.15em] mb-5">
              {t('home.hero.eyebrow')}
            </p>
            <h1 className="lp-fade lp-fade-d2 font-serif-display font-bold text-white leading-[1.05] mb-6">
              <span className="block text-[clamp(44px,7vw,76px)]">{t('home.hero.headline1')}</span>
              <span className="block text-[clamp(44px,7vw,76px)] italic text-transparent bg-clip-text bg-[linear-gradient(135deg,#60a5fa_0%,#a78bfa_100%)]">
                {t('home.hero.headline2')}
              </span>
            </h1>
            <p className="lp-fade lp-fade-d3 text-[16px] text-white/50 leading-relaxed max-w-[420px] mb-10">
              {t('home.hero.subtext')}
            </p>
            <div className="lp-fade lp-fade-d4 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 py-3.5 px-7 rounded-[10px] text-[15px] font-semibold text-white no-underline bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
              >
                {t('home.hero.cta')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <a
                href="#features"
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 py-3.5 px-7 rounded-[10px] text-[15px] font-semibold text-white/70 no-underline border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:text-white transition-all duration-150"
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
                  <div className="rounded-[12px] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[9px] text-white/50 font-medium">DRAFT</span>
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-gradient-to-br from-slate-700 via-slate-800 to-blue-950 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 70%, rgba(99,102,241,0.4) 0%, transparent 50%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[9px] text-white/50 font-medium">SELECTING</span>
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-gradient-to-br from-indigo-900 to-violet-950 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                </div>
                {/* Col 2 — offset */}
                <div className="flex flex-col gap-3 mt-8">
                  <div className="rounded-[12px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-[9px] text-white/50 font-medium">REVIEWING</span>
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-gradient-to-br from-blue-800 to-slate-900 aspect-[4/3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.5) 0%, transparent 50%)' }} />
                    <div className="absolute top-3 right-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9l5 5 9-9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-gradient-to-br from-indigo-600 to-blue-700 aspect-square shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" /><circle cx="7" cy="7" r="3" fill="rgba(255,255,255,0.2)" /></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-white/50 font-medium">DELIVERED</span>
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
      <section id="features" ref={featuresRef} className="bg-[#f5f6fa] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-gray-900 mb-4 leading-tight">
              {t('home.features.title')}
            </h2>
            <p className="lp-fade lp-fade-d1 text-[16px] text-gray-500 max-w-lg mx-auto">
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

      {/* ── Plans ────────────────────────────────────────────────── */}
      <section id="plans" className="bg-[#0d0f14] py-24 px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/[0.07] blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="lp-fade font-serif-display text-[clamp(32px,4vw,48px)] font-bold text-white mb-4 leading-tight">
              {t('home.plans.title')}
            </h2>
            <p className="lp-fade lp-fade-d1 text-[16px] text-white/40 max-w-md mx-auto">
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
      <footer className="bg-[#080a0f] border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[10px]">PF</span>
            </div>
            <span className="text-[13px] text-white/30">{t('home.footer.tagline')}</span>
          </div>
          <p className="text-[12px] text-white/20">{t('home.footer.rights')}</p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;
