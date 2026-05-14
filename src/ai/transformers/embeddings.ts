import { mkRng } from './math'
import { CAT_OF, VOCAB, type Category } from './vocab'

/* ── Category embedding centers (8D)
 * Same-category words share a base direction, so cat/dog have high cosine
 * similarity. Per-word perturbation (small) keeps them individually distinct.
 */
export const CAT_CENTER: Record<Category, number[]> = {
  DET:      [0.9,  0.1,  0.0,  0.1,  0.0,  0.0,  0.0,  0.0],
  NOUN_A:   [0.1,  0.9,  0.2,  0.0,  0.0,  0.0,  0.0,  0.0],
  NOUN_O:   [0.0,  0.2,  0.9,  0.0,  0.0,  0.0,  0.0,  0.0],
  NOUN_P:   [0.1,  0.7,  0.3,  0.2,  0.0,  0.0,  0.0,  0.0],
  VERB:     [0.0,  0.0,  0.0,  0.0,  0.9,  0.2,  0.0,  0.0],
  ADJ_SIZE: [0.0,  0.0,  0.0,  0.0,  0.1,  0.1,  0.9,  0.1],
  ADJ_COL:  [0.0,  0.0,  0.0,  0.0,  0.1,  0.1,  0.1,  0.9],
  PREP:     [0.2,  0.0,  0.1,  0.9,  0.0,  0.0,  0.0,  0.0],
  CONJ:     [0.5,  0.0,  0.0,  0.5,  0.1,  0.0,  0.0,  0.0],
  PRON:     [0.2,  0.5,  0.2,  0.1,  0.0,  0.0,  0.0,  0.0],
  ADV:      [0.0,  0.0,  0.0,  0.0,  0.4,  0.5,  0.1,  0.0],
  SPECIAL:  [0.1,  0.1,  0.1,  0.1,  0.1,  0.1,  0.1,  0.1],
}

/* In real models, individual dimensions don't carry clean meanings; semantics
 * are spread across all of them. Each dim here is hand-assigned a rough
 * category role so the bars are readable. This mapping mirrors CAT_CENTER. */
export const DIM_LABELS = ['determiner', 'animate', 'object', 'preposition', 'verb', 'adverb', 'size', 'color']

export function getEmbed(word: string): number[] {
  const cat = CAT_OF[word] ?? 'SPECIAL'
  const center = CAT_CENTER[cat]
  const rng = mkRng(VOCAB.indexOf(word) + 1)
  return center.map((value) => +(value + (rng() - 0.5) * 0.15).toFixed(3))
}
