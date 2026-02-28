function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between pb-7 mb-7 relative divider-glow divider-glow-full flex-wrap gap-4">
      <div className="flex items-center gap-5">
        {/* Icon circle — gradient bg, subtle outer ring for depth */}
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/10 flex items-center justify-center text-[22px] font-bold text-white shrink-0 select-none leading-none">
          {icon}
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold text-white leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          <p className="m-0 text-sm font-normal text-white/40 leading-snug tracking-wide">
            {subtitle}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
