import clsx from 'clsx';

/**
 * Badge component - status-colored label for collection lifecycle
 *
 * @param {object} props - Component props
 * @param {'DRAFT' | 'SELECTING' | 'REVIEWING' | 'DELIVERED' | 'DOWNLOADED' | 'ARCHIVED'} props.status - Collection status
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
    DRAFT: 'bg-white/[0.08] text-white/50',
    SELECTING: 'bg-blue-400/15 text-blue-400',
    REVIEWING: 'bg-amber-400/15 text-amber-400',
    DELIVERED: 'bg-emerald-400/15 text-emerald-400',
    DOWNLOADED: 'bg-green-400/20 text-green-400',
    ARCHIVED: 'bg-white/[0.06] text-white/30'
  };

  const dotColors = {
    DRAFT: 'bg-white/50',
    SELECTING: 'bg-blue-400',
    REVIEWING: 'bg-amber-400',
    DELIVERED: 'bg-emerald-400',
    DOWNLOADED: 'bg-green-400',
    ARCHIVED: 'bg-white/30'
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
