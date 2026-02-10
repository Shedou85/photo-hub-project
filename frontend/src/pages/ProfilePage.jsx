import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: "600",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#9ca3af",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: "#1f2937",
          fontWeight: "500",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// --- Sub-component: inline badge for plan / role ---
function Badge({ children, variant }) {
  const colors = {
    plan: { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    role: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
    admin: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
  };
  const style = colors[variant] || colors.plan;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: "600",
        ...style,
      }}
    >
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Focused field for input highlight ---
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/profile/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, bio }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "OK" && data.user) {
        login(data.user);
        setSuccess(t('profile.updateSuccess'));
      } else {
        setError(
          `${t('profile.updateFailed')} ${
            data.error ||
            data.message ||
            "The server returned an unexpected response."
          }`
        );
      }
    } catch (err) {
      setError(`${t('profile.networkError')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Unauthenticated guard ---
  if (!user) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        {t('profile.loginRequired')}
      </div>
    );
  }

  // --- Shared input style factory ---
  const inputStyle = (fieldName) => ({
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    color: "#1f2937",
    background: "#ffffff",
    border: focusedField === fieldName ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "sans-serif",
  });

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  };

  return (
    <div
      style={{
        padding: "28px 24px",
        fontFamily: "sans-serif",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Avatar initials circle */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "700",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            {getInitials(user.name)}
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "700",
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {user.name}
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {t('profile.subtitle')}
            </p>
          </div>
        </div>

      </div>

      {/* ── Profile Information Card (read-only) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t('profile.accountInfo')}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "18px",
          }}
        >
          <InfoRow label={t('profile.email')} value={user.email} />
          <InfoRow
            label={t('profile.memberSince')}
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9ca3af",
              }}
            >
              {t('profile.plan')}
            </span>
            <Badge variant="plan">{t(`profile.planLabel.${user.plan}`, user.plan)}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9ca3af",
              }}
            >
              {t('profile.role')}
            </span>
            <Badge variant={user.role === "ADMIN" ? "admin" : "role"}>
              {t(`profile.roleLabel.${user.role}`, user.role)}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Card ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t('profile.editProfile')}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="name" style={labelStyle}>
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder={t('profile.namePlaceholder')}
              style={inputStyle("name")}
            />
          </div>

          {/* Bio field */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="bio" style={labelStyle}>
              {t('profile.bio')}
              <span
                style={{ fontWeight: "400", color: "#9ca3af", marginLeft: "6px" }}
              >
                ({t('profile.optional')})
              </span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              style={{
                ...inputStyle("bio"),
                resize: "vertical",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* ── Feedback messages ── */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#991b1b",
              }}
            >
              <span style={{ flexShrink: 0, fontWeight: "700" }}>{t('profile.errorPrefix')}</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#15803d",
                fontWeight: "500",
              }}
            >
              {success}
            </div>
          )}

          {/* ── Save Button Area ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "4px",
            }}
          >
            {loading && (
              <span
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {t('profile.saving')}
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 22px",
                fontSize: "14px",
                fontWeight: "600",
                color: loading ? "#a1a1aa" : "#ffffff",
                background: loading
                  ? "#e4e4e7"
                  : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "sans-serif",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
