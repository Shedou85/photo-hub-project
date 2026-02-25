import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { toast } from "sonner";
import Accordion from "../components/Accordion"; // Import Accordion component
import PageHeader from "../components/PageHeader";

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
      <span className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">
        {value}
      </span>
    </div>
  );
}

// --- Sub-component: inline badge for plan / role ---
function Badge({ children, variant }) {
  const variantClasses = {
    plan: "bg-blue-50 text-blue-700 border border-blue-200",
    role: "bg-green-50 text-green-700 border border-green-200",
    admin: "bg-amber-50 text-amber-800 border border-amber-200",
  };
  const classes = variantClasses[variant] || variantClasses.plan;

  return (
    <span className={`inline-block px-[10px] py-[2px] rounded-full text-xs font-semibold ${classes}`}>
      {children}
    </span>
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

  // --- Unauthenticated guard ---
  if (!user) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
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

      {/* ── Edit Profile Accordion ── */}
      <Accordion title={t('profile.editProfile')}>
        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div className="mb-4">
            <label htmlFor="name" className="block mb-1 text-sm font-semibold text-gray-700">
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className="w-full py-2.5 px-5 text-sm text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-sm outline-none box-border transition-colors duration-150 font-sans"
            />
          </div>

          {/* Bio field */}
          <div className="mb-6">
            <label htmlFor="bio" className="block mb-1 text-sm font-semibold text-gray-700">
              {t('profile.bio')}
              <span className="font-normal text-gray-400 ml-[6px]">
                ({t('profile.optional')})
              </span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              className="w-full py-2.5 px-5 text-sm text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-sm outline-none box-border transition-colors duration-150 font-sans resize-y leading-[1.5]"
            />
          </div>

          {/* ── Save Button Area ── */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {loading && (
              <span className="text-sm text-gray-500">
                {t('profile.saving')}
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`py-2.5 px-5 text-sm font-semibold rounded-sm border-none font-sans transition-opacity duration-150 ${
                loading
                  ? "text-zinc-400 bg-zinc-200 cursor-not-allowed"
                  : "text-white cursor-pointer hover:opacity-90 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]"
              }`}
            >
              {loading ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </Accordion>

      {/* ── Profile Information Card (read-only) ── */}
      <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
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
            <span className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400">
              {t('profile.plan')}
            </span>
            <Badge variant="plan">{t(`profile.planLabel.${user.plan}`, user.plan)}</Badge>
          </div>
          {user.role === 'ADMIN' && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400">
                {t('profile.role')}
              </span>
              <Badge variant="admin">
                {t('profile.roleLabel.ADMIN')}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

