/**
 * src/utils/MathUtils.js
 * Pure math utility library — no dependencies, tree-shakable.
 */

// ── Basic ─────────────────────────────────────────────────────────────────────

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpClamped(a, b, t) {
  return lerp(a, b, clamp(t, 0, 1));
}

export function inverseLerp(a, b, value) {
  if (Math.abs(b - a) < Number.EPSILON) return 0;
  return (value - a) / (b - a);
}

export function remap(value, inMin, inMax, outMin, outMax) {
  return lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
}

export function roundTo(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function nearlyEqual(a, b, epsilon = Number.EPSILON * 100) {
  return Math.abs(a - b) < epsilon;
}

// ── Random ────────────────────────────────────────────────────────────────────

export function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomRange(min, max) {
  return randomFloat(min, max);
}

export function randomSign() {
  return Math.random() < 0.5 ? 1 : -1;
}

export function randomChoice(array) {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j    = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i]   = array[j];
    array[j]   = temp;
  }
  return array;
}

export function weightedRandom(items) {
  const total  = items.reduce((sum, item) => sum + item.weight, 0);
  let   random = Math.random() * total;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// ── Animation ─────────────────────────────────────────────────────────────────

export function smoothStep(t) {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

export function smootherStep(t) {
  const c = clamp(t, 0, 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export function easeIn(t)    { return t * t; }
export function easeOut(t)   { return 1 - (1 - t) * (1 - t); }
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function damp(current, target, smoothing, delta) {
  return lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

// ── Geometry ──────────────────────────────────────────────────────────────────

export function distance2D(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance3D(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeAngle(angle) {
  let a = angle % (Math.PI * 2);
  if (a >  Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function degreesToRadians(degrees) { return degrees * (Math.PI / 180); }
export function radiansToDegrees(radians) { return radians * (180 / Math.PI); }

// ── Curves ────────────────────────────────────────────────────────────────────

export function quadraticBezier(t, p0, p1, p2) {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

export function cubicBezier(t, p0, p1, p2, p3) {
  const mt = 1 - t, mt2 = mt * mt, t2 = t * t;
  return mt2 * mt * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t2 * t * p3;
}

export function quadraticBezier3D(t, p0, p1, p2) {
  return {
    x: quadraticBezier(t, p0.x, p1.x, p2.x),
    y: quadraticBezier(t, p0.y, p1.y, p2.y),
    z: quadraticBezier(t, p0.z, p1.z, p2.z),
  };
}

export function cubicBezier3D(t, p0, p1, p2, p3) {
  return {
    x: cubicBezier(t, p0.x, p1.x, p2.x, p3.x),
    y: cubicBezier(t, p0.y, p1.y, p2.y, p3.y),
    z: cubicBezier(t, p0.z, p1.z, p2.z, p3.z),
  };
}

export function sampleCurve(curveFn, samples = 60) {
  const points = [];
  for (let i = 0; i <= samples; i++) points.push(curveFn(i / samples));
  return points;
}
