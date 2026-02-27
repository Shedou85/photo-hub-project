import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Select dropdown primitive with dark theme support
 *
 * Uses `colorScheme: 'dark'` to force browser-native option elements
 * to render with a dark background (fixes white options on Windows).
 *
 * @param {object} props - Component props
 * @param {'sm' | 'md'} [props.size='md'] - Select size
 * @param {boolean} [props.fullWidth=false] - Full width select
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Option elements
 *
 * @example
 * <Select size="md" value={sort} onChange={handleSort}>
 *   <option value="newest">Newest first</option>
 *   <option value="oldest">Oldest first</option>
 * </Select>
 */
const Select = forwardRef(function Select(
  { size = 'md', fullWidth = false, className, children, style, ...props },
  ref
) {
  const baseClasses =
    'text-white bg-white/[0.06] border border-white/[0.12] cursor-pointer focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs py-1 px-2 rounded-md',
    md: 'text-sm py-2.5 px-4 rounded-lg',
  };

  return (
    <select
      ref={ref}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      style={{ colorScheme: 'dark', ...style }}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
