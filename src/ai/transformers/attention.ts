import { DIM, softmax } from './math'
import { CAT_OF } from './vocab'

/* ── Hand-crafted attention heads
 * Each head implements an interpretable rule. Real transformer heads learn
 * patterns like these during training; here we specify them directly so the
 * visualization shows recognizable behaviors.
 */
export type HeadKind = 'prev' | 'first' | 'same' | 'self'
export type HeadSpec = { kind: HeadKind; label: string; about: string }
export type HeadResult = { weights: number[]; out: number[] }

export const HEADS: HeadSpec[] = [
  { kind: 'prev',  label: 'Previous',  about: 'Each word looks back at the one just before it. It\'s like reading a sentence with your finger on the previous word, useful for tracking what was just said. The first word has nothing before it, so it looks at itself.' },
  { kind: 'first', label: 'First',     about: 'Every word looks at the very first word of the input. Real models often develop a head like this, called an "attention sink." It acts like a default place to look when nothing more interesting catches the word\'s eye.' },
  { kind: 'same',  label: 'Same kind', about: 'Words look mostly at others of the same kind. Verbs find verbs, nouns find nouns. If a word is the only one of its kind in your sentence, it falls back to looking at itself.' },
  { kind: 'self',  label: 'Self',      about: 'Each word mostly looks at itself, keeping its own information intact as it passes through this layer of the model.' },
]

function headScores(tokens: string[], kind: HeadKind): number[][] {
  const count = tokens.length
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => {
      switch (kind) {
        case 'prev':
          if (row === 0) {
            if (col === 0) {
              return 3
            }
            return 0
          }
          if (col === row - 1) {
            return 3
          }
          return 0
        case 'first':
          if (col === 0) {
            return 3
          }
          return 0
        case 'same':
          if (CAT_OF[tokens[row]] === CAT_OF[tokens[col]]) {
            return 2
          }
          return 0
        case 'self':
          if (row === col) {
            return 3
          }
          return 0
      }
    }),
  )
}

export function runHead(tokens: string[], inputs: number[][], kind: HeadKind): HeadResult[] {
  const scores = headScores(tokens, kind)
  return scores.map((row) => {
    const weights = softmax(row)
    const out = Array(DIM).fill(0) as number[]
    inputs.forEach((vec, tokenIndex) => {
      vec.forEach((value, dim) => {
        out[dim] += weights[tokenIndex] * value
      })
    })
    return { weights, out: out.map((value) => +value.toFixed(3)) }
  })
}
