import { useState, memo } from 'react';
import clsx from 'clsx';

const ERROR_ICON = (
  <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
);

/**
 * Optimized image component with skeleton/LQIP placeholder, fade-in, and error fallback.
 *
 * Two modes:
 * - **Standalone** (default): manages its own load state internally.
 * - **Grid**: pass `isLoaded`, `onLoad`, `onError` from `useImageLoadingSet()`.
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  lqip,
  isLoaded: externalIsLoaded,
  onLoad: externalOnLoad,
  onError: externalOnError,
  priority = false,
  className,
  containerClassName,
  ...imgProps
}) {
  // Standalone mode state
  const [internalLoaded, setInternalLoaded] = useState(false);
  const [internalErrored, setInternalErrored] = useState(false);

  const isGrid = externalIsLoaded !== undefined;
  const loaded = isGrid ? externalIsLoaded : internalLoaded;
  const errored = isGrid ? false : internalErrored;

  const handleLoad = () => {
    if (isGrid) {
      externalOnLoad?.();
    } else {
      setInternalLoaded(true);
    }
  };

  const handleError = () => {
    if (isGrid) {
      externalOnError?.();
    } else {
      setInternalErrored(true);
      setInternalLoaded(true); // stop showing skeleton
    }
  };

  return (
    <div className={clsx('relative overflow-hidden', containerClassName)}>
      {/* Skeleton or LQIP placeholder — hidden once loaded */}
      {!loaded && !errored && (
        lqip ? (
          <div
            className="absolute inset-0 bg-cover bg-center blur-[8px] scale-110"
            style={{ backgroundImage: `url(${lqip})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-white/[0.06] animate-pulse" />
        )
      )}

      {/* Error fallback */}
      {errored ? (
        <div className="absolute inset-0 bg-white/[0.04] flex items-center justify-center">
          {ERROR_ICON}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={clsx(
            'transition-all duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          {...imgProps}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
