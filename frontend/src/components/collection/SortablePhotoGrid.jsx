import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PHOTO_GRID_CLASSES } from '../../constants/styles';
import { photoUrl } from '../../utils/photoUrl';
import SortablePhotoItem from './SortablePhotoItem';

export default function SortablePhotoGrid({
  photos,
  isReorderMode,
  onDragEnd,
  renderPhoto,
}) {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  if (!isReorderMode) {
    return (
      <div className={PHOTO_GRID_CLASSES}>
        {photos.map((photo, index) => renderPhoto(photo, index))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={photos.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <div className={PHOTO_GRID_CLASSES}>
          {photos.map((photo) => (
            <SortablePhotoItem key={photo.id} id={photo.id}>
              <img
                src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                alt={photo.filename}
                className="w-full h-full object-cover pointer-events-none select-none"
                loading="lazy"
                draggable={false}
              />
            </SortablePhotoItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
