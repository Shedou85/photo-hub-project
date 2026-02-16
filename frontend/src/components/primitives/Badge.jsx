import clsx from 'clsx';

/**
 * Badge component - status-colored label for collection lifecycle
 *
 * @param {object} props - Component props
 * @param {'DRAFT' | 'SELECTING' | 'REVIEWING' | 'DELIVERED' | 'DOWNLOADED'} props.status - Collection status
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showDot=false] - Show colored dot prefix
 *
 * @example
 * // SELECTING status badge
 * <Badge status="SELECTING">Selecting</Badge>
 *
 * @example
 * // DELIVERED status badge with colored dot
 * <Badge status="DELIVERED" showDot>Delivered</Badge>
 */
function Badge({ status, children, className, showDot = false }) {
  const baseClasses = 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full';

  const statusClasses = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SELECTING: 'bg-blue-100 text-blue-700',
    REVIEWING: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-purple-100 text-purple-700',
    DOWNLOADED: 'bg-purple-200 text-purple-800'
  };

  const dotColors = {
    DRAFT: 'bg-gray-600',
    SELECTING: 'bg-blue-700',
    REVIEWING: 'bg-green-700',
    DELIVERED: 'bg-purple-700',
    DOWNLOADED: 'bg-purple-800'
  };

  return (
    <span className={clsx(baseClasses, statusClasses[status] || statusClasses.DRAFT, className)}>
      {showDot && (
        <span className={clsx('w-2 h-2 rounded-full', dotColors[status] || dotColors.DRAFT)} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

export default Badge;
