import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import ActivityStats from "../components/ActivityStats";

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
    </div>
  );
}

export default ProfilePage;
