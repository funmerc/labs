export const DIM = 8

/* ── Deterministic PRNG for per-word perturbations ──────────── */
export function mkRng(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let temp = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296
  }
}

export function posEnc(pos: number, dim = DIM): number[] {
  return Array.from({ length: dim }, (_, index) => {
    const angle = pos / Math.pow(10000, (2 * Math.floor(index / 2)) / dim)
    if (index % 2 === 0) {
      return Math.sin(angle)
    }
    return Math.cos(angle)
  }).map((value) => +value.toFixed(3))
}

export function addVecs(vecA: number[], vecB: number[]): number[] {
  return vecA.map((value, index) => +(value + vecB[index]).toFixed(3))
}

export function dotprod(vecA: number[], vecB: number[]): number {
  return vecA.reduce((sum, value, index) => sum + value * vecB[index], 0)
}

export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr)
  const exps = arr.map((value) => Math.exp(value - max))
  const total = exps.reduce((sum, value) => sum + value, 0)
  return exps.map((value) => +(value / total).toFixed(3))
}

export function cosSim(vecA: number[], vecB: number[]): number {
  const dot = dotprod(vecA, vecB)
  const magA = Math.sqrt(dotprod(vecA, vecA))
  const magB = Math.sqrt(dotprod(vecB, vecB))
  if (magA * magB === 0) {
    return 0
  }
  return +(dot / (magA * magB)).toFixed(3)
}
