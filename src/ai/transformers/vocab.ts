/* ── Vocabulary organized by semantic category ──────────────── */
export type Category =
  | 'DET' | 'NOUN_A' | 'NOUN_O' | 'NOUN_P' | 'VERB'
  | 'ADJ_SIZE' | 'ADJ_COL' | 'PREP' | 'CONJ' | 'PRON' | 'ADV' | 'SPECIAL'

export const VOCAB_BY_CAT: Record<Category, string[]> = {
  DET:      ['the', 'a', 'an', 'this'],
  NOUN_A:   ['cat', 'dog', 'bird', 'mouse', 'fish', 'horse', 'rabbit', 'fox'],
  NOUN_O:   ['mat', 'ball', 'book', 'tree', 'house', 'car', 'chair', 'box'],
  NOUN_P:   ['man', 'woman', 'child', 'boy', 'girl', 'friend'],
  VERB:     ['sat', 'ran', 'jumped', 'slept', 'walked', 'ate', 'saw', 'found', 'played', 'chased'],
  ADJ_SIZE: ['big', 'small', 'tiny', 'huge', 'large', 'little'],
  ADJ_COL:  ['red', 'blue', 'green', 'yellow', 'black', 'white'],
  PREP:     ['on', 'in', 'under', 'over', 'by', 'near'],
  CONJ:     ['and', 'or', 'but', 'then'],
  PRON:     ['he', 'she', 'it', 'they', 'we'],
  ADV:      ['quickly', 'slowly', 'softly', 'loudly'],
  SPECIAL:  ['<unk>'],
}

export const CAT_NAME: Record<Category, string> = {
  DET: 'determiner', NOUN_A: 'animal', NOUN_O: 'object', NOUN_P: 'person',
  VERB: 'verb', ADJ_SIZE: 'size adj.', ADJ_COL: 'color adj.', PREP: 'preposition',
  CONJ: 'conjunction', PRON: 'pronoun', ADV: 'adverb', SPECIAL: 'unknown',
}

export const VOCAB: string[] = []
export const CAT_OF: Record<string, Category> = {}
for (const cat of Object.keys(VOCAB_BY_CAT) as Category[]) {
  for (const word of VOCAB_BY_CAT[cat]) {
    VOCAB.push(word)
    CAT_OF[word] = cat
  }
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (VOCAB.includes(word)) {
        return word
      }
      return '<unk>'
    })
}
