// Isolate the central mark and its tilted orbit from the surrounding animals.
const logoBoundary = [
  [324, 345],
  [339, 299],
  [390, 219],
  [535, 178],
  [588, 195],
  [590, 220],
  [550, 307],
  [470, 347],
  [356, 370],
];
export function insideLogo(x, y) {
  let inside = false;
  for (let i = 0, j = logoBoundary.length - 1; i < logoBoundary.length; j = i++) {
    const [ax, ay] = logoBoundary[i],
      [bx, by] = logoBoundary[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
