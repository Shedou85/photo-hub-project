import { useTranslation } from 'react-i18next';
import Button from '../primitives/Button';

/**
 * REVIEWING workflow phase — Mark as delivered action
 *
 * @param {Object} props
 * @param {Object} props.collection - Collection object
 * @param {Function} props.onCopyShareLink - Handler for copying share link (view selections)
 * @param {Function} props.onMarkAsDelivered - Handler for marking collection as delivered
 * @param {number} props.editedPhotosCount - Number of edited photos uploaded
 */
function ReviewingPhase({ collection: _collection, onCopyShareLink, onMarkAsDelivered, editedPhotosCount }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Share section (always visible for reference) */}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
          {t('collection.sharePhase')}
        </h3>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={onCopyShareLink}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {t('collection.copyShareLink')}
          </Button>
        </div>
      </div>

      {/* Review section — primary action */}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
          {t('collection.reviewPhase')}
        </h3>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="primary"
            onClick={onMarkAsDelivered}
            disabled={editedPhotosCount === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('collection.markAsDelivered')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewingPhase;
