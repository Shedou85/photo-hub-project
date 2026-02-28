import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

// ── Inline SVG icons ────────────────────────────────────────────────────────

function IconDownload({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconClock({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCheckCircle({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconLock({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ── Relative time helper ────────────────────────────────────────────────────

function formatRelativeTime(dateString, t) {
  if (!dateString) return t("collection.analytics.noDownloads");

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return t("collection.analytics.justNow");
  if (diffHours < 1) return t("collection.analytics.minutesAgo", { count: diffMinutes });
  if (diffDays < 1) return t("collection.analytics.hoursAgo", { count: diffHours });
  if (diffDays < 30) return t("collection.analytics.daysAgo", { count: diffDays });

  return date.toLocaleDateString();
}

// ── Stagger delay ───────────────────────────────────────────────────────────

const STAGGER_STEP_MS = 75;

// ── Stat card config ────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    key: "totalDownloads",
    labelKey: "collection.analytics.totalDownloads",
    descKey: "collection.analytics.totalDownloadsDesc",
    accentBorder: "border-t-blue-500/40",
    accentIcon: "text-blue-400/20",
    Icon: IconDownload,
  },
  {
    key: "lastDownload",
    labelKey: "collection.analytics.lastDownload",
    descKey: "collection.analytics.lastDownloadDesc",
    accentBorder: "border-t-emerald-500/40",
    accentIcon: "text-emerald-400/20",
    Icon: IconClock,
  },
  {
    key: "selectedPhotos",
    labelKey: "collection.analytics.selectedPhotos",
    descKey: "collection.analytics.selectedPhotosDesc",
    accentBorder: "border-t-violet-500/40",
    accentIcon: "text-violet-400/20",
    Icon: IconCheckCircle,
  },
];

// ── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-6 py-5">
      <div className="flex justify-end mb-4">
        <div className="w-8 h-8 rounded animate-pulse bg-white/[0.06]" />
      </div>
      <div className="h-9 w-16 rounded animate-pulse bg-white/[0.06] mb-3" />
      <div className="h-3 w-28 rounded animate-pulse bg-white/[0.06]" />
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ card, value, sublabel, loaded, delay }) {
  const { t } = useTranslation();
  const { accentBorder, accentIcon, labelKey, Icon } = card;

  return (
    <div
      className={[
        "relative bg-white/[0.04] border border-white/10 rounded-xl px-6 py-5",
        "border-t-2",
        accentBorder,
        "hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-2xl",
        "transition-all duration-300",
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
      style={{
        transition: "opacity 400ms ease, transform 400ms ease, background-color 300ms ease, box-shadow 300ms ease",
        transitionDelay: loaded ? delay : "0ms",
      }}
    >
      <div className={`absolute top-4 right-4 w-9 h-9 ${accentIcon}`}>
        <Icon className="w-full h-full" />
      </div>

      <p className="text-3xl font-bold text-white tabular-nums leading-none mt-1 mb-2">
        {value}
      </p>

      <p className="text-xs font-semibold uppercase tracking-wider text-white/50 leading-none">
        {t(labelKey)}
      </p>

      {sublabel && (
        <p className="text-[11px] text-white/30 mt-1.5 leading-none">
          {sublabel}
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CollectionAnalytics({ collectionId, isPro }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const { data, error } = await api.get(`/collections/${collectionId}/stats`);

      if (cancelled) return;

      if (error || !data) {
        setLoading(false);
        return;
      }

      setStats(data);
      setLoading(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setLoaded(true);
        });
      });
    }

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  if (!loading && !stats) {
    return null;
  }

  const cardValues = stats
    ? [
        {
          value: stats.totalDownloads,
          sublabel: t("collection.analytics.totalDownloadsDesc"),
        },
        {
          value: formatRelativeTime(stats.lastDownloadAt, t),
          sublabel: t("collection.analytics.lastDownloadDesc"),
        },
        {
          value: stats.selectedPhotos,
          sublabel: t("collection.analytics.selectedPhotosDesc"),
        },
      ]
    : [];

  return (
    <section className="mb-5" aria-label={t("collection.analytics.title")}>
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
          {t("collection.analytics.title")}
        </h2>
        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
          PRO
        </span>
      </div>
      <p className="text-[13px] text-white/40 font-medium -mt-3 mb-4">
        {t("collection.analytics.subtitle")}
      </p>

      {/* PRO: full analytics */}
      {isPro ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {loading
            ? STAT_CARDS.map((card) => <SkeletonCard key={card.key} />)
            : STAT_CARDS.map((card, index) => (
                <StatCard
                  key={card.key}
                  card={card}
                  value={cardValues[index].value}
                  sublabel={cardValues[index].sublabel}
                  loaded={loaded}
                  delay={`${index * STAGGER_STEP_MS}ms`}
                />
              ))}
        </div>
      ) : (
        /* Non-PRO: blurred teaser with lock overlay */
        <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.08]">
          {/* Blurred placeholder cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 blur-[6px] select-none pointer-events-none">
            {STAT_CARDS.map((card) => {
              const { accentBorder, accentIcon, labelKey, Icon } = card;
              return (
                <div
                  key={card.key}
                  className={[
                    "relative bg-white/[0.04] border border-white/10 rounded-xl px-6 py-5",
                    "border-t-2",
                    accentBorder,
                  ].join(" ")}
                >
                  <div className={`absolute top-4 right-4 w-9 h-9 ${accentIcon}`}>
                    <Icon className="w-full h-full" />
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums leading-none mt-1 mb-2">
                    —
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50 leading-none">
                    {t(labelKey)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <IconLock className="w-8 h-8 text-white/30" />
            <p className="text-sm text-white/50 text-center px-4">
              {t("collection.analytics.proRequired")}
            </p>
            <Link
              to="/payments"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.5)] transition-shadow"
            >
              {t("collection.analytics.upgrade")}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
