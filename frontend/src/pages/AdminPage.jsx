import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';

const ShieldIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SELECTING: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-indigo-100 text-indigo-700',
  DOWNLOADED: 'bg-purple-100 text-purple-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const COLLECTION_STATUSES = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED', 'ARCHIVED'];

const AdminPage = () => {
  const { t } = useTranslation();

  // ---------- Stats ----------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/stats`, { credentials: 'include' });
        const data = await res.json();
        setStats(data);
      } catch {
        // silently ignore — stats will just not show
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ---------- Users ----------
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersFilters, setUsersFilters] = useState({ search: '', role: '', status: '', plan: '', page: 1, limit: 20 });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (usersFilters.search) params.set('search', usersFilters.search);
      if (usersFilters.role) params.set('role', usersFilters.role);
      if (usersFilters.status) params.set('status', usersFilters.status);
      if (usersFilters.plan) params.set('plan', usersFilters.plan);
      params.set('page', usersFilters.page);
      params.set('limit', usersFilters.limit);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users?${params}`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users ?? []);
      setUsersMeta(data.pagination ?? null);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [usersFilters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserFieldChange = async (userId, field, value) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? err.message ?? 'Update failed');
        return;
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated.user } : u)));
      toast.success(t('admin.actions.updateSuccess'));
    } catch (e) {
      toast.error(e.message ?? 'Network error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeletingUserId(userId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? t('admin.actions.deleteError'));
        return;
      }
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        if (next.length === 0 && usersFilters.page > 1) {
          setUsersFilters((f) => ({ ...f, page: f.page - 1 }));
        }
        return next;
      });
      toast.success(t('admin.actions.deleteSuccess'));
      setDeleteConfirm(null);
    } catch (e) {
      toast.error(e.message ?? t('admin.actions.deleteError'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setUsersFilters((f) => ({ ...f, search: val, page: 1 }));
    }, 300);
  };

  // ---------- Collections ----------
  const [collections, setCollections] = useState([]);
  const [collectionsMeta, setCollectionsMeta] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsFilters, setCollectionsFilters] = useState({ status: '', page: 1, limit: 20 });

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (collectionsFilters.status) params.set('status', collectionsFilters.status);
      params.set('page', collectionsFilters.page);
      params.set('limit', collectionsFilters.limit);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/collections?${params}`, { credentials: 'include' });
      const data = await res.json();
      setCollections(data.collections ?? []);
      setCollectionsMeta(data.pagination ?? null);
    } catch {
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  }, [collectionsFilters]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  // ---------- Render ----------
  return (
    <div className="space-y-8">
      <PageHeader
        icon={ShieldIcon}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      {/* ===== Section 1: Platform Stats ===== */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">{t('admin.stats.title')}</h2>
        {statsLoading ? (
          <p className="text-sm text-gray-500">{t('admin.loading')}</p>
        ) : !stats ? (
          <p className="text-sm text-gray-500">{t('admin.noData')}</p>
        ) : (
          <div className="space-y-4">
            {/* 4 main stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('admin.stats.totalUsers')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers ?? 0}</p>
              </div>
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('admin.stats.activeUsers')}</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeUsers ?? 0}</p>
              </div>
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('admin.stats.suspendedUsers')}</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{stats.suspendedUsers ?? 0}</p>
              </div>
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('admin.stats.totalDownloads')}</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.totalDownloads ?? 0}</p>
              </div>
            </div>

            {/* 2 breakdown cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Plan Distribution */}
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('admin.stats.planBreakdown')}</p>
                <div className="space-y-2">
                  {['FREE_TRIAL', 'STANDARD', 'PRO'].map((plan) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{plan.replace('_', ' ')}</span>
                      <span className="text-sm font-semibold text-gray-800">{stats.planBreakdown?.[plan] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collections by Status */}
              <div className="border border-gray-200 rounded-[10px] px-6 py-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('admin.stats.collectionsByStatus')}</p>
                <div className="space-y-2">
                  {COLLECTION_STATUSES.map((status) => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="text-sm font-semibold text-gray-800">{stats.collectionsByStatus?.[status] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== Section 2: Users Table ===== */}
      <section>
        <div className="border border-gray-200 rounded-[10px] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">{t('admin.users.title')}</h2>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              defaultValue={usersFilters.search}
              onChange={handleSearchChange}
              className="flex-1 min-w-[200px] text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-shadow"
            />
            <select
              value={usersFilters.role}
              onChange={(e) => setUsersFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
              className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[110px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
            >
              <option value="">{t('admin.users.allRoles')}</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={usersFilters.status}
              onChange={(e) => setUsersFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[120px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
            >
              <option value="">{t('admin.users.allStatuses')}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <select
              value={usersFilters.plan}
              onChange={(e) => setUsersFilters((f) => ({ ...f, plan: e.target.value, page: 1 }))}
              className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[120px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
            >
              <option value="">{t('admin.users.allPlans')}</option>
              <option value="FREE_TRIAL">FREE_TRIAL</option>
              <option value="STANDARD">STANDARD</option>
              <option value="PRO">PRO</option>
            </select>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400 whitespace-nowrap">{t('admin.pagination.perPage')}:</span>
              <select
                value={usersFilters.limit}
                onChange={(e) => setUsersFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}
                className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {usersLoading ? (
              <p className="text-sm text-gray-500 px-6 py-8">{t('admin.loading')}</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500 px-6 py-8">{t('admin.noData')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.name')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.role')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.plan')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.status')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.collections')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.joined')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const isUpdating = updatingUserId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors duration-100">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{u.name || '—'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={isUpdating}
                            onChange={(e) => handleUserFieldChange(u.id, 'role', e.target.value)}
                            className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 min-w-[72px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.plan}
                            disabled={isUpdating}
                            onChange={(e) => handleUserFieldChange(u.id, 'plan', e.target.value)}
                            className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 min-w-[90px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="FREE_TRIAL">FREE_TRIAL</option>
                            <option value="STANDARD">STANDARD</option>
                            <option value="PRO">PRO</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.status}
                            disabled={isUpdating}
                            onChange={(e) => handleUserFieldChange(u.id, 'status', e.target.value)}
                            className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 min-w-[90px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{u.collectionsCreatedCount ?? 0}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            disabled={isUpdating || u.role === 'ADMIN'}
                            title={u.role === 'ADMIN' ? t('admin.actions.deleteAdminBlocked') : t('admin.actions.delete')}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {t('admin.actions.delete')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Users Pagination */}
          {usersMeta && usersMeta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={usersMeta.page <= 1}
                onClick={() => setUsersFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.pagination.prev')}
              </button>
              <span className="text-xs text-gray-400">
                {t('admin.pagination.page')} {usersMeta.page} / {usersMeta.totalPages} &middot; {usersMeta.total} {t('admin.pagination.total')}
              </span>
              <button
                disabled={usersMeta.page >= usersMeta.totalPages}
                onClick={() => setUsersFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.pagination.next')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== Section 3: Collections Table ===== */}
      <section>
        <div className="border border-gray-200 rounded-[10px] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-800">{t('admin.collections.title')}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={collectionsFilters.status}
                onChange={(e) => setCollectionsFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
                className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[130px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
              >
                <option value="">{t('admin.collections.allStatuses')}</option>
                {COLLECTION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">{t('admin.pagination.perPage')}:</span>
                <select
                  value={collectionsFilters.limit}
                  onChange={(e) => setCollectionsFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}
                  className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {collectionsLoading ? (
              <p className="text-sm text-gray-500 px-6 py-8">{t('admin.loading')}</p>
            ) : collections.length === 0 ? (
              <p className="text-sm text-gray-500 px-6 py-8">{t('admin.noData')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.name')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.photographer')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.status')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.photos')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.client')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.created')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collections.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors duration-100">
                      <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{c.userName || '—'}</p>
                        <p className="text-xs text-gray-400">{c.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.photoCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{c.clientName || '—'}</p>
                        {c.clientEmail && <p className="text-xs text-gray-400">{c.clientEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Collections Pagination */}
          {collectionsMeta && collectionsMeta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={collectionsMeta.page <= 1}
                onClick={() => setCollectionsFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.pagination.prev')}
              </button>
              <span className="text-xs text-gray-400">
                {t('admin.pagination.page')} {collectionsMeta.page} / {collectionsMeta.totalPages} &middot; {collectionsMeta.total} {t('admin.pagination.total')}
              </span>
              <button
                disabled={collectionsMeta.page >= collectionsMeta.totalPages}
                onClick={() => setCollectionsFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.pagination.next')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== Delete User Confirmation Modal ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[10px] border border-gray-200 px-8 py-7 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {t('admin.actions.deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('admin.actions.deleteConfirmMessage', { name: deleteConfirm.name || deleteConfirm.email })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deletingUserId === deleteConfirm.id}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.id)}
                disabled={deletingUserId === deleteConfirm.id}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deletingUserId === deleteConfirm.id ? t('admin.actions.deleting') : t('admin.actions.deleteConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
