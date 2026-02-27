import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Custom dropdown with dark-themed menu (no native <select> white flash).
 *
 * @param {object}   props
 * @param {string}   props.value          - Current selected value
 * @param {function} props.onChange        - (value) => void
 * @param {{ value: string, label: string }[]} props.options - Options list
 * @param {'sm'|'md'}  [props.size='md']  - Trigger size
 * @param {boolean}  [props.disabled]     - Disabled state
 * @param {string}   [props.className]    - Extra classes on trigger
 * @param {string}   [props.menuAlign='right'] - Menu alignment ('left' | 'right')
 * @param {string}   [props.minWidth]     - Min-width on the menu, e.g. '130px'
 */
export default function Dropdown({
  value,
  onChange,
  options,
  size = 'md',
  disabled = false,
  className,
  menuAlign = 'right',
  minWidth,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const selected = options.find((o) => o.value === value);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 rounded-md gap-1',
    md: 'text-sm px-3 py-2 rounded-lg gap-1.5',
  };

  const itemSizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={clsx(
          'flex items-center border border-white/[0.12] bg-white/[0.06] text-white/70 font-medium cursor-pointer transition-colors duration-150',
          'hover:bg-white/[0.1] focus:ring-2 focus:ring-indigo-500/50 focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          className
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <svg
          className={clsx(
            'w-3 h-3 shrink-0 text-white/40 transition-transform duration-150',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={clsx(
            'absolute top-full mt-1 z-50 bg-surface-dark border border-white/[0.12] rounded-md shadow-xl overflow-hidden py-0.5',
            menuAlign === 'right' ? 'right-0' : 'left-0'
          )}
          style={minWidth ? { minWidth } : undefined}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                'block w-full text-left font-medium cursor-pointer border-none bg-transparent transition-colors duration-150',
                'hover:bg-white/[0.08] hover:text-indigo-400',
                opt.value === value ? 'text-indigo-400' : 'text-white/70',
                itemSizeClasses[size]
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
