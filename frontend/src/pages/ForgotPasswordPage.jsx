import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

const LANGUAGES = [
  { code: "lt", label: "LT" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const { t, i18n } = useTranslation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[1];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success regardless of response to avoid email leaking
      setSubmitted(true);
    } catch (err) {
      setError(t("passwordReset.networkError") + " " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif]">
      {/* Fixed Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface-darker/90 backdrop-blur-md border-b border-white/[0.07] shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">PF</span>
            </div>
            <span className="font-semibold text-white text-base tracking-tight">PixelForge</span>
          </Link>
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((p) => !p)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.06] text-xs font-bold text-white/70 hover:bg-white/[0.12] hover:text-white transition-all duration-150"
            >
              {currentLang.label}
              <span className="text-[10px] opacity-60">▾</span>
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1.5 bg-surface-dark-alt border border-white/10 rounded-lg shadow-lg overflow-hidden z-50 min-w-[56px]">
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
        </div>
      </header>

      {/* Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(120px)" }}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-[420px] mx-4 mt-16 bg-white/[0.04] border border-white/10 rounded-lg px-8 py-9 shadow-xl">
          {submitted ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-serif-display text-2xl font-bold text-white mb-3 mt-0">
                {t("passwordReset.successTitle")}
              </h1>
              <p className="text-white/50 text-sm mb-6">
                <Trans i18nKey="passwordReset.successDesc" components={{ 1: <strong className="text-white/70 font-semibold" /> }} />
              </p>
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150 no-underline text-sm"
              >
                ← {t("passwordReset.backToLogin")}
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-serif-display text-2xl font-bold text-white mb-3 mt-0">
                {t("passwordReset.forgotTitle")}
              </h1>
              <p className="text-white/70 text-sm mb-6">{t("passwordReset.forgotDesc")}</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block mb-1 text-sm font-medium text-white/60">
                    {t("passwordReset.emailLabel")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "forgot-error" : undefined}
                    className="bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/20 focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm py-2.5 px-3.5 text-sm outline-none transition-all duration-150 w-full"
                  />
                </div>

                {error && (
                  <div id="forgot-error" role="alert" className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm px-4 py-3 text-sm mb-4">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded text-base font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_4px_16px_rgba(99,102,241,0.35)] border-none cursor-pointer disabled:opacity-60"
                >
                  {loading ? "..." : t("passwordReset.sendLink")}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-white/40 hover:text-white/60 transition-colors duration-150 no-underline">
                  ← {t("passwordReset.backToLogin")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
