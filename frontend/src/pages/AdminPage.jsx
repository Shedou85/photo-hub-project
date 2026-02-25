import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';

// ---------- Icons ----------
const ShieldIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ---------- Constants ----------
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

// ---------- UserDetailModal ----------
// Defined outside AdminPage to prevent re-creation on each render.
const UserDetailModal = ({ user, onClose, t }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.get(`/admin/collections?userId=${user.id}&limit=50`);
      if (!error) {
        setCollections(data.collections ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleDeleteCollection = async (collectionId) => {
    setDeletingId(collectionId);
    try {
      const { data, error } = await api.delete(`/admin/collections/${collectionId}`);
      if (error) {
        toast.error(data?.error ?? t('admin.userDetail.deleteCollectionError'));
        return;
      }
      toast.success(t('admin.userDetail.deleteCollectionSuccess'));
      setDeleteConfirmId(null);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (collectionId, newStatus) => {
    const { data, error } = await api.patch(`/admin/collections/${collectionId}/status`, { status: newStatus });
    if (error) {
      toast.error(data?.error ?? 'Status update failed');
      return;
    }
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, status: newStatus } : c))
    );
  };

  const isVerified = !!user.emailVerified;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[10px] border border-gray-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{user.name || '—'}</h3>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none px-2"
            aria-label={t('admin.userDetail.close')}
          >
            &times;
          </button>
        </div>

        {/* User info grid */}
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{t('admin.users.columns.plan')}</p>
            <p className="text-sm text-gray-800 mt-0.5 font-medium">{user.plan}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{t('admin.users.columns.status')}</p>
            <div className="mt-0.5">
              <StatusBadge status={user.status} />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{t('admin.userDetail.emailVerified')}</p>
            <p className={`text-sm mt-0.5 font-medium ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
              {isVerified ? t('admin.userDetail.verified') : t('admin.userDetail.notVerified')}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{t('admin.users.columns.joined')}</p>
            <p className="text-sm text-gray-800 mt-0.5">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{t('admin.userDetail.totalPhotos')}</p>
            <p className="text-sm text-gray-800 mt-0.5 font-medium">{user.totalPhotos ?? 0}</p>
          </div>
        </div>

        {/* Collections section */}
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('admin.userDetail.collections')}</p>
          {loading ? (
            <p className="text-sm text-gray-400">{t('admin.userDetail.loadingCollections')}</p>
          ) : collections.length === 0 ? (
            <p className="text-sm text-gray-400">{t('admin.userDetail.noCollections')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.name')}</th>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.status')}</th>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.photos')}</th>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.collections.columns.created')}</th>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collections.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors duration-100">
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[150px] truncate">{c.name}</td>
                      <td className="px-3 py-2">
                        <select
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
                          aria-label={t('admin.userDetail.changeStatus')}
                        >
                          {COLLECTION_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{c.photoCount ?? 0}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/collection/${c.id}`, '_blank')}
                            className="text-indigo-600 hover:text-indigo-800 text-[12px] font-medium transition-colors whitespace-nowrap"
                          >
                            {t('admin.userDetail.openCollection')}
                          </button>
                          {deleteConfirmId === c.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteCollection(c.id)}
                                disabled={deletingId === c.id}
                                className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50"
                              >
                                {t('admin.actions.delete')}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-gray-400 hover:text-gray-600 text-[11px] transition-colors"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(c.id)}
                              disabled={deletingId === c.id}
                              className="text-red-500 hover:text-red-700 text-[12px] font-medium transition-colors disabled:opacity-50"
                            >
                              {t('admin.userDetail.deleteCollection')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('admin.userDetail.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- AdminPage ----------
const AdminPage = () => {
  const { t } = useTranslation();

  // ---------- Tab state ----------
  const [activeTab, setActiveTab] = useState('stats');

  // ---------- Stats ----------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const { data, error } = await api.get('/admin/stats');
        if (!error) {
          setStats(data);
        }
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
  const [searchInput, setSearchInput] = useState('');
  const searchTimer = useRef(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkPlanMenu, setShowBulkPlanMenu] = useState(false);

  // User detail modal state
  const [userDetailModal, setUserDetailModal] = useState(null);

  // ---------- Audit Log ----------
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsMeta, setAuditLogsMeta] = useState(null);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({ action: '', from: '', to: '', page: 1, limit: 20 });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimer.current);
  }, []);

  // ---------- Users fetch ----------
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
      const { data, error } = await api.get(`/admin/users?${params}`);
      if (error) {
        setUsers([]);
      } else {
        setUsers(data.users ?? []);
        setUsersMeta(data.pagination ?? null);
      }
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [usersFilters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [usersFilters]);

  // ---------- Audit Log fetch ----------
  const fetchAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditFilters.action) params.set('action', auditFilters.action);
      if (auditFilters.from) params.set('from', auditFilters.from);
      if (auditFilters.to) params.set('to', auditFilters.to);
      params.set('page', auditFilters.page);
      params.set('limit', auditFilters.limit);
      const { data, error } = await api.get(`/admin/audit-log?${params}`);
      if (error) {
        setAuditLogs([]);
      } else {
        setAuditLogs(data.logs ?? []);
        setAuditLogsMeta(data.pagination ?? null);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLogsLoading(false);
    }
  }, [auditFilters]);

  useEffect(() => {
    if (activeTab === 'audit-log') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // ---------- User handlers ----------
  const handleUserFieldChange = async (userId, field, value) => {
    setUpdatingUserId(userId);
    try {
      const { data, error } = await api.patch(`/admin/users/${userId}`, { [field]: value });
      if (error) {
        toast.error(data?.error ?? data?.message ?? 'Update failed');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
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
      const { data, error } = await api.delete(`/admin/users/${userId}`);
      if (error) {
        toast.error(data?.error ?? t('admin.actions.deleteError'));
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
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setUsersFilters((f) => ({ ...f, search: val, page: 1 }));
    }, 300);
  };

  // ---------- Bulk action handler ----------
  const handleBulkAction = async (action, value) => {
    setBulkLoading(true);
    try {
      const { data, error } = await api.post('/admin/users/bulk', {
        ids: Array.from(selectedIds),
        action,
        value,
      });
      if (error) {
        toast.error(data?.error ?? t('admin.users.bulkActionError'));
        return;
      }
      toast.success(t('admin.users.bulkActionSuccess'));
      setSelectedIds(new Set());
      setShowBulkPlanMenu(false);
      fetchUsers();
    } catch {
      toast.error(t('admin.users.bulkActionError'));
    } finally {
      setBulkLoading(false);
    }
  };

  // ---------- CSV Export ----------
  const handleExportCsv = () => {
    const headers = ['Name', 'Email', 'Role', 'Plan', 'Status', 'Collections', 'Total Photos', 'Email Verified', 'Joined'];
    const rows = users.map((u) =>
      [
        u.name || '',
        u.email,
        u.role,
        u.plan,
        u.status,
        u.collectionsCreatedCount ?? 0,
        u.totalPhotos ?? 0,
        u.emailVerified ? 'yes' : 'no',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Select all / toggle ----------
  const allCurrentSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));

  const handleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ---------- Tab definitions ----------
  const tabs = [
    { key: 'stats', label: t('admin.tabs.stats') },
    { key: 'users', label: t('admin.tabs.users') },
    { key: 'audit-log', label: t('admin.tabs.auditLog') },
  ];

  // ---------- Render ----------
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldIcon}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      {/* ===== Tab Navigation ===== */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[10px] p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-[8px] text-sm font-medium transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Stats Tab ===== */}
      {activeTab === 'stats' && (
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
      )}

      {/* ===== Users Tab ===== */}
      {activeTab === 'users' && (
        <section>
          <div className="border border-gray-200 rounded-[10px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">{t('admin.users.title')}</h2>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder={t('admin.users.searchPlaceholder')}
                value={searchInput}
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
              <div className="flex items-center gap-2">
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
              {/* CSV Export — always on far right */}
              <button
                onClick={handleExportCsv}
                disabled={users.length === 0}
                className="ml-auto bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t('admin.users.exportCsv')}
              </button>
            </div>

            {/* Bulk action bar — shows when 2+ selected */}
            {selectedIds.size >= 2 && (
              <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-indigo-700">
                  {t('admin.users.selectedCount', { count: selectedIds.size })}
                </span>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  disabled={bulkLoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {t('admin.users.bulkSuspend')}
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkLoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {t('admin.users.bulkActivate')}
                </button>
                {/* Bulk change plan dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowBulkPlanMenu((v) => !v)}
                    disabled={bulkLoading}
                    className="text-sm px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {t('admin.users.bulkChangePlan')}
                    <span className="text-gray-400">&#9660;</span>
                  </button>
                  {showBulkPlanMenu && (
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
                      {['FREE_TRIAL', 'STANDARD', 'PRO'].map((plan) => (
                        <button
                          key={plan}
                          onClick={() => {
                            setShowBulkPlanMenu(false);
                            handleBulkAction('plan', plan);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {plan.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={allCurrentSelected}
                          onChange={handleSelectAll}
                          aria-label={t('admin.users.selectAll')}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-300 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.name')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.role')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.plan')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.status')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.emailVerified')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.collections')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.joined')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.users.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => {
                      const isUpdating = updatingUserId === u.id;
                      const isSelected = selectedIds.has(u.id);
                      const isVerified = !!u.emailVerified;
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-gray-50 transition-colors duration-100 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                        >
                          <td className="px-4 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(u.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-300 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setUserDetailModal(u)}
                              className="text-left group"
                            >
                              <p className="font-medium text-indigo-600 group-hover:text-indigo-800 group-hover:underline cursor-pointer transition-colors">
                                {u.name || '—'}
                              </p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </button>
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
                          <td className="px-4 py-3">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                &#10003; {t('admin.users.columns.emailVerified')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                &#10007; {t('admin.users.columns.emailVerified')}
                              </span>
                            )}
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
      )}

      {/* ===== Audit Log Tab ===== */}
      {activeTab === 'audit-log' && (
        <section>
          <div className="border border-gray-200 rounded-[10px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">{t('admin.auditLog.title')}</h2>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder={t('admin.auditLog.allActions')}
                value={auditFilters.action}
                onChange={(e) => setAuditFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
                className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[160px] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-shadow"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 whitespace-nowrap">{t('admin.auditLog.fromDate')}</label>
                <input
                  type="date"
                  value={auditFilters.from}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
                  className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 whitespace-nowrap">{t('admin.auditLog.toDate')}</label>
                <input
                  type="date"
                  value={auditFilters.to}
                  onChange={(e) => setAuditFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
                  className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 cursor-pointer"
                />
              </div>
              <button
                onClick={() => setAuditFilters({ action: '', from: '', to: '', page: 1, limit: 20 })}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t('admin.auditLog.clearFilters')}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {auditLogsLoading ? (
                <p className="text-sm text-gray-500 px-6 py-8">{t('admin.loading')}</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-8">{t('admin.auditLog.noLogs')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLog.columns.date')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLog.columns.admin')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLog.columns.action')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLog.columns.target')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLog.columns.changes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLogs.map((log, idx) => {
                      const changesStr = log.changes ? JSON.stringify(log.changes, null, 2) : '';
                      const truncated = changesStr.length > 120 ? changesStr.slice(0, 120) + '...' : changesStr;
                      return (
                        <tr key={log.id ?? idx} className="hover:bg-gray-50 transition-colors duration-100">
                          <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-800 text-xs">{log.adminName || log.adminEmail || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{log.targetEntityId || '—'}</td>
                          <td className="px-4 py-3 max-w-[260px]">
                            {changesStr ? (
                              <code
                                className="text-xs bg-gray-50 px-2 py-1 rounded whitespace-pre-wrap break-all block"
                                title={changesStr}
                              >
                                {truncated}
                              </code>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Audit Log Pagination */}
            {auditLogsMeta && auditLogsMeta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  disabled={auditLogsMeta.page <= 1}
                  onClick={() => setAuditFilters((f) => ({ ...f, page: f.page - 1 }))}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('admin.pagination.prev')}
                </button>
                <span className="text-xs text-gray-400">
                  {t('admin.pagination.page')} {auditLogsMeta.page} / {auditLogsMeta.totalPages} &middot; {auditLogsMeta.total} {t('admin.pagination.total')}
                </span>
                <button
                  disabled={auditLogsMeta.page >= auditLogsMeta.totalPages}
                  onClick={() => setAuditFilters((f) => ({ ...f, page: f.page + 1 }))}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('admin.pagination.next')}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== User Detail Modal ===== */}
      {userDetailModal && (
        <UserDetailModal
          user={userDetailModal}
          onClose={() => setUserDetailModal(null)}
          t={t}
        />
      )}

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
