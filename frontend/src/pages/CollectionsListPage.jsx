import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import PageHeader from "../components/PageHeader";
import Button from "../components/primitives/Button";
import CollectionCard from "../components/primitives/CollectionCard";
import CreateCollectionModal from "../components/CreateCollectionModal";
import ConfirmModal from "../components/primitives/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { photoUrl } from "../utils/photoUrl";

const PAGE_SIZE = 12;

function CollectionsListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [archiveFilter, setArchiveFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [sort]);

  const isExpiredTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE';
  const isActiveTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'FREE_TRIAL';

  const FREE_CUMULATIVE_LIMIT = 5;
  const ACTIVE_TRIAL_LIMIT = 20;

  const activeCount = collections.filter(c => c.status !== 'ARCHIVED').length;
  const cumulativeCount = user?.collectionsCreatedCount ?? 0;

  const atLimit = isExpiredTrial
    ? cumulativeCount >= FREE_CUMULATIVE_LIMIT
    : isActiveTrial
      ? activeCount >= ACTIVE_TRIAL_LIMIT
      : false;

  const showLimitBanner = isExpiredTrial || isActiveTrial;
  const limitUsed = isExpiredTrial ? cumulativeCount : activeCount;
  const limitMax = isExpiredTrial ? FREE_CUMULATIVE_LIMIT : ACTIVE_TRIAL_LIMIT;

  const totalCount = pagination?.total ?? collections.length;

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', String(PAGE_SIZE));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sort !== 'createdAt_desc') params.set('sort', sort);

    const { data, error: fetchError } = await api.get(`/collections?${params}`);

    if (fetchError) {
      setError(fetchError);
    } else if (data?.status === "OK") {
      setCollections(data.collections);
      setPagination(data.pagination ?? null);
    } else {
      setError(data?.error || "An unknown error occurred.");
    }

    setLoading(false);
  }, [page, debouncedSearch, sort]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async ({ name, clientName, clientEmail }) => {
    const createPromise = api.post('/collections', { name, clientName, clientEmail }).then(({ data, error: postError }) => {
      if (!postError && data?.status === "OK") {
        setShowCreateModal(false);
        navigate(`/collection/${data.collection.id}`);
      } else {
        if (data?.error === 'COLLECTION_LIMIT_REACHED') {
          throw new Error(t('plans.limitReachedCollections') + ' ' + t('plans.upgradeHint'));
        }
        throw new Error(postError || t('collections.createFailed'));
      }
    });

    toast.promise(createPromise, {
      loading: t('collections.creating'),
      success: t('collections.createSuccess'),
      error: (err) => err.message,
    });

    return createPromise;
  };

  const handleDeleteCollection = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);

    const { error: deleteError } = await api.delete(`/collections/${id}`);

    if (!deleteError) {
      setCollections((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (next.length === 0 && page > 1) {
          setPage((p) => p - 1);
        }
        return next;
      });
      setPagination((prev) => prev ? { ...prev, total: prev.total - 1 } : prev);
      toast.success(t('collections.deleteCollectionSuccess'));
      setDeleteTarget(null);
    } else {
      toast.error(t('collections.deleteCollectionFailed'));
    }

    setDeletingId(null);
  };

  // ── Loading skeleton ──
  if (loading && collections.length === 0) {
    return (
      <div className="font-sans max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-white/[0.08] animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-6 w-40 bg-white/[0.08] rounded animate-pulse" />
              <div className="h-3 w-56 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-36 bg-white/[0.08] rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] overflow-hidden border border-white/10"
            >
              <div
                className="aspect-[3/2] bg-white/[0.08] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="py-10 px-5 text-center font-sans text-white/50">
        <div className="inline-block px-3.5 py-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-sm text-red-400">
          {t('collections.error')} {error}
        </div>
      </div>
    );
  }

  // ── Pagination helpers ──
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
        acc.push(p);
        return acc;
      }, []);

    return (
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.06] flex-wrap gap-3">
        <span className="text-sm text-white/50">
          {t('collections.pagination.showing', {
            from: (page - 1) * PAGE_SIZE + 1,
            to: Math.min(page * PAGE_SIZE, pagination.total),
            total: pagination.total,
          })}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('collections.pagination.prev')}
          </button>

          {pagination.totalPages > 2 ? (
            pageNumbers.map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-white/30">&hellip;</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    page === item
                      ? 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white'
                      : 'border border-white/10 text-white/60 hover:bg-white/[0.06]'
                  }`}
                >
                  {item}
                </button>
              )
            )
          ) : (
            <span className="px-3 py-2 text-sm text-white/50">
              {t('collections.pagination.page', { page, totalPages: pagination.totalPages })}
            </span>
          )}

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('collections.pagination.next')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header with New Collection button ── */}
      <PageHeader
        icon="🗂️"
        title={t('collections.title')}
        subtitle={`${t('collections.collectionsCount', { count: totalCount })} · ${t('collections.subtitle')}`}
        actions={
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            disabled={atLimit}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('collections.newCollection')}
          </Button>
        }
      />

      {/* ── Plan Limit Banner ── */}
      {showLimitBanner && (
        <div className={`mb-6 px-4 py-3 rounded-[10px] border text-sm flex items-center justify-between gap-3 ${
          atLimit
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-blue-400/10 border-blue-400/20 text-blue-400'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {isExpiredTrial ? t('plans.freePlanBadge') : t('plans.trialBadge')}
            </span>
            <span>{t('plans.collectionsUsed', { used: limitUsed, limit: limitMax })}</span>
            {atLimit && <span>{isExpiredTrial ? t('plans.limitReachedCumulative') : t('plans.limitReachedCollections')}</span>}
          </div>
          <Link
            to="/payments"
            className="shrink-0 text-xs font-semibold underline hover:no-underline"
          >
            {t('plans.upgradeLink')}
          </Link>
        </div>
      )}

      {/* ── Active / Archived Tabs ── */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg w-fit">
        <button
          onClick={() => setArchiveFilter('active')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            archiveFilter === 'active'
              ? 'bg-white/[0.1] text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          {t('collection.archiveActive')}
        </button>
        <button
          onClick={() => setArchiveFilter('archived')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            archiveFilter === 'archived'
              ? 'bg-white/[0.1] text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          {t('collection.archiveArchived')}
        </button>
      </div>

      {/* ── Search & Sort ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('collections.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.08] transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-sm text-white/70 focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <option value="createdAt_desc">{t('collections.sortNewest')}</option>
          <option value="createdAt_asc">{t('collections.sortOldest')}</option>
          <option value="name_asc">{t('collections.sortNameAsc')}</option>
          <option value="name_desc">{t('collections.sortNameDesc')}</option>
          <option value="status_asc">{t('collections.sortStatus')}</option>
        </select>
      </div>

      {/* ── Empty State (search active, no results) ── */}
      {collections.length === 0 && debouncedSearch && (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {t('collections.noSearchResults')}
          </h2>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            &ldquo;{debouncedSearch}&rdquo;
          </p>
          <button
            onClick={() => setSearch('')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1] transition-colors"
          >
            {t('collections.clearSearch')}
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {collections.length === 0 && !debouncedSearch && (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {t('collections.emptyTitle')}
          </h2>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            {t('collections.emptyDescription')}
          </p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} disabled={atLimit}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('collections.emptyCreateBtn')}
          </Button>
        </div>
      )}

      {/* ── Collections Grid ── */}
      {collections.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.filter(c => archiveFilter === 'archived' ? c.status === 'ARCHIVED' : c.status !== 'ARCHIVED').map((collection) => (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                name={collection.name}
                createdAt={collection.createdAt}
                photoCount={collection.photoCount ?? 0}
                status={collection.status}
                coverImageUrl={collection.coverPhotoPath ? photoUrl(collection.coverPhotoPath) : null}
                actions={
                  <button
                    onClick={() => handleDeleteCollection(collection.id, collection.name)}
                    disabled={deletingId === collection.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('collections.deleteCollection')}
                  </button>
                }
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {renderPagination()}
        </>
      )}

      {/* ── Create Collection Modal ── */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCollection}
          disabled={atLimit}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <ConfirmModal
          title={t('collections.deleteConfirmTitle')}
          message={t('collections.deleteConfirmMessage', { name: deleteTarget.name })}
          confirmLabel={deletingId === deleteTarget.id ? t('collections.deleting') : t('collections.deleteConfirmBtn')}
          cancelLabel={t('common.cancel')}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
          variant="danger"
        />
      )}
    </div>
  );
}

export default CollectionsListPage;
