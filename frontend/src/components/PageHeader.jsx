function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200 flex-wrap gap-3">
      <div className="flex items-center gap-4">
        {/* Icon circle — gradient bg, subtle outer ring for depth */}
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] ring-4 ring-blue-100 shadow-sm flex items-center justify-center text-[22px] font-bold text-white shrink-0 select-none leading-none">
          {icon}
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-2xl font-bold text-gray-900 leading-tight tracking-tight">
            {title}
          </h1>
          <p className="m-0 text-[13px] font-medium text-gray-500 leading-snug">
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
