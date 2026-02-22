import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import PageHeader from "../components/PageHeader";
import Button from "../components/primitives/Button";
import CollectionCard from "../components/primitives/CollectionCard";
import CreateCollectionModal from "../components/CreateCollectionModal";
import ConfirmModal from "../components/primitives/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";

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

  const photoUrl = (storagePath) => {
    if (!storagePath) return null;
    const base = import.meta.env.VITE_API_BASE_URL;
    const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
    return `${base}/${path}`;
  };

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '12');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }

      const data = await response.json();
      if (data.status === "OK") {
        setCollections(data.collections);
        setPagination(data.pagination ?? null);
      } else {
        setError(data.error || "An unknown error occurred.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async (name) => {
    const createPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === "OK") {
        setShowCreateModal(false);
        navigate(`/collection/${data.collection.id}`);
      } else {
        if (data.error === 'COLLECTION_LIMIT_REACHED') {
          throw new Error(t('plans.limitReachedCollections') + ' ' + t('plans.upgradeHint'));
        }
        throw new Error(data.error || t('collections.createFailed'));
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
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
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
    } catch {
      toast.error(t('collections.deleteCollectionFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="font-sans max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-gray-200 animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] overflow-hidden border border-gray-200"
            >
              <div
                className="aspect-[3/2] bg-gray-200 animate-pulse"
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
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        <div className="inline-block px-3.5 py-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-800">
          {t('collections.error')} {error}
        </div>
      </div>
    );
  }

  // ── Pagination helpers ──
  const PAGE_SIZE = 12;
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
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100 flex-wrap gap-3">
        <span className="text-sm text-gray-500">
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
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('collections.pagination.prev')}
          </button>

          {pagination.totalPages > 2 ? (
            pageNumbers.map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">&hellip;</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    page === item
                      ? 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item}
                </button>
              )
            )
          ) : (
            <span className="px-3 py-2 text-sm text-gray-500">
              {t('collections.pagination.page', { page, totalPages: pagination.totalPages })}
            </span>
          )}

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-100 text-blue-700'
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

      {/* ── Empty State ── */}
      {collections.length === 0 && (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('collections.emptyTitle')}
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
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
            {collections.map((collection) => (
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
