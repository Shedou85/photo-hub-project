import { useState } from "react";

function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-lg shadow-xl mb-5 transition-all duration-700">
      {/* Accordion Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
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

      {/* Accordion Content */}
      <div
        className={`transition-all ease-in-out duration-700 overflow-hidden ${
          isOpen ? "max-h-[1000px]" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-5 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Accordion;
