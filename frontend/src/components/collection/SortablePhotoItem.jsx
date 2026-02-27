import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortablePhotoItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square rounded-sm overflow-hidden bg-white/[0.06] cursor-grab active:cursor-grabbing ${
        isDragging ? 'z-50 opacity-80 shadow-2xl scale-105' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {children}
      {/* Drag handle indicator */}
      <div className="absolute top-1.5 left-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-white/60">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>
    </div>
  );
}
