import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "lt", label: "LT" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const googleCallbackRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const resetSuccess = searchParams.get("reset") === "success";

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

  const handleGoogleCredential = async (response) => {
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        login(data.user);
        navigate('/collections');
      } else {
        setError(data.error || t('login.googleError'));
      }
    } catch (err) {
      setError(t('login.googleError'));
    }
  };
  googleCallbackRef.current = handleGoogleCredential;

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Check if Google Sign-In script is already loaded
    if (window.google?.accounts) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => googleCallbackRef.current(r),
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'filled_black', size: 'large', width: 360, text: 'continue_with' }
      );
      return;
    }

    // Check if script already exists in document
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => googleCallbackRef.current(r),
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'filled_black', size: 'large', width: 360, text: 'continue_with' }
      );
    };
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setEmailNotVerified(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "OK" && data.user) {
        login(data.user);
        navigate("/collections");
      } else if (data.error === "email_not_verified") {
        setEmailNotVerified(true);
      } else {
        setError(
          `${t("login.failed")} ${data.error || data.message || "The server returned an unexpected response."}`
        );
      }
    } catch (err) {
      setError(`${t("login.networkError")} ${err.message}`);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/resend-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setEmailNotVerified(false);
      setError(t('emailVerification.resendSuccess'));
    } catch {
      setError(t('login.networkError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-darker font-['Outfit',sans-serif]">

      {/* ── Fixed Nav ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface-darker/90 backdrop-blur-md border-b border-white/[0.07] shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">PF</span>
            </div>
            <span className="font-semibold text-white text-base tracking-tight">PixelForge</span>
          </Link>

          {/* Right: lang switcher only */}
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

      {/* ── Background ───────────────────────────────────────────── */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(120px)" }}
        />

        {/* ── Login Card ───────────────────────────────────────────── */}
        <div className="lp-fade lp-fade-d1 relative z-10 w-full max-w-[420px] mx-4 mt-16 bg-white/[0.04] border border-white/10 rounded-lg px-8 py-9 shadow-xl">
          <h1 className="font-serif-display text-2xl font-bold text-white mb-6 mt-0">
            {t("login.title")}
          </h1>

          {resetSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-sm px-4 py-3 text-sm mb-4">
              {t("passwordReset.successReset")}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-white/60">
                {t("login.email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/20 focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm py-2.5 px-3.5 text-sm outline-none transition-all duration-150 w-full"
              />
            </div>

            {/* Password field */}
            <div className="mb-2">
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-white/60">
                {t("login.password")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/20 focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm py-2.5 px-3.5 text-sm outline-none transition-all duration-150 w-full"
              />
            </div>

            {/* Forgot password link */}
            <div className="mb-4 text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-white/50 hover:text-indigo-400 transition-colors duration-150 no-underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            {/* Email not verified */}
            {emailNotVerified && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-sm px-4 py-3 text-sm mb-4">
                <p className="mb-2">{t('emailVerification.notVerified')}</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-indigo-400 hover:text-indigo-300 text-sm underline transition-colors disabled:opacity-50 bg-transparent border-none cursor-pointer p-0"
                >
                  {resending ? t('emailVerification.resending') : t('emailVerification.resendLink')}
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded text-base font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_4px_16px_rgba(99,102,241,0.35)] border-none cursor-pointer"
            >
              {t("login.submit")}
            </button>
          </form>

          {/* ── OR divider ──────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/60 uppercase tracking-widest">{t('login.orDivider')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign-In button */}
          <div id="google-signin-btn" className="flex justify-center" />

          {/* Sign up link */}
          <p className="text-center text-sm text-white/50 mt-4">
            {t('login.noAccount')}{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150 no-underline"
            >
              {t('login.signupText')}
            </Link>
          </p>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-white/40 hover:text-white/60 transition-colors duration-150 no-underline">
              ← {t("login.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
