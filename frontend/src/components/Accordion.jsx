import { useState } from "react";

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] mb-5 transition-all duration-700">
      {/* Accordion Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <h2 className="mt-0 mb-0 text-[14px] font-bold text-gray-700 uppercase tracking-[0.05em]">
          {title}
        </h2>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-700 ${
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
          isOpen ? "max-h-[500px]" : "max-h-0"
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
