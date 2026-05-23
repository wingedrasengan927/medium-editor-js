export const OFFSCREEN_POSITION = -1000;

export function computeInlineToolbarPosition(
  boundingRectCoords,
  toolbarElement,
  topOffset = 0
) {
  if (!toolbarElement) {
    console.error("Invalid toolbar element");
    return { x: OFFSCREEN_POSITION, y: OFFSCREEN_POSITION };
  }

  const { x, y } = boundingRectCoords;
  const { width, height } = toolbarElement.getBoundingClientRect();

  return {
    x: x - width / 2,
    y: y - height - topOffset,
  };
}

export function getBoundingRectCoords(range) {
  if (!range || typeof range.getBoundingClientRect !== "function") {
    return null;
  }

  try {
    const rect = range.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY,
    };
  } catch (e) {
    return null;
  }
}
