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
  {
    slug: 'ai/tokenizer',
    title: 'BPE Tokenizer',
    blurb:
      'Train a byte-pair encoder right in your browser. Watch merges form on a tiny corpus, then see how the learned vocab splits your text and why some languages cost more tokens than others.',
    tags: ['ML', 'visualization'],
  },
  {
    slug: 'ai/neural-network',
    title: '3D Neural Network',
    blurb:
      'Spin a feedforward network in 3D, watch a forward pass ripple through it, and step through what neurons, layers, and training actually do. Plus a tour of where neural nets show up across modern AI.',
    tags: ['ML', '3D', 'visualization'],
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI',
}

export function demoCategory(slug: string): { key: string; label: string } {
  const key = slug.includes('/') ? slug.split('/')[0] : 'other'
  return { key, label: CATEGORY_LABELS[key] ?? key.toUpperCase() }
}
