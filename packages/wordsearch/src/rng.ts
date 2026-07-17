export function mulberry32(a: number): () => number {
  return function(): number {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
}

export function parseSeed(str: string): number {
  const clean = str.trim();
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10) >>> 0;
  }
  return hashSeed(clean);
}
