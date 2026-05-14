import { DIM } from './math'
import { type Category } from './vocab'
import { CAT_CENTER } from './embeddings'

/* ── FFN: nudges the hidden state toward the "next category"
 * A real FFN is a 2-layer MLP whose learned weights transform the attention
 * output into a prediction-friendly direction. We simulate this by blending
 * the hidden state with the average center of categories that typically
 * follow the input's last token category.
 */
export const NEXT_CAT: Partial<Record<Category, Category[]>> = {
  DET:      ['NOUN_A', 'NOUN_O', 'NOUN_P', 'ADJ_SIZE', 'ADJ_COL'],
  NOUN_A:   ['VERB', 'CONJ', 'PREP'],
  NOUN_O:   ['VERB', 'CONJ', 'PREP'],
  NOUN_P:   ['VERB', 'CONJ', 'PREP'],
  VERB:     ['DET', 'PREP', 'ADV', 'PRON'],
  ADJ_SIZE: ['NOUN_A', 'NOUN_O', 'NOUN_P'],
  ADJ_COL:  ['NOUN_A', 'NOUN_O', 'NOUN_P'],
  PREP:     ['DET', 'PRON'],
  CONJ:     ['DET', 'PRON', 'NOUN_P'],
  PRON:     ['VERB'],
  ADV:      ['VERB'],
}

export type FFNResult = { out: number[]; target: number[]; nextCats: Category[] }

export function ffn(hidden: number[], lastCat: Category): FFNResult {
  const nextCats = NEXT_CAT[lastCat] ?? ['DET']
  const sum = Array(DIM).fill(0) as number[]
  for (const category of nextCats) {
    const center = CAT_CENTER[category]
    for (let dim = 0; dim < DIM; dim++) {
      sum[dim] += center[dim]
    }
  }
  const target = sum.map((value) => +(value / nextCats.length).toFixed(3))
  const out = hidden.map((value, dim) => +(0.3 * value + 0.7 * target[dim]).toFixed(3))
  return { out, target, nextCats }
}
