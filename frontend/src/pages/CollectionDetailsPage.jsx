import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { PHOTO_GRID_CLASSES } from '../constants/styles';
import Button from '../components/primitives/Button';
import Badge from '../components/primitives/Badge';
import Accordion from '../components/Accordion';
import PromotionalConsentModal from '../components/collection/PromotionalConsentModal';
import SortablePhotoGrid from '../components/collection/SortablePhotoGrid';
import { useCollectionData } from '../hooks/useCollectionData';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useLightbox } from '../hooks/useLightbox';
import { usePhotoFiltering } from '../hooks/usePhotoFiltering';
import { usePhotoReorder } from '../hooks/usePhotoReorder';
import { generateCopyScript } from '../utils/copyScript';
import { photoUrl } from '../utils/photoUrl';


const EXPIRED_TRIAL_PHOTO_LIMIT = 30;
const STANDARD_PHOTO_LIMIT = 500;
const PHOTO_LIMIT_WARNING_BUFFER = 5;
const DELETE_CONFIRM_DURATION = 8000;

function CollectionDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const editedFileInputRef = useRef(null);

  // Custom hooks
  const {
    collection, setCollection,
    loading, error,
    selections,
    editedPhotos, fetchEditedPhotos,
    handleStartSelecting,
    handleArchive,
    doDeleteCollection,
    handleSaveEdit: handleSaveEditHook,
  } = useCollectionData(id);

  const {
    photos, setPhotos,
    uploadFiles, uploadEditedFiles,
    handleDeletePhoto, handleSetCover,
    anyUploading, uploadErrors, validationErrors,
    anyEditedUploading, editedUploadErrors, editedValidationErrors,
    fetchPhotos,
  } = usePhotoUpload(id, collection, setCollection);

  const lightbox = useLightbox(photos.length);
  const editedLightbox = useLightbox(editedPhotos.length);
  const { filter, setFilter, selectedPhotoIds, filteredPhotos } = usePhotoFiltering(photos, selections, id);

  const { user } = useAuth();

  const {
    isReorderMode, isPro, isSaving: isReorderSaving,
    enterReorderMode, cancelReorder, handleDragEnd, saveOrder, hasOrderChanged,
  } = usePhotoReorder(id, photos, setPhotos, user?.plan);

  // Local UI state
  const [dragOver, setDragOver] = useState(false);
  const [dragOverEdited, setDragOverEdited] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showEditedFinalsZone, setShowEditedFinalsZone] = useState(false);
  const [showPromotionalModal, setShowPromotionalModal] = useState(false);
  const [actionCardOpen, setActionCardOpen] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editSourceFolder, setEditSourceFolder] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const isExpiredTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE';
  const isActiveTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'FREE_TRIAL';
  const photoLimit = isExpiredTrial ? EXPIRED_TRIAL_PHOTO_LIMIT : (isActiveTrial || user?.plan === 'STANDARD') ? STANDARD_PHOTO_LIMIT : null;
  const photoCount = photos.length;
  const atPhotoLimit = photoLimit !== null && photoCount >= photoLimit;
  const nearPhotoLimit = photoLimit !== null && photoCount >= (photoLimit - PHOTO_LIMIT_WARNING_BUFFER);
  const showPhotoLimit = photoLimit !== null;

  // Fetch photos on mount
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileChange = (e) => {
    uploadFiles(e.target.files, setShowUploadZone);
    e.target.value = "";
  };

  const handleEditedFileChange = (e) => {
    uploadEditedFiles(e.target.files, fetchEditedPhotos);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files, setShowUploadZone);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleEditedDrop = (e) => {
    e.preventDefault();
    setDragOverEdited(false);
    uploadEditedFiles(e.dataTransfer.files, fetchEditedPhotos);
  };

  const handleEditedDragOver = (e) => {
    e.preventDefault();
    setDragOverEdited(true);
  };

  const handleEditedDragLeave = () => setDragOverEdited(false);

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/share/${collection.shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t("collection.linkCopied"));
    });
  };

  const handleCopyDeliveryLink = () => {
    if (!collection.deliveryToken) {
      toast.error(t('collection.deliveryTokenMissing'));
      return;
    }
    const url = `${window.location.origin}/deliver/${collection.deliveryToken}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('collection.deliveryLinkCopied'));
    }).catch(() => {
      toast.error(t('collection.linkCopyFailed'));
    });
  };

  const handleDeleteCollection = () => {
    toast(t('collection.confirmDeleteCollection'), {
      position: 'bottom-center',
      action: {
        label: t('collection.delete'),
        onClick: doDeleteCollection,
      },
      cancel: {
        label: t('common.cancel'),
        onClick: () => {},
      },
      duration: DELETE_CONFIRM_DURATION,
    });
  };

  const handleEditCollection = () => {
    setEditName(collection.name || '');
    setEditClientName(collection.clientName || '');
    setEditClientEmail(collection.clientEmail || '');
    setEditSourceFolder(collection.sourceFolder || '');
    setShowEditForm(f => !f);
  };

  const handleCopySelectedPhotos = () => {
    if (!collection.sourceFolder || selectedPhotoIds.size === 0) return;
    const selected = photos.filter(p => selectedPhotoIds.has(p.id));
    generateCopyScript(collection.sourceFolder, selected, collection.name);
    toast.success(t('collection.copySelectedSuccess', { count: selected.length }));
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const success = await handleSaveEditHook({
        name: editName,
        clientName: editClientName,
        clientEmail: editClientEmail,
        sourceFolder: editSourceFolder,
      });
      if (success) {
        setShowEditForm(false);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };


  if (loading) {
    return (
      <div className="py-10 px-5 text-center font-sans text-white/50">
        {t("collection.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans max-w-6xl mx-auto">
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3.5 py-3 text-sm">
          {t("collection.error")} {error}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-10 px-5 text-center font-sans text-white/50">
        {t("collection.notFound")}
      </div>
    );
  }

  const getStepperConfig = () => {
    const status = collection.status;
    if (status === 'DRAFT') {
      const activeStep = photos.length === 0 ? 0 : 1;
      return {
        steps: [t('collection.stepAddPhotos'), t('collection.stepStartSelecting')],
        activeStep,
        phaseLabel: t('collection.draftPhaseInProgress'),
      };
    }
    if (status === 'SELECTING') {
      return {
        steps: [t('collection.stepUploadPhotos'), t('collection.stepClientSelecting'), t('collection.stepUploadFinals')],
        activeStep: 1,
        phaseLabel: t('collection.selectingPhaseInProgress'),
      };
    }
    if (status === 'REVIEWING') {
      return {
        steps: [t('collection.stepClientSelection'), t('collection.stepUploadFinals'), t('collection.stepDelivered')],
        activeStep: 1,
        phaseLabel: t('collection.reviewPhaseInProgress'),
      };
    }
    if (status === 'DELIVERED') {
      return {
        steps: [t('collection.stepClientSelection'), t('collection.stepUploadFinals'), t('collection.stepDelivered')],
        activeStep: 2,
        phaseLabel: t('collection.deliveredPhaseComplete'),
      };
    }
    if (status === 'DOWNLOADED') {
      return {
        steps: [t('collection.stepClientSelection'), t('collection.stepUploadFinals'), t('collection.stepDelivered')],
        activeStep: 2,
        phaseLabel: t('collection.downloadedPhaseComplete'),
      };
    }
    return { steps: [], activeStep: 0, phaseLabel: '' };
  };

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Back link ── */}
      <Link
        to="/collections"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-indigo-400 no-underline mb-5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("collection.backToCollections")}
      </Link>

      {/* ── Collection Action Card ── */}
      <div className="bg-white/[0.04] border border-white/10 rounded-[10px] shadow-xl mb-5">
        {/* Header */}
        <button
          onClick={() => setActionCardOpen(o => !o)}
          className="w-full flex items-center px-5 py-4 cursor-pointer gap-3 text-left bg-transparent border-none"
        >
          <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold text-white">{collection.name}</span>
            {(collection.clientName || collection.clientEmail) && (
              <span className="ml-2 text-sm text-white/50 font-normal">
                {[collection.clientName, collection.clientEmail].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <Badge status={collection.status}>{t(`collection.status.${collection.status}`)}</Badge>
          <svg
            className={`w-5 h-5 text-white/40 transition-transform duration-300 ${actionCardOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Body */}
        <div className={`transition-all duration-300 overflow-hidden ${actionCardOpen ? 'max-h-[900px]' : 'max-h-0'}`}>
          <div className="px-5 pb-5">
            {/* Phase subtitle + horizontal stepper */}
            {(() => {
              const { steps, activeStep, phaseLabel } = getStepperConfig();
              return (
                <>
                  <p className="text-sm text-white/50 mb-4">{phaseLabel}</p>

                  {/* Horizontal stepper */}
                  {steps.length > 0 && (
                    <div className="flex items-start gap-0 mb-5">
                      {steps.map((step, idx) => (
                        <div key={step} className="flex items-start" style={{ flex: idx < steps.length - 1 ? '1 1 0%' : '0 0 auto' }}>
                          <div className="flex flex-col items-center gap-1 min-w-0">
                            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0
                              ${idx < activeStep ? 'bg-blue-600 text-white' : ''}
                              ${idx === activeStep ? 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white ring-4 ring-indigo-500/20' : ''}
                              ${idx > activeStep ? 'bg-white/[0.08] text-white/40' : ''}`}
                            >
                              {idx < activeStep ? (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : idx + 1}
                            </div>
                            <span className={`text-[11px] font-medium text-center leading-tight
                              ${idx === activeStep ? 'text-indigo-400' : 'text-white/40'}`}
                              style={{ maxWidth: '70px' }}
                            >
                              {step}
                            </span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`flex-1 h-px mx-2 mt-3.5 ${idx < activeStep ? 'bg-blue-400' : 'bg-white/[0.12]'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Gradient Action Card */}
            {collection.status === 'DRAFT' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-white/[0.04] border border-white/[0.08] mb-2">
                <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p className="text-white font-bold text-lg m-0">{t('collection.addPhotosTitle')}</p>
                  <p className="text-white/50 text-sm m-0 mt-1">{t('collection.addPhotosDesc')}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {photos.length === 0 ? (
                    <Button variant="action" onClick={() => setShowUploadZone(!showUploadZone)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {t('collection.addPhotos')}
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => setShowUploadZone(!showUploadZone)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {t('collection.addMorePhotos')}
                      </Button>
                      <Button variant="action" onClick={handleStartSelecting}>
                        {t('collection.startSelecting')}
                      </Button>
                    </>
                  )}
                </div>
                {photos.length > 0 && (
                  <p className="text-white/50 text-xs m-0">{t('collection.photosCount', { count: photos.length })}</p>
                )}
              </div>
            )}

            {collection.status === 'SELECTING' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-blue-500/[0.06] border border-blue-500/[0.12] mb-2">
                <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div>
                  <p className="text-white font-bold text-lg m-0">{t('collection.waitingForClientTitle')}</p>
                  <p className="text-white/50 text-sm m-0 mt-1">{t('collection.waitingForClientDesc')}</p>
                </div>
                <Button variant="secondary" onClick={handleCopyShareLink}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {t('collection.copyShareLink')}
                </Button>
              </div>
            )}

            {collection.status === 'REVIEWING' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-amber-500/[0.06] border border-amber-500/[0.12] mb-2">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p className="text-white font-bold text-lg m-0">{t('collection.uploadFinalsHeroTitle')}</p>
                  <p className="text-white/50 text-sm m-0 mt-1">{t('collection.uploadFinalsHeroDesc')}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant={editedPhotos.length > 0 ? 'secondary' : 'action'} onClick={() => setShowEditedFinalsZone(!showEditedFinalsZone)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {t('collection.uploadEditedFinalsButton')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={user?.plan === 'PRO' ? handleCopySelectedPhotos : undefined}
                    disabled={user?.plan !== 'PRO' || !collection.sourceFolder || selectedPhotoIds.size === 0}
                    title={user?.plan !== 'PRO' ? t('collection.copySelectedProOnly') : undefined}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    {t('collection.copySelectedButton')}
                    {user?.plan !== 'PRO' && (
                      <span className="ml-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full leading-none">PRO</span>
                    )}
                  </Button>
                  {editedPhotos.length > 0 && (
                    <Button variant="action" onClick={() => setShowPromotionalModal(true)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t('collection.markAsDelivered')}
                    </Button>
                  )}
                </div>
                {editedPhotos.length > 0 && (
                  <p className="text-white/50 text-xs m-0">{t('collection.editedPhotosCount', { count: editedPhotos.length })}</p>
                )}
                {editedPhotos.length === 0 && (
                  <p className="text-white/50 text-xs m-0">{t('collection.markAsDeliveredHint')}</p>
                )}
                {selectedPhotoIds.size > 0 && !collection.sourceFolder && (
                  <p className="text-amber-400/80 text-xs m-0">{t('collection.setSourceFolderHint')}</p>
                )}
              </div>
            )}

            {collection.status === 'DELIVERED' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-emerald-500/[0.08] border border-emerald-500/[0.15] mb-2">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <div>
                  <p className="text-white font-bold text-lg m-0">{t('collection.readyToDeliverTitle')}</p>
                  <p className="text-white/50 text-sm m-0 mt-1">{t('collection.readyToDeliverDesc')}</p>
                </div>
                <Button variant="action" onClick={handleCopyDeliveryLink}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('collection.copyDeliveryLink')}
                </Button>
              </div>
            )}

            {collection.status === 'DOWNLOADED' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-green-500/[0.10] border border-green-500/[0.20] mb-2">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-lg m-0 animate-text-glow">{t('collection.downloadedTitle')}</p>
                  <p className="text-white/50 text-sm m-0 mt-1">{t('collection.downloadedDesc')}</p>
                </div>
                <Button variant="secondary" onClick={handleCopyDeliveryLink}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('collection.copyDeliveryLink')}
                </Button>
              </div>
            )}

            {collection.status === 'ARCHIVED' && (
              <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-white/[0.03] border border-white/[0.06] mb-2">
                <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div>
                  <p className="text-white/60 font-bold text-lg m-0">{t('collection.status.ARCHIVED')}</p>
                  <p className="text-white/40 text-sm m-0 mt-1">{t('collection.nextStep.ARCHIVED')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="border-t border-white/[0.08] px-5 py-3 flex items-center gap-5">
            <button
              onClick={handleEditCollection}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('collection.editCollection')}
            </button>
            <button
              onClick={handleDeleteCollection}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('collection.delete')}
            </button>
            {(collection?.status === 'DELIVERED' || collection?.status === 'DOWNLOADED') && (
              user?.plan === 'PRO' ? (
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {t('collection.archive')}
                </button>
              ) : (
                <button
                  disabled
                  title={t('collection.archiveProOnly')}
                  className="flex items-center gap-1.5 text-xs text-white/30 bg-transparent border-none cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {t('collection.archive')}
                  <span className="ml-0.5 px-1 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-400 leading-none">PRO</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Inline Edit Form ── */}
      {showEditForm && (
        <div className="bg-white/[0.04] border border-white/10 rounded-[10px] px-6 py-5 mb-5">
          <h3 className="text-sm font-bold text-white/70 mb-4">{t('collection.editCollection')}</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-[0.06em] block mb-1">{t('collection.editName')}</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/70 placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-[0.06em] block mb-1">{t('collection.editClientName')}</label>
              <input
                type="text"
                value={editClientName}
                onChange={e => setEditClientName(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/70 placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-[0.06em] block mb-1">{t('collection.editClientEmail')}</label>
              <input
                type="email"
                value={editClientEmail}
                onChange={e => setEditClientEmail(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/70 placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-[0.06em] block mb-1">{t('collection.editSourceFolder')}</label>
              <input
                type="text"
                value={editSourceFolder}
                onChange={e => setEditSourceFolder(e.target.value)}
                placeholder={t('collection.sourceFolderPlaceholder')}
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/70 placeholder:text-white/20"
              />
              <p className="text-[11px] text-white/40 mt-1 mb-0">{t('collection.sourceFolderHint')}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
              {t('collection.saveChanges')}
            </Button>
            <Button variant="secondary" onClick={() => setShowEditForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {showPromotionalModal && (
        <PromotionalConsentModal
          collection={collection}
          photos={editedPhotos}
          onClose={() => setShowPromotionalModal(false)}
          onDelivered={(updatedCollection) => {
            setCollection(updatedCollection);
            setShowPromotionalModal(false);
            toast.success(t('collection.markedAsDelivered'));
          }}
        />
      )}

      {/* ── Upload Dropzone (only shown when showUploadZone is true and status is DRAFT) ── */}
      {showUploadZone && collection.status === 'DRAFT' && (
        <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl px-6 py-5 mb-3">
          <h2 className="mt-0 mb-4 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
            {photos.length === 0 ? t("collection.photos") : t("collection.uploadMore")}
          </h2>

          {showPhotoLimit && nearPhotoLimit && (
            <div className={`mb-3 px-3 py-2 rounded-md text-xs flex items-center justify-between gap-2 ${
              atPhotoLimit
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <span>{t('plans.photosUsed', { used: photoCount, limit: photoLimit })}{atPhotoLimit ? ' — ' + t('plans.limitReachedPhotos') : ''}</span>
              <Link to="/payments" className="font-semibold underline shrink-0 hover:no-underline">{t('plans.upgradeLink')}</Link>
            </div>
          )}

          {atPhotoLimit ? (
            <div className="border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-8 border-white/[0.12] bg-white/[0.02] opacity-60 cursor-not-allowed">
              <p className="m-0 text-sm font-medium text-white/50">{t('plans.limitReachedPhotos')}</p>
              <Link to="/payments" className="text-xs text-indigo-400 underline">{t('plans.upgradeLink')}</Link>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label={t("collection.uploadZoneLabel")}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all duration-300 select-none
                ${dragOver
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-white/[0.15] bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5"
                }`}
            >
              <svg className={`w-9 h-9 ${dragOver ? "text-indigo-400" : "text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="m-0 text-sm font-medium text-white/60">
                {t("collection.uploadZoneLabel")}
              </p>
              <p className="m-0 text-xs text-white/50">
                {t("collection.uploadZoneHint")}
              </p>
            </div>
          )}
          <button
            onClick={() => setShowUploadZone(false)}
            className="mt-3 text-xs text-white/50 hover:text-white/70 bg-transparent border-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>

          {/* Upload status indicators (always shown when active) */}
          {anyUploading && (
            <p className="mt-3 mb-0 text-xs text-blue-600 font-medium animate-pulse">
              {t("collection.uploading")}
            </p>
          )}
          {uploadErrors > 0 && !anyUploading && (
            <p className="mt-3 mb-0 text-xs text-red-500 font-medium">
              {uploadErrors}x {t("collection.uploadError")}
            </p>
          )}
          {validationErrors > 0 && !anyUploading && (
            <p className="mt-3 mb-0 text-xs text-amber-600 font-medium">
              {validationErrors}x {t("collection.uploadValidationError")}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Edited Finals Upload Zone (REVIEWING only) - Now collapsible ── */}
      {showEditedFinalsZone && collection.status === 'REVIEWING' && (
        <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl px-6 py-5 mb-3">
          <h2 className="mt-0 mb-4 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
            {t('collection.editedFinalsTitle')}
            {editedPhotos.length > 0 && (
              <span className="ml-2 text-xs font-normal text-white/50 normal-case tracking-normal">
                {t('collection.editedPhotosCount', { count: editedPhotos.length })}
              </span>
            )}
          </h2>

          {/* Green-themed drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t('collection.editedUploadZoneLabel')}
            onClick={() => editedFileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && editedFileInputRef.current?.click()}
            onDrop={handleEditedDrop}
            onDragOver={handleEditedDragOver}
            onDragLeave={handleEditedDragLeave}
            className={`border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none ${
              dragOverEdited
                ? 'border-green-500 bg-green-500/10'
                : 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
            }`}
          >
            <svg className="w-9 h-9 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="m-0 text-sm font-medium text-white/60">
              {t('collection.editedUploadZoneLabel')}
            </p>
            <p className="m-0 text-xs text-white/50">
              {t('collection.editedUploadZoneHint')}
            </p>
            {anyEditedUploading && (
              <p className="m-0 text-xs text-green-600 font-medium animate-pulse">
                {t("collection.uploading")}
              </p>
            )}
            {editedUploadErrors > 0 && !anyEditedUploading && (
              <p className="m-0 text-xs text-red-500 font-medium">
                {editedUploadErrors}x {t("collection.uploadError")}
              </p>
            )}
            {editedValidationErrors > 0 && !anyEditedUploading && (
              <p className="m-0 text-xs text-amber-600 font-medium">
                {editedValidationErrors}x {t("collection.uploadValidationError")}
              </p>
            )}
          </div>

          <input
            ref={editedFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleEditedFileChange}
          />

          {/* Edited photos grid */}
          {editedPhotos.length > 0 && (
            <div className={`mt-4 ${PHOTO_GRID_CLASSES}`}>
              {editedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-white/[0.06]">
                  <img
                    src={photoUrl(photo.storagePath)}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Cancel button to collapse zone */}
          <button
            onClick={() => setShowEditedFinalsZone(false)}
            className="mt-3 text-xs text-white/50 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {/* ── Photo Grid Accordion (hidden when DELIVERED/DOWNLOADED — edited photos shown instead) ── */}
      {photos.length > 0 && !['DELIVERED', 'DOWNLOADED'].includes(collection.status) && (
        <Accordion title={t("collection.photos")} defaultOpen={true}>
          {/* Filter tabs */}
          {selections.length > 0 && (
            <div className={`flex gap-2 mb-4 border-b border-white/[0.08] ${isReorderMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={() => setFilter('all')}
                disabled={isReorderMode}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'all'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {t('collection.filterAll')} ({photos.length})
              </button>
              <button
                onClick={() => setFilter('selected')}
                disabled={isReorderMode}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'selected'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {t('collection.filterSelected')} ({selectedPhotoIds.size})
              </button>
              <button
                onClick={() => setFilter('not-selected')}
                disabled={isReorderMode}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'not-selected'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {t('collection.filterNotSelected')} ({photos.length - selectedPhotoIds.size})
              </button>
            </div>
          )}

          {/* Reorder toolbar */}
          <div className="flex items-center gap-2 mb-4">
            {!isReorderMode ? (
              <button
                onClick={enterReorderMode}
                disabled={!isPro || filter !== 'all'}
                title={!isPro ? t('collection.reorderProOnly') : filter !== 'all' ? t('collection.reorderFilterWarning') : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isPro && filter === 'all'
                    ? 'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/[0.1] cursor-pointer'
                    : 'bg-white/[0.03] text-white/30 border-white/[0.06] cursor-not-allowed'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
                </svg>
                {t('collection.reorder')}
                {!isPro && (
                  <span className="ml-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">PRO</span>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={saveOrder}
                  disabled={isReorderSaving || !hasOrderChanged()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
                >
                  {isReorderSaving ? '...' : t('collection.saveOrder')}
                </button>
                <button
                  onClick={cancelReorder}
                  disabled={isReorderSaving}
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-transparent text-white/60 hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </>
            )}
          </div>

          <SortablePhotoGrid
            photos={isReorderMode ? photos : filteredPhotos}
            isReorderMode={isReorderMode}
            onDragEnd={handleDragEnd}
            renderPhoto={(photo) => {
              const photoIndex = photos.findIndex(p => p.id === photo.id);
              return (
                <div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-white/[0.06]">
                  {/* Thumbnail — click opens lightbox */}
                  <button
                    onClick={() => lightbox.open(photoIndex)}
                    className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in"
                    aria-label={photo.filename}
                  >
                    <img
                      src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                  {/* Cover badge */}
                  {collection.coverPhotoId === photo.id && (
                    <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight pointer-events-none">
                      ★
                    </div>
                  )}
                  {/* Selection badge */}
                  {selectedPhotoIds.has(photo.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {/* Filename overlay for selected photos (STANDARD users in REVIEWING) */}
                  {collection.status === 'REVIEWING' && user?.plan !== 'PRO' && selectedPhotoIds.has(photo.id) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-6 pb-2 px-2.5 pointer-events-none">
                      <span className="block text-[11px] font-mono text-white/90 truncate leading-tight">
                        {photo.filename}
                      </span>
                    </div>
                  )}
                  {/* Action overlay -- visible on hover (desktop) and focus-within (keyboard/touch) */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1 pointer-events-none">
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                      title={t("collection.deletePhoto")}
                      aria-label={t("collection.deletePhoto")}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/30 text-white/80 hover:text-red-400 flex items-center justify-center text-sm font-bold transition-colors pointer-events-auto"
                    >
                      ×
                    </button>
                    {/* Set cover button */}
                    {collection.coverPhotoId !== photo.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(photo.id); }}
                        title={t("collection.setCover")}
                        aria-label={t("collection.setCover")}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-indigo-500/30 text-white/80 hover:text-indigo-400 flex items-center justify-center text-sm transition-colors pointer-events-auto"
                      >
                        ★
                      </button>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </Accordion>
      )}

      {/* ── Edited Photos Grid (DELIVERED/DOWNLOADED) ── */}
      {editedPhotos.length > 0 && ['DELIVERED', 'DOWNLOADED'].includes(collection.status) && (
        <Accordion title={t("collection.editedPhotos")} defaultOpen={true}>
          <div className={PHOTO_GRID_CLASSES}>
            {editedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-white/[0.06]">
                <button
                  onClick={() => editedLightbox.open(index)}
                  className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in"
                  aria-label={photo.filename}
                >
                  <img
                    src={photoUrl(photo.storagePath)}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* ── Edited Photos Lightbox ── */}
      {editedLightbox.lightboxIndex !== null && editedPhotos[editedLightbox.lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => editedLightbox.close()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              editedLightbox.prev();
            }}
            aria-label={t("collection.lightboxPrev")}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={photoUrl(editedPhotos[editedLightbox.lightboxIndex].storagePath)}
            alt={editedPhotos[editedLightbox.lightboxIndex].filename}
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-[4px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              editedLightbox.next();
            }}
            aria-label={t("collection.lightboxNext")}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => editedLightbox.close()}
            aria-label={t("collection.lightboxClose")}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center font-bold text-xl transition-colors z-10 border border-white/30 cursor-pointer"
          >
            ×
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm select-none">
            {editedLightbox.lightboxIndex + 1} / {editedPhotos.length}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox.lightboxIndex !== null && photos[lightbox.lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => lightbox.close()}
        >
          {/* Prev arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              lightbox.prev();
            }}
            aria-label={t("collection.lightboxPrev")}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Image */}
          <img
            src={photoUrl(photos[lightbox.lightboxIndex].storagePath)}
            alt={photos[lightbox.lightboxIndex].filename}
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-[4px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              lightbox.next();
            }}
            aria-label={t("collection.lightboxNext")}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={() => lightbox.close()}
            aria-label={t("collection.lightboxClose")}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center font-bold text-xl transition-colors z-10 border border-white/30 cursor-pointer"
          >
            ×
          </button>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm select-none">
            {lightbox.lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionDetailsPage;
