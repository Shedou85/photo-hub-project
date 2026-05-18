import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { photoUrl } from '../utils/photoUrl';
import SEO from '../components/SEO';

// ─── Skeleton ────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface-darker animate-pulse">
      {/* Hero */}
      <div className="h-48 bg-white/[0.04]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 mb-6 flex items-end gap-5">
          <div className="w-28 h-28 rounded-full bg-white/[0.08] border-4 border-surface-darker flex-shrink-0" />
          <div className="pb-2 flex-1 space-y-2">
            <div className="h-6 w-48 bg-white/[0.08] rounded" />
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
          </div>
        </div>
        <div className="space-y-3 mb-10">
          <div className="h-4 w-full bg-white/[0.06] rounded" />
          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/[0.06] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────
function ProfileNotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface-darker flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-5xl">📷</p>
      <h1 className="text-xl font-semibold text-white">{t('publicProfile.notFound')}</h1>
      <p className="text-white/50 text-sm text-center max-w-xs">{t('publicProfile.notFoundDesc')}</p>
      <Link
        to="/"
        className="mt-2 px-5 py-2 rounded-lg bg-white/[0.06] text-white/70 border border-white/10
                   hover:bg-white/[0.1] transition-colors text-sm"
      >
        {t('publicProfile.backHome')}
      </Link>
    </div>
  );
}

// ─── Collection card ──────────────────────────────────────────────────────────
function PortfolioCard({ collection, accentColor }) {
  const { t } = useTranslation();
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-xl
                 bg-white/[0.04] border border-white/[0.08]
                 hover:border-white/20 transition-all duration-300 cursor-pointer"
    >
      {collection.coverUrl ? (
        <img
          src={collection.coverUrl}
          alt={collection.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white/20 text-3xl">📷</span>
        </div>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0
                      opacity-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white text-sm font-medium leading-tight truncate">{collection.name}</p>
        <p className="text-white/60 text-xs mt-0.5">
          {collection.photoCount} {t('publicProfile.photos')}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { username } = useParams();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);

    api.get(`/u/${username}`).then(({ data, status }) => {
      if (status === 404 || !data?.profile) {
        setNotFound(true);
      } else {
        setProfile(data.profile);
        setCollections(data.collections || []);
      }
      setLoading(false);
    });
  }, [username]);

  if (loading) return <ProfileSkeleton />;
  if (notFound) return <ProfileNotFound />;

  const accent = profile.brandingColor || '#6366f1';
  const avatarInitials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <SEO
        title={profile.name ? `${profile.name} — ${t('publicProfile.seoSuffix')}` : t('publicProfile.seoDefault')}
        description={profile.profileTagline || profile.bio?.slice(0, 155) || undefined}
        path={`/${username}`}
        image={profile.profileImageUrl || undefined}
      />

      <div className="min-h-screen bg-surface-darker text-white">

        {/* ── Hero banner ── */}
        <div
          className="h-40 sm:h-52 w-full"
          style={{ background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)` }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

          {/* ── Avatar + name row ── */}
          <div className="relative -mt-14 sm:-mt-16 mb-6 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover
                             border-4 border-surface-darker shadow-xl"
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center
                             border-4 border-surface-darker shadow-xl text-white text-2xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)` }}
                >
                  {avatarInitials}
                </div>
              )}
            </div>

            {/* Name + tagline */}
            <div className="sm:pb-2 flex-1 min-w-0">
              {/* Branding logo (PRO only) */}
              {profile.brandingLogoUrl && (
                <img
                  src={profile.brandingLogoUrl}
                  alt={profile.name}
                  className="h-7 mb-2 object-contain"
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">
                {profile.name || profile.username}
              </h1>
              {profile.profileTagline && (
                <p className="text-white/60 text-sm mt-1 truncate">{profile.profileTagline}</p>
              )}
            </div>
          </div>

          {/* ── Meta pills: specialties + location ── */}
          {(profile.specialties || profile.location) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.specialties && profile.specialties.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{ borderColor: `${accent}55`, color: accent, background: `${accent}11` }}
                >
                  {s}
                </span>
              ))}
              {profile.location && (
                <span className="px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 bg-white/[0.04] flex items-center gap-1">
                  <span>📍</span> {profile.location}
                </span>
              )}
            </div>
          )}

          {/* ── Bio ── */}
          {profile.bio && (
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-2xl whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* ── Contact links ── */}
          {(profile.websiteUrl || profile.instagramUrl) && (
            <div className="flex flex-wrap gap-3 mb-10">
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                             bg-white/[0.06] border border-white/10 text-white/70
                             hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <span>🌐</span>
                  <span className="truncate max-w-[180px]">
                    {profile.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </a>
              )}
              {profile.instagramUrl && (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                             bg-white/[0.06] border border-white/10 text-white/70
                             hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <span>📸</span>
                  <span>Instagram</span>
                </a>
              )}
            </div>
          )}

          {/* ── Portfolio grid ── */}
          {collections.length > 0 ? (
            <>
              <h2 className="text-white/70 uppercase tracking-[0.05em] text-xs font-semibold mb-4">
                {t('publicProfile.portfolio')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {collections.map(col => (
                  <PortfolioCard key={col.id} collection={col} accentColor={accent} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-white/30 text-sm">
              {t('publicProfile.noPortfolio')}
            </div>
          )}

          {/* ── Footer branding ── */}
          <div className="mt-16 pt-6 border-t border-white/[0.06] text-center">
            <a
              href="https://pixelforge.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              {t('publicProfile.poweredBy')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
