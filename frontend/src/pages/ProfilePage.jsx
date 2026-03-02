import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import ActivityStats from "../components/ActivityStats";
import { getAccentButtonStyle } from "../utils/brandingUtils";

// --- Helper: derive initials from a display name ---
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- Sub-component: read-only info row inside the profile info card ---
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-[0.06em] uppercase text-white/50">
        {label}
      </span>
      <span className="text-sm text-white/90 font-medium">
        {value}
      </span>
    </div>
  );
}

// --- Sub-component: inline badge for plan / role ---
function Badge({ children, variant }) {
  const variantClasses = {
    plan: "bg-blue-400/10 text-blue-400 border border-blue-400/20",
    role: "bg-green-400/10 text-green-400 border border-green-400/20",
    admin: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  };
  const classes = variantClasses[variant] || variantClasses.plan;

  return (
    <span className={`inline-block px-[10px] py-[2px] rounded-full text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

// --- Sub-component: Settings card with icon, title, subtitle, action button + inline form ---
function SettingsCard({ icon, title, subtitle, buttonLabel, isOpen, onToggle, children }) {
  return (
    <div
      className={`
        bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)]
        border border-white/[0.08] rounded-lg
        shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]
        mb-6 transition-all duration-200 ease-out
        hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
        hover:border-white/[0.12]
      `}
    >
      {/* Card header */}
      <div className="px-6 py-6 flex items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,rgba(59,130,246,0.15)_0%,rgba(99,102,241,0.15)_100%)] border border-indigo-500/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_0_8px_rgba(99,102,241,0.08)] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white/90 leading-tight">
              {title}
            </h2>
            <p className="text-[13px] text-white/40 mt-1 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 py-2.5 px-5 text-[13px] font-semibold rounded-lg transition-all duration-200 ease-out max-sm:hidden ${
            isOpen
              ? "bg-white/[0.06] text-white/50 border border-white/10 hover:bg-white/[0.1] hover:text-white/60"
              : "text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.45)] hover:scale-[1.02]"
          }`}
        >
          {buttonLabel}
        </button>
      </div>

      {/* Mobile-only full-width button */}
      <div className="px-6 pb-5 -mt-1 sm:hidden">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full py-3 text-[13px] font-semibold rounded-lg transition-all duration-200 ease-out ${
            isOpen
              ? "bg-white/[0.06] text-white/50 border border-white/10"
              : "text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
          }`}
        >
          {buttonLabel}
        </button>
      </div>

      {/* Inline form — clean toggle */}
      {isOpen && (
        <div className="px-6 pb-6 pt-0 border-t border-white/[0.06]">
          <div className="pt-5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ProfilePage
// ============================================================
function ProfilePage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  // Branding state
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [brandingColor, setBrandingColor] = useState(user?.brandingColor || '#6366f1');
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef(null);
  const isPro = user?.plan === 'PRO';

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    const savePromise = api.patch('/profile/me', { name, bio })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.status === "OK" && data?.user) {
          login(data.user);
        } else {
          throw new Error(data?.message || "The server returned an unexpected response.");
        }
      })
      .finally(() => {
        setLoading(false);
      });

    toast.promise(savePromise, {
      loading: t('profile.saving'),
      success: t('profile.updateSuccess'),
      error: (err) => `${t('profile.updateFailed')} ${err.message}`,
    });
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/resend-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      setResendSent(true);
    } catch {
      toast.error(t('emailVerification.emailSendFailed'));
    } finally {
      setResending(false);
    }
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);

    const body = { newPassword };
    if (user.hasPassword) {
      body.currentPassword = currentPassword;
    }

    const savePromise = api.patch('/profile/me', body)
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) login(data.user);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .finally(() => {
        setPasswordLoading(false);
      });

    toast.promise(savePromise, {
      loading: t('profile.updatingPassword'),
      success: t('profile.passwordUpdated'),
      error: (err) => `${t('profile.passwordUpdateFailed')} ${err.message}`,
    });
  };

  // --- Branding handlers ---
  const handleLogoUpload = useCallback(async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    const uploadPromise = api.post('/profile/branding/logo', formData)
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) login(data.user);
      })
      .finally(() => setLogoUploading(false));

    toast.promise(uploadPromise, {
      loading: t('profile.branding.uploadLogo'),
      success: t('profile.branding.logoUploaded'),
      error: (err) => `${t('profile.branding.logoUploadFailed')}: ${err.message}`,
    });
  }, [login, t]);

  const handleLogoDrop = useCallback((e) => {
    e.preventDefault();
    setLogoDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

  const handleLogoDelete = useCallback(async () => {
    const deletePromise = api.delete('/profile/branding/logo')
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) login(data.user);
      });

    toast.promise(deletePromise, {
      loading: t('profile.branding.removeLogo'),
      success: t('profile.branding.logoDeleted'),
      error: (err) => `${t('profile.branding.logoDeleteFailed')}: ${err.message}`,
    });
  }, [login, t]);

  const handleBrandingColorSave = useCallback(() => {
    setBrandingLoading(true);
    const savePromise = api.patch('/profile/me', { brandingColor })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) login(data.user);
      })
      .finally(() => setBrandingLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.branding.savingColor'),
      success: t('profile.branding.colorSaved'),
      error: (err) => `${t('profile.branding.colorSaveFailed')}: ${err.message}`,
    });
  }, [brandingColor, login, t]);

  const handleBrandingColorReset = useCallback(() => {
    setBrandingLoading(true);
    setBrandingColor('#6366f1');
    const savePromise = api.patch('/profile/me', { brandingColor: null })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) login(data.user);
      })
      .finally(() => setBrandingLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.branding.savingColor'),
      success: t('profile.branding.colorReset'),
      error: (err) => `${t('profile.branding.colorSaveFailed')}: ${err.message}`,
    });
  }, [login, t]);

  // --- Unauthenticated guard ---
  if (!user) {
    return (
      <div className="py-10 px-5 text-center font-sans text-white/50">
        {t('profile.loginRequired')}
      </div>
    );
  }

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <PageHeader
        icon={getInitials(user.name)}
        title={user.name}
        subtitle={t('profile.subtitle')}
      />

      {/* ── Activity Stats ── */}
      <ActivityStats />

      {/* ── Email Verification Banner (only when unverified) ── */}
      {!user.emailVerified && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-6 py-4 mb-5 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="flex-1 min-w-0">
            {resendSent ? (
              <p className="text-sm text-amber-300">{t('emailVerification.resendSuccess')}</p>
            ) : (
              <>
                <p className="text-sm text-amber-300 mb-2">{t('emailVerification.notVerified')}</p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? t('emailVerification.resending') : t('emailVerification.resendLink')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Account Information Card (read-only) ── */}
      <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
          {t('profile.accountInfo')}
        </h2>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          <InfoRow label={t('profile.email')} value={user.email} />
          <InfoRow
            label={t('profile.memberSince')}
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-[0.06em] uppercase text-white/50">
              {t('profile.plan')}
            </span>
            <Badge variant="plan">{t(`profile.planLabel.${user.plan}`, user.plan)}</Badge>
          </div>
          {user.role === 'ADMIN' && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-[0.06em] uppercase text-white/50">
                {t('profile.role')}
              </span>
              <Badge variant="admin">
                {t('profile.roleLabel.ADMIN')}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings Section Label ── */}
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.08em] mt-3 mb-4">
        {t('profile.settingsSection')}
      </h3>

      {/* ── Edit Profile Settings Card ── */}
      <SettingsCard
        icon={
          <svg className="w-[18px] h-[18px] text-indigo-300/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        }
        title={t('profile.editProfile')}
        subtitle={t('profile.editProfileDesc')}
        buttonLabel={t('profile.editProfile')}
        isOpen={editProfileOpen}
        onToggle={() => setEditProfileOpen((prev) => !prev)}
      >
        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div className="mb-4">
            <label htmlFor="name" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className="w-full py-2.5 px-5 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm outline-none box-border transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          {/* Bio field */}
          <div className="mb-6">
            <label htmlFor="bio" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.bio')}
              <span className="font-normal text-white/30 ml-[6px]">
                ({t('profile.optional')})
              </span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              className="w-full py-2.5 px-5 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm outline-none box-border transition-colors duration-150 font-sans resize-y leading-[1.5] placeholder:text-white/20"
            />
          </div>

          {/* ── Save Button Area ── */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {loading && (
              <span className="text-sm text-white/50">
                {t('profile.saving')}
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`py-2.5 px-5 text-sm font-semibold rounded-sm border-none font-sans transition-opacity duration-150 ${
                loading
                  ? "text-white/40 bg-white/[0.08] cursor-not-allowed"
                  : "text-white cursor-pointer hover:opacity-90 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
              }`}
            >
              {loading ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* ── Security Settings Card ── */}
      <SettingsCard
        icon={
          <svg className="w-[18px] h-[18px] text-indigo-300/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        }
        title={t('profile.securityTitle')}
        subtitle={user.hasPassword ? t('profile.securityDesc') : t('profile.securityDescNoPassword')}
        buttonLabel={t(user.hasPassword ? 'profile.changePassword' : 'profile.setPassword')}
        isOpen={securityOpen}
        onToggle={() => setSecurityOpen((prev) => !prev)}
      >
        {!user.hasPassword && (
          <p className="text-sm text-white/50 mb-4">
            {t('profile.setPasswordHint')}
          </p>
        )}
        <form onSubmit={handlePasswordSubmit}>
          {user.hasPassword && (
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block mb-1 text-sm font-semibold text-white/60">
                {t('profile.currentPassword')}
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full py-2.5 px-5 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm outline-none box-border transition-colors duration-150 font-sans placeholder:text-white/20"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="newPassword" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.newPassword')}
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-2.5 px-5 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm outline-none box-border transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-2.5 px-5 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-sm outline-none box-border transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {passwordLoading && (
              <span className="text-sm text-white/50">
                {t('profile.updatingPassword')}
              </span>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className={`py-2.5 px-5 text-sm font-semibold rounded-sm border-none font-sans transition-opacity duration-150 ${
                passwordLoading
                  ? "text-white/40 bg-white/[0.08] cursor-not-allowed"
                  : "text-white cursor-pointer hover:opacity-90 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
              }`}
            >
              {passwordLoading ? t('profile.updatingPassword') : t('profile.updatePassword')}
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* ── Custom Branding Settings Card ── */}
      <SettingsCard
        icon={
          <svg className="w-[18px] h-[18px] text-indigo-300/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
        }
        title={
          <span className="flex items-center gap-2">
            {t('profile.branding.title')}
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">PRO</span>
          </span>
        }
        subtitle={t('profile.branding.subtitle')}
        buttonLabel={t('profile.branding.title')}
        isOpen={brandingOpen}
        onToggle={() => setBrandingOpen((prev) => !prev)}
      >
        {isPro ? (
          /* ── PRO: Branding editor ── */
          <div className="space-y-6">
            {/* Logo uploader */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/60">
                {t('profile.branding.logo')}
              </label>
              <p className="text-[13px] text-white/40 mb-3">{t('profile.branding.logoDesc')}</p>

              {user.brandingLogoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-[120px] h-[60px] bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_MEDIA_BASE_URL}/${user.brandingLogoUrl}`}
                      alt="Brand logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    {t('profile.branding.removeLogo')}
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true); }}
                  onDragLeave={() => setLogoDragOver(false)}
                  onDrop={handleLogoDrop}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    logoDragOver
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/[0.15] bg-white/[0.02] hover:border-white/[0.25] hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  />
                  <svg className="w-8 h-8 mx-auto mb-2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-white/50 font-medium">
                    {logoDragOver ? t('profile.branding.dropLogo') : t('profile.branding.dragOrClick')}
                  </p>
                  <p className="text-xs text-white/30 mt-1">{t('profile.branding.logoFormats')}</p>
                  {logoUploading && (
                    <div className="mt-2 w-6 h-6 mx-auto border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )}
            </div>

            {/* Accent color picker */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/60">
                {t('profile.branding.accentColor')}
              </label>
              <p className="text-[13px] text-white/40 mb-3">{t('profile.branding.accentColorDesc')}</p>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="color"
                  value={brandingColor}
                  onChange={(e) => setBrandingColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/[0.12] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={brandingColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,8}$/.test(val)) setBrandingColor(val);
                  }}
                  className="w-28 py-2 px-3 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors font-mono placeholder:text-white/20"
                  placeholder="#6366f1"
                />
              </div>

              {/* Live preview */}
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">{t('profile.branding.preview')}</p>
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex flex-col items-center gap-3">
                    {user.brandingLogoUrl && (
                      <img
                        src={`${import.meta.env.VITE_MEDIA_BASE_URL}/${user.brandingLogoUrl}`}
                        alt="Preview"
                        className="h-8 object-contain opacity-80"
                      />
                    )}
                    <div className="text-sm text-white/60 font-medium">Gallery Name</div>
                    <button
                      type="button"
                      className="py-2 px-5 text-xs font-semibold rounded-lg text-white transition-all"
                      style={getAccentButtonStyle(brandingColor)}
                    >
                      Submit Selections
                    </button>
                  </div>
                </div>
              </div>

              {/* Save / Reset buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingColorSave}
                  disabled={brandingLoading}
                  className={`py-2 px-5 text-sm font-semibold rounded-lg border-none transition-opacity duration-150 ${
                    brandingLoading
                      ? 'text-white/40 bg-white/[0.08] cursor-not-allowed'
                      : 'text-white cursor-pointer hover:opacity-90 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]'
                  }`}
                >
                  {brandingLoading ? t('profile.branding.savingColor') : t('profile.branding.saveColor')}
                </button>
                <button
                  type="button"
                  onClick={handleBrandingColorReset}
                  disabled={brandingLoading}
                  className="py-2 px-4 text-sm font-semibold rounded-lg bg-white/[0.06] text-white/60 border border-white/10 hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                >
                  {t('profile.branding.resetColor')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── STANDARD: Blurred teaser ── */
          <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.08]">
            {/* Blurred placeholder content */}
            <div className="blur-[6px] select-none pointer-events-none p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[50px] bg-white/[0.06] border border-white/[0.12] rounded-lg" />
                <div className="h-8 w-24 bg-white/[0.06] rounded-lg" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20" />
                <div className="h-4 w-20 bg-white/[0.06] rounded" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-3 w-24 bg-white/[0.06] rounded" />
                  <div className="h-8 w-32 bg-indigo-500/20 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="text-sm text-white/50 text-center px-4">
                {t('profile.branding.proRequired')}
              </p>
              <Link
                to="/payments"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.5)] transition-shadow"
              >
                {t('profile.branding.upgrade')}
              </Link>
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

export default ProfilePage;
