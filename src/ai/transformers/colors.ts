import { CAT_OF, type Category } from './vocab'

/* ── Category-driven coloring (same-category tokens share a swatch) */
export type Color = { bg: string; bd: string; tx: string }

export const CAT_COLORS: Record<Category, Color> = {
  DET:      { bg: '#FBEAF0', bd: '#ED93B1', tx: '#4B1528' },
  NOUN_A:   { bg: '#E1F5EE', bd: '#5DCAA5', tx: '#085041' },
  NOUN_O:   { bg: '#EEEDFE', bd: '#AFA9EC', tx: '#3C3489' },
  NOUN_P:   { bg: '#E6F1FB', bd: '#85B7EB', tx: '#042C53' },
  VERB:     { bg: '#FAECE7', bd: '#F0997B', tx: '#4A1B0C' },
  ADJ_SIZE: { bg: '#FAEEDA', bd: '#EF9F27', tx: '#412402' },
  ADJ_COL:  { bg: '#FFF6CC', bd: '#E5C100', tx: '#3A3000' },
  PREP:     { bg: '#E5F0FF', bd: '#6FA4E0', tx: '#0B2A4E' },
  CONJ:     { bg: '#EEEEEE', bd: '#999999', tx: '#333333' },
  PRON:     { bg: '#E0F0F8', bd: '#5BA8C9', tx: '#0B3A4A' },
  ADV:      { bg: '#FDE8DC', bd: '#E0825C', tx: '#5C1F08' },
  SPECIAL:  { bg: '#F2F2F2', bd: '#BBBBBB', tx: '#666666' },
}

export function tokColor(word: string): Color {
  return CAT_COLORS[CAT_OF[word] ?? 'SPECIAL']
}

export function heat(value: number): string {
  const clamped = Math.max(0, Math.min(1, value))
  const red = Math.round(30 + clamped * 225)
  const green = Math.round(160 - clamped * 130)
  const blue = Math.round(200 - clamped * 180)
  return `rgb(${red},${green},${blue})`
}
