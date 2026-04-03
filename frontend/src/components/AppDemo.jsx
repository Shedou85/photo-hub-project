import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SCREEN_DURATION = 3500; // ms per screen
const TRANSITION_DURATION = 600; // ms for fade

/**
 * Animated platform demo showing 3 screens:
 * 1. Collections list
 * 2. Collection detail with workflow stepper
 * 3. Delivery / download ready
 */
function AppDemo() {
  const { t } = useTranslation();
  const [activeScreen, setActiveScreen] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveScreen((prev) => (prev + 1) % 3);
        setFading(false);
      }, TRANSITION_DURATION);
    }, SCREEN_DURATION);
    return () => clearInterval(interval);
  }, []);

  const screenLabels = [
    t('demo.step1', 'Organize collections'),
    t('demo.step2', 'Manage workflow'),
    t('demo.step3', 'Deliver to clients'),
  ];

  return (
    <div className="w-full max-w-[820px] mx-auto">
      {/* Browser frame */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40 bg-[#0c0e13]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.04] text-[11px] text-white/30">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1v6m0 0l3-3m-3 3L5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 8 8)" /></svg>
              pixelforge.pro
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* App content */}
        <div className="flex min-h-[380px] sm:min-h-[420px]">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col w-[160px] bg-white/[0.02] border-r border-white/[0.06] p-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-md bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">PF</span>
              </div>
              <span className="text-xs font-semibold text-white/70">PixelForge</span>
            </div>
            {/* Nav items */}
            <div className="flex flex-col gap-1">
              {['Profile', 'Collections', 'Payments', 'FAQ'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                    i === 1
                      ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded bg-white/[0.06]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 sm:p-5 overflow-hidden relative">
            <div
              className={`transition-all duration-[600ms] ease-in-out ${
                fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {activeScreen === 0 && <ScreenCollections />}
              {activeScreen === 1 && <ScreenDetail />}
              {activeScreen === 2 && <ScreenDelivery />}
            </div>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-6 mt-5">
        {screenLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setActiveScreen(i); setFading(false); }, 300); }}
            className={`flex items-center gap-2 text-xs transition-all duration-300 bg-transparent border-none cursor-pointer ${
              i === activeScreen ? 'text-white/80' : 'text-white/30 hover:text-white/50'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === activeScreen ? 'bg-indigo-400 scale-125' : 'bg-white/20'
              }`}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Screen 1: Collections list ──────────────────────────── */
function ScreenCollections() {
  const collections = [
    { name: 'Wedding — Sarah & Tom', photos: 148, status: 'DELIVERED', statusColor: 'bg-emerald-400', cover: 'from-rose-600/40 to-orange-600/40' },
    { name: 'Portrait — Emma K.', photos: 42, status: 'REVIEWING', statusColor: 'bg-violet-400', cover: 'from-blue-600/40 to-indigo-600/40' },
    { name: 'Family — Johnsons', photos: 86, status: 'SELECTING', statusColor: 'bg-blue-400', cover: 'from-emerald-600/40 to-teal-600/40' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white/90 m-0">My Collections</h3>
          <p className="text-[10px] text-white/40 mt-0.5">3 collections · Manage and share</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-[10px] font-semibold text-white">
          <span>+</span> New Collection
        </div>
      </div>

      {/* Collection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {collections.map((col, i) => (
          <div
            key={col.name}
            className="rounded-lg bg-white/[0.03] border border-white/[0.08] overflow-hidden animate-[fadeSlideUp_0.5s_ease-out_forwards] opacity-0"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* Cover image placeholder */}
            <div className={`h-[90px] bg-gradient-to-br ${col.cover} relative`}>
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
              {/* Status badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <div className={`w-1 h-1 rounded-full ${col.statusColor}`} />
                <span className="text-[8px] text-white/90 font-medium">{col.status}</span>
              </div>
              {/* Fake thumbnails grid */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="w-6 h-6 rounded-sm bg-white/10 backdrop-blur-sm" />
                ))}
              </div>
            </div>
            {/* Info */}
            <div className="px-2.5 py-2">
              <p className="text-[11px] font-medium text-white/80 truncate">{col.name}</p>
              <p className="text-[9px] text-white/35 mt-0.5">{col.photos} photos</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Screen 2: Collection detail with workflow ───────────── */
function ScreenDetail() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] text-white/30">Collections</span>
        <span className="text-[10px] text-white/20">/</span>
        <span className="text-[10px] text-white/60 font-medium">Wedding — Sarah & Tom</span>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { value: '148', label: 'PHOTOS', icon: '📷' },
          { value: '42', label: 'SELECTED', icon: '✓' },
          { value: '3', label: 'DELIVERED', icon: '↓' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 animate-[fadeSlideUp_0.4s_ease-out_forwards] opacity-0"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-lg font-bold text-white/90 leading-none">{stat.value}</div>
            <div className="text-[8px] text-white/40 mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Workflow stepper */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 mb-4 animate-[fadeSlideUp_0.5s_ease-out_0.3s_forwards] opacity-0">
        <div className="flex items-center justify-between">
          {['Client selection', 'Upload finals', 'Delivered'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                i < 2
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/40'
              }`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${i < 2 ? 'text-white/70' : 'text-indigo-300 font-medium'}`}>{step}</span>
              {i < 2 && <div className="flex-1 h-px bg-indigo-500/30 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Photo grid preview */}
      <div className="grid grid-cols-4 gap-1.5 animate-[fadeSlideUp_0.5s_ease-out_0.5s_forwards] opacity-0">
        {[
          'from-rose-500/30 to-pink-600/30',
          'from-amber-500/30 to-orange-600/30',
          'from-emerald-500/30 to-teal-600/30',
          'from-blue-500/30 to-indigo-600/30',
          'from-violet-500/30 to-purple-600/30',
          'from-cyan-500/30 to-sky-600/30',
          'from-rose-400/30 to-red-600/30',
          'from-lime-500/30 to-green-600/30',
        ].map((gradient, i) => (
          <div
            key={i}
            className={`aspect-square rounded bg-gradient-to-br ${gradient} relative`}
          >
            {i < 3 && (
              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Screen 3: Delivery ready ────────────────────────────── */
function ScreenDelivery() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] text-white/30">Collections</span>
        <span className="text-[10px] text-white/20">/</span>
        <span className="text-[10px] text-white/60 font-medium">Wedding — Sarah & Tom</span>
      </div>

      {/* Delivery success card */}
      <div className="rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 p-5 text-center mb-4 animate-[fadeSlideUp_0.4s_ease-out_forwards] opacity-0">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10l3.5 3.5L15 7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white/90 m-0 mb-1">Ready to deliver!</h3>
        <p className="text-[10px] text-white/40 mb-3">Share the delivery link with your client</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 cursor-default">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2L8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Copy delivery link
        </div>
      </div>

      {/* Client view preview */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 animate-[fadeSlideUp_0.4s_ease-out_0.2s_forwards] opacity-0">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-4 h-4 rounded bg-white/[0.06] flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1v10" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" /></svg>
          </div>
          <span className="text-[10px] text-white/50 font-medium">Client view preview</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            'from-rose-500/20 to-pink-600/20',
            'from-amber-500/20 to-orange-600/20',
            'from-emerald-500/20 to-teal-600/20',
          ].map((gradient, i) => (
            <div
              key={i}
              className={`aspect-[4/3] rounded bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-30">
                <path d="M2 12l4-4 3 3 5-5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="5" cy="5" r="1.5" stroke="white" strokeWidth="1" />
              </svg>
              {/* Download icon overlay */}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded bg-white/10 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M6 2v6m0 0l-2-2m2 2l2-2M3 10h6" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /></svg>
              </div>
            </div>
          ))}
        </div>
        {/* Delivery stats */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          <span className="text-[9px] text-white/30">42 photos ready for download</span>
          <span className="text-[9px] text-emerald-400/60 font-medium">Password protected ✓</span>
        </div>
      </div>
    </div>
  );
}

export default AppDemo;
