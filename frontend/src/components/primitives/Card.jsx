import clsx from 'clsx';

/**
 * Card component - white container with border and rounded corners
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.noPadding=false] - Remove default padding
 *
 * @example
 * // Default card with padding
 * <Card>
 *   <h2>Collection Name</h2>
 *   <p>Collection details go here</p>
 * </Card>
 *
 * @example
 * // Card without padding (for custom layouts)
 * <Card noPadding>
 *   <div className="custom-layout">Content</div>
 * </Card>
 */
function Card({ children, className, noPadding = false }) {
  const baseClasses = 'bg-white/[0.04] border border-white/10 rounded-lg shadow-xl';
  const paddingClass = noPadding ? '' : 'px-6 py-5';

  return (
    <div className={clsx(baseClasses, paddingClass, className)}>
      {children}
    </div>
  );
}

export default Card;
