/**
 * Animated selection border overlay.
 * Renders an indigo border with a green trace line
 * that travels clockwise around the frame.
 *
 * Place inside a `position: relative` container.
 */
function SelectionBorder() {
  return (
    <>
      <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none" />
      <div className="selection-trace-top" />
      <div className="selection-trace-right" />
      <div className="selection-trace-bottom" />
      <div className="selection-trace-left" />
    </>
  );
}

export default SelectionBorder;
