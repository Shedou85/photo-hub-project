import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

// ── Inline SVG icons ────────────────────────────────────────────────────────

function IconGrid({ className }) {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconLightning({ className }) {
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
      <path d="M13 2L4.5 13.5H11L10.5 22L19 10.5H13L13 2Z" />
    </svg>
  );
}

function IconArchive({ className }) {
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
      <path d="M21 8V19a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
      <rect x="1" y="3" width="22" height="5" rx="1" />
      <path d="M10 12h4" />
    </svg>
  );
}

function IconCamera({ className }) {
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
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── Stat card configuration ──────────────────────────────────────────────────

const STAT_CARDS = [
  {
    key: "totalCollections",
    labelKey: "profile.activity.totalCollections",
    accentBorder: "border-t-blue-500/40",
    accentIcon: "text-blue-400/20",
    Icon: IconGrid,
  },
  {
    key: "activeCollections",
    labelKey: "profile.activity.activeCollections",
    accentBorder: "border-t-emerald-500/40",
    accentIcon: "text-emerald-400/20",
    Icon: IconLightning,
  },
  {
    key: "archivedCollections",
    labelKey: "profile.activity.archivedCollections",
    accentBorder: "border-t-amber-500/40",
    accentIcon: "text-amber-400/20",
    Icon: IconArchive,
  },
  {
    key: "totalPhotos",
    labelKey: "profile.activity.totalPhotos",
    accentBorder: "border-t-violet-500/40",
    accentIcon: "text-violet-400/20",
    Icon: IconCamera,
  },
];

// Stagger delay step in ms — each card fades in 75ms after the previous
const STAGGER_STEP_MS = 75;

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-6 py-5">
      {/* Top: spacer where icon lives */}
      <div className="flex justify-end mb-4">
        <div className="w-8 h-8 rounded animate-pulse bg-white/[0.06]" />
      </div>
      {/* Number placeholder */}
      <div className="h-9 w-16 rounded animate-pulse bg-white/[0.06] mb-3" />
      {/* Label placeholder */}
      <div className="h-3 w-28 rounded animate-pulse bg-white/[0.06]" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ card, value, loaded, delay }) {
  const { t } = useTranslation();
  const { accentBorder, accentIcon, labelKey, Icon } = card;

  return (
    <div
      className={[
        // Base card
        "relative bg-white/[0.04] border border-white/10 rounded-xl px-6 py-5",
        // Top accent border (2px, per card colour)
        "border-t-2",
        accentBorder,
        // Hover lift + glow
        "hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-2xl",
        // Transition
        "transition-all duration-300",
        // Reveal animation
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
      style={{
        // Pure CSS transition for the entry animation; delay is dynamic so inline style is required
        transition: "opacity 400ms ease, transform 400ms ease, background-color 300ms ease, box-shadow 300ms ease",
        transitionDelay: loaded ? delay : "0ms",
      }}
    >
      {/* Decorative icon — top-right, very muted */}
      <div className={`absolute top-4 right-4 w-9 h-9 ${accentIcon}`}>
        <Icon className="w-full h-full" />
      </div>

      {/* Stat number */}
      <p className="text-3xl font-bold text-white tabular-nums leading-none mt-1 mb-2">
        {value ?? 0}
      </p>

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50 leading-none">
        {t(labelKey)}
      </p>
    </div>
  );
}

// ── ActivityStats ─────────────────────────────────────────────────────────────

export default function ActivityStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // `loaded` is set to true after data arrives, triggering the CSS entry animation
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const { data, error } = await api.get("/profile/stats");

      if (cancelled) return;

      if (error || !data) {
        // Silently fail — component returns null below
        setLoading(false);
        return;
      }

      setStats(data);
      setLoading(false);

      // Tiny rAF delay ensures the browser has painted the opacity-0 state
      // before we flip `loaded`, so the CSS transition actually runs.
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
  }, []);

  // ── Error / missing data state — render nothing rather than breaking the page
  if (!loading && !stats) {
    return null;
  }

  return (
    <section className="mb-6" aria-label={t("profile.activity.title")}>
      {/* Section header */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-[0.05em] mb-0.5">
          {t("profile.activity.title")}
        </h2>
        <p className="text-[13px] text-white/40 font-medium">
          {t("profile.activity.subtitle")}
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? STAT_CARDS.map((card) => <SkeletonCard key={card.key} />)
          : STAT_CARDS.map((card, index) => (
              <StatCard
                key={card.key}
                card={card}
                value={stats[card.key]}
                loaded={loaded}
                delay={`${index * STAGGER_STEP_MS}ms`}
              />
            ))}
      </div>
    </section>
  );
}
