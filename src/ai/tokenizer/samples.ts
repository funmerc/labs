export type CostSample = {
  label: string
  description: string
  text: string
}

export const COST_SAMPLES: CostSample[] = [
  {
    label: 'English',
    description: 'Typical English sentence using common words.',
    text: 'The little cat sat on the mat by the door.',
  },
  {
    label: 'Spanish',
    description: 'Same idea in a romance language with some shared roots.',
    text: 'El pequeño gato se sentó en la alfombra junto a la puerta.',
  },
  {
    label: 'Chinese',
    description: 'A non-Latin script the English corpus never saw.',
    text: '小猫坐在门边的垫子上',
  },
  {
    label: 'Emoji',
    description: 'Symbols that fall outside the trained alphabet entirely.',
    text: 'the cat 🐈 sat on the 🪑 by the 🚪',
  },
  {
    label: 'Code',
    description: 'Source code with punctuation and identifiers.',
    text: 'function getUser(id) { return users.find(u => u.id === id) }',
  },
]
