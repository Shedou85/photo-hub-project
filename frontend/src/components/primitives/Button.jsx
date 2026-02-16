import clsx from 'clsx';

/**
 * Button component with multiple variants and sizes
 *
 * @param {object} props - Component props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} [props.variant='primary'] - Visual style variant
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
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-opacity duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans rounded-sm';

  const variantClasses = {
    primary: 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white hover:opacity-90 border-none',
    secondary: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 border-none'
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
