const BORDER_COLORS = {
  SELECTED: 'border-indigo-500',
  FAVORITE: 'border-amber-500',
  REJECTED: 'border-red-500',
};

const GLOW_CLASSES = {
  SELECTED: '',
  FAVORITE: 'selection-glow-amber',
  REJECTED: 'selection-glow-red',
};

/**
 * Animated selection border overlay.
 * Renders a colored border with a green trace line
 * that travels clockwise around the frame.
 *
 * @param {{ label?: 'SELECTED' | 'FAVORITE' | 'REJECTED' }} props
 * Place inside a `position: relative` container.
 */
function SelectionBorder({ label = 'SELECTED' }) {
  const borderColor = BORDER_COLORS[label] || BORDER_COLORS.SELECTED;

  return (
    <>
      <div className={`absolute inset-0 border-2 ${borderColor} rounded-lg pointer-events-none`} />
      <div className="selection-trace-top" />
      <div className="selection-trace-right" />
      <div className="selection-trace-bottom" />
      <div className="selection-trace-left" />
    </>
  );
}

export { GLOW_CLASSES };
export default SelectionBorder;
