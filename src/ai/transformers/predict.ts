import { cosSim, softmax } from './math'
import { VOCAB } from './vocab'
import { getEmbed } from './embeddings'

export type Prediction = { word: string; score: number; prob: number }

export function predict(vec: number[]): Prediction[] {
  const scores = VOCAB
    .filter((word) => word !== '<unk>')
    .map((word) => ({ word, score: cosSim(vec, getEmbed(word)) }))
  scores.sort((left, right) => right.score - left.score)
  const top = scores.slice(0, 8)
  const probs = softmax(top.map((entry) => entry.score * 6))
  return top.map((entry, index) => ({ ...entry, prob: probs[index] }))
}
