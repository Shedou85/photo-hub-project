import { useTranslation } from 'react-i18next';
import Button from '../primitives/Button';

/**
 * SELECTING workflow phase — Copy share link for client selections
 *
 * @param {Object} props
 * @param {Object} props.collection - Collection object
 * @param {Function} props.onCopyShareLink - Handler for copying share link
 */
function SelectingPhase({ collection: _collection, onCopyShareLink }) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
        {t('collection.sharePhase')}
      </h3>
      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={onCopyShareLink}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {t('collection.copyShareLink')}
        </Button>
      </div>
    </div>
  );
}

export default SelectingPhase;
