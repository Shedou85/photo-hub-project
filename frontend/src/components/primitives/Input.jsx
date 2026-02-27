import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Input primitive following the project dark theme design tokens
 *
 * @param {object} props - Component props
 * @param {'sm' | 'md'} [props.size='md'] - Input size
 * @param {boolean} [props.fullWidth=true] - Full width input
 * @param {boolean} [props.error=false] - Error state styling
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <Input placeholder="Search..." value={search} onChange={handleSearch} />
 *
 * @example
 * <Input size="sm" error className="pl-10" />
 */
const Input = forwardRef(function Input(
  { size = 'md', fullWidth = true, error = false, className, ...props },
  ref
) {
  const baseClasses =
    'text-white bg-white/[0.06] border placeholder:text-white/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs py-1 px-2 rounded-md',
    md: 'text-sm py-2.5 px-4 rounded-lg',
  };

  const stateClasses = error
    ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
    : 'border-white/[0.12] focus:border-indigo-500/70 focus:bg-white/[0.08]';

  return (
    <input
      ref={ref}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        stateClasses,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
});

export default Input;
