import { useState, useId, useRef, useCallback, useLayoutEffect } from "react";

function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const id = useId();

  // Set initial styles imperatively on mount (avoids React style prop overwriting during animation)
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (defaultOpen) {
      el.style.maxHeight = "none";
      el.style.overflow = "visible";
    } else {
      el.style.maxHeight = "0px";
      el.style.overflow = "hidden";
    }
  }, [defaultOpen]);

  const toggle = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isOpen) {
      // Closing: snap to current scrollHeight, force reflow, then animate to 0
      el.style.maxHeight = el.scrollHeight + "px";
      el.style.overflow = "hidden";
      void el.offsetHeight;
      el.style.maxHeight = "0px";
    } else {
      // Opening: animate from 0 to scrollHeight
      el.style.overflow = "hidden";
      el.style.maxHeight = el.scrollHeight + "px";
    }
    setIsOpen(prev => !prev);
  }, [isOpen]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.propertyName !== "max-height" || e.target !== contentRef.current) return;

    const el = contentRef.current;
    if (el.style.maxHeight !== "0px") {
      // Opening finished — release the height cap
      el.style.maxHeight = "none";
      el.style.overflow = "visible";
    }
  }, []);

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl mb-5 transition-all duration-700">
      {/* Accordion Header */}
      <div
        id={id + '-header'}
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 outline-none"
        onClick={toggle}
        role="button"
        aria-expanded={isOpen}
        aria-controls={id + '-panel'}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <h2 className="mt-0 mb-0 text-sm font-bold text-white/70 uppercase tracking-[0.05em]">
          {title}
        </h2>
        <svg
          className={`w-5 h-5 text-white/40 transition-transform duration-700 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Accordion Content — styles managed imperatively via ref, no React style prop */}
      <div
        ref={contentRef}
        id={id + '-panel'}
        role="region"
        aria-labelledby={id + '-header'}
        className="transition-[max-height] ease-in-out duration-700"
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="px-6 pb-5 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Accordion;
