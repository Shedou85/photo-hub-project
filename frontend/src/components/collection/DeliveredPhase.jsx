import { useTranslation } from 'react-i18next';
import Button from '../primitives/Button';

/**
 * DELIVERED/DOWNLOADED workflow phase — Copy delivery link
 *
 * @param {Object} props
 * @param {Object} props.collection - Collection object with deliveryToken
 * @param {Function} props.onCopyDeliveryLink - Handler for copying delivery link
 * @param {Function} props.onCopyShareLink - Handler for copying share link
 */
function DeliveredPhase({ collection, onCopyDeliveryLink, onCopyShareLink }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Share section (reference) */}
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

      {/* Deliver section — primary action */}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
          {t('collection.deliverPhase')}
        </h3>
        <div className="flex gap-3 flex-wrap">
          {collection.deliveryToken && (
            <Button variant="primary" onClick={onCopyDeliveryLink}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('collection.copyDeliveryLink')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveredPhase;
