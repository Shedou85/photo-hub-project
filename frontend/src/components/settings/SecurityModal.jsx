import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { toast } from 'sonner';

function SecurityModal({ user, onClose, onSave }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [loading, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    setLoading(true);

    const body = { newPassword };
    if (user.hasPassword) {
      body.currentPassword = currentPassword;
    }

    const savePromise = api.patch('/profile/me', body)
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) onSave(data.user);
        onClose();
      })
      .finally(() => setLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.updatingPassword'),
      success: t('profile.passwordUpdated'),
      error: (err) => `${t('profile.passwordUpdateFailed')} ${err.message}`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-md mx-4 px-6 py-5">
        <h3 className="text-base font-semibold text-white mb-1">
          {t(user.hasPassword ? 'profile.changePassword' : 'profile.setPassword')}
        </h3>
        <p className="text-sm text-white/40 mb-4">
          {user.hasPassword ? t('profile.securityDesc') : t('profile.securityDescNoPassword')}
        </p>

        {!user.hasPassword && (
          <p className="text-sm text-white/50 mb-4">
            {t('profile.setPasswordHint')}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {user.hasPassword && (
            <div className="mb-4">
              <label htmlFor="modal-currentPassword" className="block mb-1 text-sm font-semibold text-white/60">
                {t('profile.currentPassword')}
              </label>
              <input
                type="password"
                id="modal-currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors duration-150 font-sans placeholder:text-white/20"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="modal-newPassword" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.newPassword')}
            </label>
            <input
              type="password"
              id="modal-newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="modal-confirmPassword" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.confirmPassword')}
            </label>
            <input
              type="password"
              id="modal-confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all disabled:opacity-50 ${
                loading
                  ? 'text-white/40 bg-white/[0.08] cursor-not-allowed'
                  : 'text-white bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:opacity-90'
              }`}
            >
              {loading ? t('profile.updatingPassword') : t('profile.updatePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SecurityModal;
