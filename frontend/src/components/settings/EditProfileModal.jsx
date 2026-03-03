import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { toast } from 'sonner';

function EditProfileModal({ user, onClose, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
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
    setLoading(true);

    const savePromise = api.patch('/profile/me', { name, bio })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.status === 'OK' && data?.user) {
          onSave(data.user);
          onClose();
        } else {
          throw new Error(data?.message || 'The server returned an unexpected response.');
        }
      })
      .finally(() => setLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.saving'),
      success: t('profile.updateSuccess'),
      error: (err) => `${t('profile.updateFailed')} ${err.message}`,
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
        <h3 className="text-base font-semibold text-white mb-4">{t('profile.editProfile')}</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="modal-name" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              id="modal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors duration-150 font-sans placeholder:text-white/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="modal-bio" className="block mb-1 text-sm font-semibold text-white/60">
              {t('profile.bio')}
              <span className="font-normal text-white/30 ml-[6px]">({t('profile.optional')})</span>
            </label>
            <textarea
              id="modal-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              className="w-full py-2.5 px-4 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors duration-150 font-sans resize-y leading-[1.5] placeholder:text-white/20"
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
              {loading ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
