export type Demo = {
  slug: string
  title: string
  blurb: string
  tags: string[]
}

export const DEMOS: Demo[] = [
  {
    slug: 'ai/transformers',
    title: 'Simple Transformer',
    blurb:
      'A tiny deterministic toy transformer you can poke at. Step through tokenization, embeddings, positional encoding, attention, and output to see how each piece works.',
    tags: ['ML', 'visualization'],
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI',
}

export function demoCategory(slug: string): { key: string; label: string } {
  const key = slug.includes('/') ? slug.split('/')[0] : 'other'
  return { key, label: CATEGORY_LABELS[key] ?? key.toUpperCase() }
}
