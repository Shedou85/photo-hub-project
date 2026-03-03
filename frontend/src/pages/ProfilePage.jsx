import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import ActivityStats from "../components/ActivityStats";
import EditProfileModal from "../components/settings/EditProfileModal";
import SecurityModal from "../components/settings/SecurityModal";
import BrandingModal from "../components/settings/BrandingModal";

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

// --- Sub-component: square-ish settings card (matches ActivityStats style) ---
function SettingsGridCard({ icon, title, subtitle, buttonLabel, badge, accentBorder, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left bg-white/[0.04] border border-white/10 border-t-2 ${accentBorder} rounded-xl px-6 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-2xl cursor-pointer`}
    >
      {/* Icon — top-right decorative */}
      <div className="absolute top-4 right-4 w-9 h-9 text-white/[0.06]">
        {icon}
      </div>

      {/* Title + badge */}
      <h2 className="text-[15px] font-bold text-white leading-tight mb-1 flex items-center gap-2">
        {title}
        {badge && (
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </h2>

      {/* Subtitle */}
      <p className="text-xs text-white/40 leading-snug mb-4 pr-8">
        {subtitle}
      </p>

      {/* Action label — bottom */}
      <span className="inline-block py-1.5 px-3.5 text-[12px] font-medium rounded-lg text-[#4F7CFF] bg-[rgba(79,124,255,0.08)] border border-[rgba(79,124,255,0.12)]">
        {buttonLabel}
      </span>
    </button>
  );
}

// ============================================================
// ProfilePage
// ============================================================
function ProfilePage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();

  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const isPro = user?.plan === 'PRO';

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
            <Badge variant="plan">{user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE' ? t('plans.freePlanBadge') : t(`profile.planLabel.${user.plan}`, user.plan)}</Badge>
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

      {/* ── Settings Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SettingsGridCard
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          }
          title={t('profile.editProfile')}
          subtitle={t('profile.editProfileDesc')}
          buttonLabel={t('profile.editBtn')}
          accentBorder="border-t-blue-500/40"
          onClick={() => setActiveModal('editProfile')}
        />

        <SettingsGridCard
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          }
          title={t('profile.securityTitle')}
          subtitle={user.hasPassword ? t('profile.securityDesc') : t('profile.securityDescNoPassword')}
          buttonLabel={t('profile.editBtn')}
          accentBorder="border-t-emerald-500/40"
          onClick={() => setActiveModal('security')}
        />

        <SettingsGridCard
          icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
            </svg>
          }
          title={t('profile.branding.title')}
          subtitle={t('profile.branding.subtitle')}
          buttonLabel={t('profile.branding.manageBtn')}
          accentBorder="border-t-violet-500/40"
          badge="PRO"
          onClick={() => setActiveModal('branding')}
        />
      </div>

      {/* ── Modals ── */}
      {activeModal === 'editProfile' && (
        <EditProfileModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSave={login}
        />
      )}
      {activeModal === 'security' && (
        <SecurityModal
          user={user}
          onClose={() => setActiveModal(null)}
          onSave={login}
        />
      )}
      {activeModal === 'branding' && (
        <BrandingModal
          user={user}
          isPro={isPro}
          onClose={() => setActiveModal(null)}
          onSave={login}
        />
      )}
    </div>
  );
}

export default ProfilePage;
