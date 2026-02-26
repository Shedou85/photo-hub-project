import clsx from 'clsx';

/**
 * Button component with multiple variants and sizes
 *
 * @param {object} props - Component props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'action'} [props.variant='primary'] - Visual style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.fullWidth=false] - Full width button
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.type='button'] - Button type attribute
 *
 * @example
 * // Primary gradient button
 * <Button variant="primary" size="md">Save Changes</Button>
 *
 * @example
 * // Secondary outline button
 * <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
 */
function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  fullWidth = false,
  className,
  type = 'button',
  ...props
}) {
  const baseClasses = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold transition-opacity duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans rounded-lg';

  const variantClasses = {
    primary: 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white hover:opacity-90 border-none shadow-[0_4px_16px_rgba(99,102,241,0.35)]',
    secondary: 'bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1]',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    ghost: 'bg-transparent text-white/60 hover:bg-white/[0.06] border-none',
    action: 'bg-[linear-gradient(135deg,#10b981,#059669)] text-white hover:opacity-90 hover:scale-[1.02] border-none shadow-[0_4px_14px_rgba(16,185,129,0.4)] before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] before:translate-x-[-100%] before:animate-shimmer motion-reduce:before:animate-none'
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2.5 px-5',
    lg: 'text-base py-3.5 px-7'
  };

  return (
    <button
      type={type}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
