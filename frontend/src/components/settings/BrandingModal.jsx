import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { getAccentButtonStyle } from '../../utils/brandingUtils';

function BrandingModal({ user, isPro, onClose, onSave }) {
  const { t } = useTranslation();
  const [brandingColor, setBrandingColor] = useState(user?.brandingColor || '#6366f1');
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !brandingLoading && !logoUploading) onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [brandingLoading, logoUploading, onClose]);

  const handleLogoUpload = useCallback(async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    const uploadPromise = api.post('/profile/branding/logo', formData)
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) onSave(data.user);
      })
      .finally(() => setLogoUploading(false));

    toast.promise(uploadPromise, {
      loading: t('profile.branding.uploadLogo'),
      success: t('profile.branding.logoUploaded'),
      error: (err) => `${t('profile.branding.logoUploadFailed')}: ${err.message}`,
    });
  }, [onSave, t]);

  const handleLogoDrop = useCallback((e) => {
    e.preventDefault();
    setLogoDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

  const handleLogoDelete = useCallback(async () => {
    const deletePromise = api.delete('/profile/branding/logo')
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) onSave(data.user);
      });

    toast.promise(deletePromise, {
      loading: t('profile.branding.removeLogo'),
      success: t('profile.branding.logoDeleted'),
      error: (err) => `${t('profile.branding.logoDeleteFailed')}: ${err.message}`,
    });
  }, [onSave, t]);

  const handleBrandingColorSave = useCallback(() => {
    setBrandingLoading(true);
    const savePromise = api.patch('/profile/me', { brandingColor })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) onSave(data.user);
      })
      .finally(() => setBrandingLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.branding.savingColor'),
      success: t('profile.branding.colorSaved'),
      error: (err) => `${t('profile.branding.colorSaveFailed')}: ${err.message}`,
    });
  }, [brandingColor, onSave, t]);

  const handleBrandingColorReset = useCallback(() => {
    setBrandingLoading(true);
    setBrandingColor('#6366f1');
    const savePromise = api.patch('/profile/me', { brandingColor: null })
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        if (data?.user) onSave(data.user);
      })
      .finally(() => setBrandingLoading(false));

    toast.promise(savePromise, {
      loading: t('profile.branding.savingColor'),
      success: t('profile.branding.colorReset'),
      error: (err) => `${t('profile.branding.colorSaveFailed')}: ${err.message}`,
    });
  }, [onSave, t]);

  const loading = brandingLoading || logoUploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl w-full max-w-lg mx-4 px-6 py-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          {t('profile.branding.title')}
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">Professional</span>
        </h3>
        <p className="text-sm text-white/40 mb-4">{t('profile.branding.subtitle')}</p>

        {isPro ? (
          <div className="space-y-6">
            {/* Logo uploader */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/60">
                {t('profile.branding.logo')}
              </label>
              <p className="text-[13px] text-white/40 mb-3">{t('profile.branding.logoDesc')}</p>

              {user.brandingLogoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-[120px] h-[60px] bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_MEDIA_BASE_URL}/${user.brandingLogoUrl}`}
                      alt="Brand logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    {t('profile.branding.removeLogo')}
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true); }}
                  onDragLeave={() => setLogoDragOver(false)}
                  onDrop={handleLogoDrop}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    logoDragOver
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/[0.15] bg-white/[0.02] hover:border-white/[0.25] hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  />
                  <svg className="w-8 h-8 mx-auto mb-2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-white/50 font-medium">
                    {logoDragOver ? t('profile.branding.dropLogo') : t('profile.branding.dragOrClick')}
                  </p>
                  <p className="text-xs text-white/30 mt-1">{t('profile.branding.logoFormats')}</p>
                  {logoUploading && (
                    <div className="mt-2 w-6 h-6 mx-auto border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )}
            </div>

            {/* Accent color picker */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/60">
                {t('profile.branding.accentColor')}
              </label>
              <p className="text-[13px] text-white/40 mb-3">{t('profile.branding.accentColorDesc')}</p>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="color"
                  value={brandingColor}
                  onChange={(e) => setBrandingColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/[0.12] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={brandingColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,8}$/.test(val)) setBrandingColor(val);
                  }}
                  className="w-28 py-2 px-3 text-sm text-white bg-white/[0.06] border-[1.5px] border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08] rounded-lg outline-none transition-colors font-mono placeholder:text-white/20"
                  placeholder="#6366f1"
                />
              </div>

              {/* Live preview */}
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">{t('profile.branding.preview')}</p>
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex flex-col items-center gap-3">
                    {user.brandingLogoUrl && (
                      <img
                        src={`${import.meta.env.VITE_MEDIA_BASE_URL}/${user.brandingLogoUrl}`}
                        alt="Preview"
                        className="h-8 object-contain opacity-80"
                      />
                    )}
                    <div className="text-sm text-white/60 font-medium">Gallery Name</div>
                    <button
                      type="button"
                      className="py-2 px-5 text-xs font-semibold rounded-lg text-white transition-all"
                      style={getAccentButtonStyle(brandingColor)}
                    >
                      Submit Selections
                    </button>
                  </div>
                </div>
              </div>

              {/* Save / Reset buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBrandingColorSave}
                  disabled={brandingLoading}
                  className={`py-2 px-5 text-sm font-semibold rounded-lg border-none transition-opacity duration-150 ${
                    brandingLoading
                      ? 'text-white/40 bg-white/[0.08] cursor-not-allowed'
                      : 'text-white cursor-pointer hover:opacity-90 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]'
                  }`}
                >
                  {brandingLoading ? t('profile.branding.savingColor') : t('profile.branding.saveColor')}
                </button>
                <button
                  type="button"
                  onClick={handleBrandingColorReset}
                  disabled={brandingLoading}
                  className="py-2 px-4 text-sm font-semibold rounded-lg bg-white/[0.06] text-white/60 border border-white/10 hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                >
                  {t('profile.branding.resetColor')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD: Blurred teaser */
          <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <div className="blur-[6px] select-none pointer-events-none p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[50px] bg-white/[0.06] border border-white/[0.12] rounded-lg" />
                <div className="h-8 w-24 bg-white/[0.06] rounded-lg" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20" />
                <div className="h-4 w-20 bg-white/[0.06] rounded" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-3 w-24 bg-white/[0.06] rounded" />
                  <div className="h-8 w-32 bg-indigo-500/20 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="text-sm text-white/50 text-center px-4">
                {t('profile.branding.proRequired')}
              </p>
              <Link
                to="/payments"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.5)] transition-shadow"
              >
                {t('profile.branding.upgrade')}
              </Link>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrandingModal;
