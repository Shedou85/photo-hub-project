import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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
      } else {
        setError(
          `${t("login.failed")} ${data.error || data.message || "The server returned an unexpected response."}`
        );
      }
    } catch (err) {
      setError(`${t("login.networkError")} ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] font-['Outfit',sans-serif]">

      {/* ── Fixed Nav ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">PF</span>
            </div>
            <span className="font-semibold text-white text-[15px] tracking-tight">PixelForge</span>
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
        <div className="lp-fade lp-fade-d1 relative z-10 w-full max-w-[420px] mx-4 mt-16 bg-white/[0.04] border border-white/10 rounded-[16px] px-8 py-9 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <h1 className="font-serif-display text-[28px] font-bold text-white mb-6 mt-0">
            {t("login.title")}
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block mb-[5px] text-[13px] font-medium text-white/50">
                {t("login.email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/20 focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-[8px] py-2.5 px-3.5 text-[14px] outline-none transition-all duration-150 w-full"
              />
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label htmlFor="password" className="block mb-[5px] text-[13px] font-medium text-white/50">
                {t("login.password")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/20 focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-[8px] py-2.5 px-3.5 text-[14px] outline-none transition-all duration-150 w-full"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-[8px] px-4 py-3 text-[13px] mb-4">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded-[10px] text-[15px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:opacity-90 transition-opacity duration-150 shadow-[0_4px_16px_rgba(99,102,241,0.35)] border-none cursor-pointer"
            >
              {t("login.submit")}
            </button>
          </form>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-[13px] text-white/30 hover:text-white/60 transition-colors duration-150 no-underline">
              ← {t("login.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
