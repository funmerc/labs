import '../../shared'
import './style.css'

import { DIM, addVecs, cosSim, posEnc } from './math'
import { CAT_NAME, CAT_OF, VOCAB, tokenize, type Category } from './vocab'
import { DIM_LABELS, getEmbed } from './embeddings'
import { HEADS, runHead, type HeadResult } from './attention'
import { ffn, type FFNResult } from './ffn'
import { predict } from './predict'
import { heat, tokColor } from './colors'

/* ── Pipeline state ──────────────────────────────────────────── */
let TOKENS: string[] = []
let EMBEDS: number[][] = []
let PE_VECS: number[][] = []
let FINAL_VECS: number[][] = []
let ATTN_HEADS: HeadResult[][] = []
let LAST_HIDDEN: number[] = []
let FFN_RESULT: FFNResult = { out: [], target: [], nextCats: [] }

const STEP_NAMES = ['Tokens', 'Embed', '+ Pos. Enc.', 'Attention', 'FFN', 'Output']
let activePanel = 0
let activeHead = 0

function run() {
  const raw = (document.getElementById('inp') as HTMLInputElement).value || 'the cat sat'
  TOKENS = tokenize(raw).slice(0, 8)
  if (!TOKENS.length) {
    return
  }

  EMBEDS = TOKENS.map(getEmbed)
  PE_VECS = TOKENS.map((_, index) => posEnc(index))
  FINAL_VECS = TOKENS.map((_, index) => addVecs(EMBEDS[index], PE_VECS[index]))

  ATTN_HEADS = HEADS.map((head) => runHead(TOKENS, FINAL_VECS, head.kind))

  const tokenCount = TOKENS.length
  const lastHidden = Array(DIM).fill(0) as number[]
  for (const headResult of ATTN_HEADS) {
    for (let dim = 0; dim < DIM; dim++) {
      lastHidden[dim] += headResult[tokenCount - 1].out[dim] / ATTN_HEADS.length
    }
  }
  LAST_HIDDEN = lastHidden.map((value) => +value.toFixed(3))

  const lastCat: Category = CAT_OF[TOKENS[tokenCount - 1]] ?? 'SPECIAL'
  FFN_RESULT = ffn(LAST_HIDDEN, lastCat)

  renderAll()
  showPanel(activePanel)
}

function showPanel(panelIndex: number) {
  activePanel = panelIndex
  document.querySelectorAll('.panel').forEach((panel, index) => {
    panel.classList.toggle('active', panelIndex === index)
  })
  document.querySelectorAll('.step-btn').forEach((button, index) => {
    button.classList.toggle('active', panelIndex === index)
  })
  const prev = document.getElementById('prev-btn') as HTMLButtonElement
  const next = document.getElementById('next-btn') as HTMLButtonElement
  if (panelIndex === 0) {
    prev.style.visibility = 'hidden'
  } else {
    prev.style.visibility = 'visible'
  }
  if (panelIndex === STEP_NAMES.length - 1) {
    next.style.visibility = 'hidden'
  } else {
    next.style.visibility = 'visible'
  }
}

function renderAll() {
  document.getElementById('steps')!.innerHTML = STEP_NAMES.map((name, index) => {
    const arrow = index > 0 ? '<span class="step-arrow">→</span>' : ''
    const activeClass = index === activePanel ? ' active' : ''
    return `
${arrow}
<button class="step-btn${activeClass}" data-panel="${index}" type="button">
  <span class="step-num">${index + 1}</span><span class="step-label">${name}</span>
</button>`
  }).join('')

  document.getElementById('panels')!.innerHTML = `
${panelTokens()}
${panelEmbeds()}
${panelCombined()}
${panelAttn()}
${panelFFN()}
${panelOutput()}
`
}

/* ── Rendering helpers ───────────────────────────────────────── */
const explain = (html: string) =>
  `<div class="alert alert-secondary small mb-3">${html}</div>`
const note = (html: string) =>
  `<div class="note small mb-3"><strong>Heads up:</strong> ${html}</div>`
const sec = (label: string) =>
  `<div class="text-uppercase small text-secondary fw-medium mb-2" style="letter-spacing:.06em">${label}</div>`

function tokenBadge(word: string, extra = ''): string {
  const color = tokColor(word)
  return `<span class="tok" style="background:${color.bg};border-color:${color.bd};color:${color.tx}">${word}${extra}</span>`
}

function vecBars(vec: number[], color: string, withLabels = false): string {
  const max = Math.max(0.5, ...vec.map(Math.abs))
  const bars = vec
    .map((value, dim) => {
      const height = Math.round((Math.abs(value) / max) * 100)
      const isPositive = value >= 0
      const fillColor = isPositive ? color : '#bbb'
      const opacity = isPositive ? '' : 'opacity:.6'
      const verticalAnchor = isPositive ? 'bottom:50%' : 'top:50%'
      return `<div class="bar-cell" title="d${dim} (${DIM_LABELS[dim]}): ${value}"><div class="bar-fill" style="height:${height}%;background:${fillColor};${opacity};${verticalAnchor}"></div></div>`
    })
    .join('')
  let labels = ''
  if (withLabels) {
    labels = `<div class="bar-labels">${vec.map((_, dim) => `<span>d${dim}</span>`).join('')}</div>`
  }
  return `<div class="bars-wrap"><div class="bars">${bars}</div>${labels}</div>`
}

/* ── Panel 1: Tokenization ───────────────────────────────────── */
function panelTokens(): string {
  const rows = TOKENS.map((token, index) => {
    const tokenId = VOCAB.indexOf(token)
    const cat = CAT_OF[token] ?? 'SPECIAL'
    return `<tr>
      <td class="text-secondary small">${index}</td>
      <td>${tokenBadge(token)}</td>
      <td class="text-secondary small">#${tokenId}</td>
      <td class="text-secondary small">${CAT_NAME[cat]}</td>
    </tr>`
  }).join('')
  return `<div class="panel active" id="p0">
${explain(`<strong>Tokenization</strong> is chopping your input into pieces the model recognizes. Each piece is called a <em>token</em>, and every token has an ID that gets looked up in the next step. Tokens are color-coded by category here, so you can follow each one through the rest of the pipeline. The vocab has ${VOCAB.length} entries; anything outside it becomes <code>&lt;unk&gt;</code> ("unknown").`)}
${note(`Real tokenizers split words into smaller pieces called subwords, so "playing" might become "play" plus "ing", and real vocabularies have tens of thousands of entries. This demo uses whole-word tokens and a tiny custom vocab to keep things readable.`)}
${sec(`Your input → ${TOKENS.length} tokens`)}
<div class="table-responsive">
  <table class="table table-sm align-middle">
    <thead class="text-secondary small">
      <tr><th style="width:50px">Pos</th><th>Token</th><th style="width:80px">ID</th><th>Category</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>
</div>`
}

/* ── Panel 2: Embeddings ─────────────────────────────────────── */
function panelEmbeds(): string {
  const cards = TOKENS.map((token, index) => {
    const color = tokColor(token)
    const vec = EMBEDS[index]
    const max = Math.max(...vec.map(Math.abs)) || 1
    const bars = vec
      .map((value, dim) => {
        const percent = Math.round((Math.abs(value) / max) * 100)
        return `<div class="vec-bar-row">
        <span class="vec-dim">d${dim}</span>
        <div class="vec-bar-bg"><div class="vec-bar-fill" style="width:${percent}%;background:${color.bd}"></div></div>
        <span class="vec-val">${value}</span>
      </div>`
      })
      .join('')
    return `<div class="vec-card">
      <div class="vec-label" style="color:${color.tx}">${token}</div>
      <div class="vec-bars">${bars}</div>
    </div>`
  }).join('')

  const simHints = similarityHints()

  const legend = DIM_LABELS.map((label, dim) => {
    return `<span class="dim-pill"><strong>d${dim}</strong> ${label}</span>`
  }).join('')

  return `<div class="panel" id="p1">
${explain(`A <strong>token embedding</strong> is just a list of ${DIM} numbers representing the word. Think of it as the word's coordinates in ${DIM}-dimensional space. Words with similar meanings end up close together in that space. In real models the ${DIM} dimensions are learned during training and meaning gets spread across all of them, so no single dimension has a clean label. For this demo, each dimension is hand-assigned a role (see the legend below) so you can actually read the bars. Words of the same kind light up the same dimensions.`)}
${note(`Real embeddings are learned from training data and use hundreds to thousands of dimensions. Meaning is spread across many dimensions at once, and similar words cluster softly rather than in neat groups. The clean category bars you see here are a teaching simplification. What each dimension actually encodes in a real trained model is still an open question, and figuring that out is the whole point of a field called <em>mechanistic interpretability</em>.`)}
${sec('What each dimension represents (this demo only)')}
<div class="dim-legend mb-3">${legend}</div>
${sec(`Embedding vectors (${DIM}D)`)}
<div class="vec-grid">${cards}</div>
${simHints}
</div>`
}

function similarityHints(): string {
  if (TOKENS.length < 2) {
    return ''
  }
  const pairs: { wordA: string; wordB: string; similarity: number }[] = []
  for (let firstIndex = 0; firstIndex < TOKENS.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < TOKENS.length; secondIndex++) {
      if (TOKENS[firstIndex] === TOKENS[secondIndex]) {
        continue
      }
      pairs.push({
        wordA: TOKENS[firstIndex],
        wordB: TOKENS[secondIndex],
        similarity: cosSim(EMBEDS[firstIndex], EMBEDS[secondIndex]),
      })
    }
  }
  if (!pairs.length) {
    return ''
  }
  pairs.sort((left, right) => right.similarity - left.similarity)
  const top = pairs[0]
  const bottom = pairs[pairs.length - 1]
  return `${sec('Cosine similarity between your tokens')}
<div class="d-flex flex-wrap gap-3 small mb-2">
  <div><span class="text-secondary">Most similar:</span> ${tokenBadge(top.wordA)} ↔ ${tokenBadge(top.wordB)} <code class="ms-1">${top.similarity.toFixed(2)}</code></div>
  <div><span class="text-secondary">Least similar:</span> ${tokenBadge(bottom.wordA)} ↔ ${tokenBadge(bottom.wordB)} <code class="ms-1">${bottom.similarity.toFixed(2)}</code></div>
</div>`
}

/* ── Panel 3: Embedding + Positional Encoding = Combined ─────── */
function panelCombined(): string {
  const cards = TOKENS.map((token, index) => {
    const color = tokColor(token)
    return `<div class="combined-card">
      <div class="combined-head" style="color:${color.tx}">${token} <span class="text-secondary small">pos ${index}</span></div>
      <div class="combined-row"><span class="combined-label">embed</span>${vecBars(EMBEDS[index], color.bd)}</div>
      <div class="combined-op">+</div>
      <div class="combined-row"><span class="combined-label">pos enc</span>${vecBars(PE_VECS[index], '#85B7EB')}</div>
      <div class="combined-op">=</div>
      <div class="combined-row"><span class="combined-label">input</span>${vecBars(FINAL_VECS[index], '#666', true)}</div>
    </div>`
  }).join('')

  return `<div class="panel" id="p2">
${explain(`<strong>Positional encoding</strong> tells the model where each word sits in the sentence. Without it, "dog bites man" and "man bites dog" would look identical, because the next step (attention) doesn't care about order on its own. So we generate a unique pattern of numbers per position, using sin and cos waves at different frequencies, and <em>add</em> it to the embedding. The same word at different positions ends up with a slightly different final vector.`)}
${note(`Sinusoidal positional encoding is the method from the original 2017 transformer paper. Most modern models like LLaMA, Claude, and GPT use newer approaches such as RoPE or ALiBi. The goal is always the same: give the model a sense of word order.`)}
${sec('embed + pos_enc = input')}
<p class="small text-secondary mb-3">Each card below is one word at one position. The three rows show its <strong>embedding</strong> (the semantic vector from the previous step), the <strong>positional encoding</strong> for that position, and their sum, which becomes the <strong>input</strong> vector that feeds attention. The 8 bars in every row correspond to the dimensions from the legend above (d0 = determiner, d1 = animate, and so on). Bar height shows magnitude; bars above the center line are positive, below are negative. Hover any bar to see its value.</p>
<div class="combined-grid">${cards}</div>
</div>`
}

/* ── Panel 4: Attention ──────────────────────────────────────── */
function panelAttn(): string {
  const headBtns = HEADS.map((head, index) => {
    const activeClass = index === activeHead ? ' active' : ''
    return `<button class="btn btn-sm btn-outline-secondary head-btn${activeClass}" data-head="${index}" type="button">${head.label}</button>`
  }).join('')
  return `<div class="panel" id="p3">
${explain(`<strong>Self-attention</strong> is how each word gathers context from the rest of the sentence. It looks at every other word and decides which ones matter most. Here's how it works. Each word produces three vectors: a <em>Query</em> ("what info am I after?"), a <em>Key</em> ("here's what I represent"), and a <em>Value</em> ("here's what I'll share if you focus on me"). For every word, the model multiplies its Query by every other word's Key to get match scores, softmaxes those scores into weights that sum to 100%, then combines all the Values by those weights. Several <em>heads</em> run in parallel, each learning to spot a different kind of relationship. To keep this demo legible, we skip the projection math and just specify each head's pattern directly. What you see is the shape that trained projections would produce.`)}
${note(`Real attention heads aren't hand-designed. They emerge during training, and their patterns can be much messier and harder to interpret than these clean examples. Real models used for text generation also apply causal masking, so each word can only look backward at earlier words, never forward. After each head produces its output, real models concatenate all of them and pass them through a learned projection layer; this demo simply averages them.`)}
${sec('Head')}
<div class="btn-group btn-group-sm mb-2" role="group" id="head-btns">${headBtns}</div>
<div class="small text-secondary mb-3" id="head-about">${HEADS[activeHead].about}</div>
${sec('Attention weights')}
<div class="small text-secondary mb-2">Each row is one word asking <em>"who should I focus on?"</em>. Brighter cells = stronger focus. Each row sums to 100%.</div>
<div class="table-responsive mb-3" id="attn-wrap">${buildHeatmap(activeHead)}</div>
${sec('Strongest match per word')}
<div class="small text-secondary mb-2">The single brightest cell in each row, with same-word matches skipped so the interesting links stand out.</div>
<div id="attn-summary" class="d-flex flex-wrap gap-2 align-items-center small">${headSummary(activeHead)}</div>
</div>`
}

function selectHead(headIndex: number) {
  activeHead = headIndex
  document.querySelectorAll('.head-btn').forEach((button, index) => {
    button.classList.toggle('active', index === headIndex)
  })
  document.getElementById('attn-wrap')!.innerHTML = buildHeatmap(headIndex)
  document.getElementById('attn-summary')!.innerHTML = headSummary(headIndex)
  document.getElementById('head-about')!.textContent = HEADS[headIndex].about
}

function headSummary(headIndex: number): string {
  const head = ATTN_HEADS[headIndex]
  if (!head?.length) {
    return ''
  }
  const links: { from: string; to: string; pct: number }[] = []
  head.forEach((row, rowIndex) => {
    let topCol = 0
    let topWeight = -1
    for (let col = 0; col < row.weights.length; col++) {
      if (row.weights[col] > topWeight) {
        topWeight = row.weights[col]
        topCol = col
      }
    }
    const from = TOKENS[rowIndex]
    const to = TOKENS[topCol]
    if (from === to) {
      return
    }
    links.push({ from, to, pct: topWeight * 100 })
  })
  if (!links.length) {
    return `<span class="text-secondary">Every word's strongest focus lands on itself or another copy of the same word in this head.</span>`
  }
  return links
    .map((link) => {
      return `<span class="d-inline-flex align-items-center gap-1">${tokenBadge(link.from)}<span class="text-secondary">→</span>${tokenBadge(link.to)}<span class="text-secondary ms-1">${link.pct.toFixed(0)}%</span></span>`
    })
    .join('')
}

function buildHeatmap(headIndex: number): string {
  const head = ATTN_HEADS[headIndex]
  const colLabels = TOKENS.map((token) => `<th class="attn-col-h">${token}</th>`).join('')
  const rows = TOKENS.map((token, rowIndex) => {
    const color = tokColor(token)
    const cells = head[rowIndex].weights
      .map((weight) => {
        const cellColor = heat(weight)
        const textColor = weight > 0.5 ? '#fff' : '#333'
        return `<td><div class="attn-cell" title="${(weight * 100).toFixed(1)}%" style="background:${cellColor};color:${textColor}">${(weight * 100).toFixed(0)}</div></td>`
      })
      .join('')
    return `<tr><th class="row-h" style="color:${color.tx}">${token}</th>${cells}</tr>`
  }).join('')
  return `<table class="attn-table">
<thead><tr><th></th>${colLabels}</tr></thead>
<tbody>${rows}</tbody>
</table>`
}

/* ── Panel 5: FFN ────────────────────────────────────────────── */
function panelFFN(): string {
  const tokenCount = TOKENS.length
  const lastToken = TOKENS[tokenCount - 1]
  const lastCat = CAT_OF[lastToken] ?? 'SPECIAL'
  const nextCatNames = FFN_RESULT.nextCats.map((category) => CAT_NAME[category]).join(', ')

  return `<div class="panel" id="p4">
${explain(`After attention, each word has soaked up some context from its neighbors. The <strong>feed-forward network (FFN)</strong> is a small two-step neural network that runs on each word independently. It's where most of a transformer's learned numbers live, and where patterns like "a verb usually follows a noun" get applied. To predict the next word, we take the last word's vector (here, "${lastToken}") and run it through the FFN, which nudges it toward the kinds of words that typically come next.`)}
${note(`Real FFNs have learned weights that get tuned across billions of training examples. The "nudge toward likely-next category" here is a deliberate shortcut to make the demo predictions sensible. A trained FFN would arrive at similar behavior through a much more complex transformation.`)}
${sec(`Transforming the last token's hidden state: "${lastToken}" (${CAT_NAME[lastCat]})`)}
<p class="small text-secondary mb-3">Both charts below show the same word's vector, before and after the FFN runs on it. The 8 bars correspond to the dimensions from the legend in the Embed step (d0 = determiner, d1 = animate, and so on). Bar height shows magnitude; bars above the center line are positive, below are negative. Hover any bar to see its value. Notice how the FFN reshapes the vector toward the kinds of categories that usually come next.</p>
<div class="ffn-flow">
  <div class="ffn-step">
    <div class="ffn-label">after attention</div>
    ${vecBars(LAST_HIDDEN, '#85B7EB', true)}
    <div class="ffn-sub text-secondary small">avg of all heads' outputs at position ${tokenCount - 1}</div>
  </div>
  <div class="ffn-arrow">→ FFN →</div>
  <div class="ffn-step">
    <div class="ffn-label">after FFN</div>
    ${vecBars(FFN_RESULT.out, 'var(--bs-primary)', true)}
    <div class="ffn-sub text-secondary small">nudged toward likely-next categories: ${nextCatNames}</div>
  </div>
</div>
</div>`
}

/* ── Panel 6: Output ─────────────────────────────────────────── */
function panelOutput(): string {
  const predictions = predict(FFN_RESULT.out)
  const topProb = predictions[0]?.prob ?? 1
  const cards = predictions
    .map((prediction, index) => {
      const percent = Math.round((prediction.prob / topProb) * 100)
      const isTop = index === 0
      const color = tokColor(prediction.word)
      const borderClass = isTop ? 'border-success' : ''
      const barColor = isTop ? 'var(--bs-success)' : color.bd
      return `<div class="col">
  <div class="card h-100 ${borderClass}">
    <div class="card-body text-center p-2">
      <div class="fw-medium" style="color:${color.tx}">${prediction.word}</div>
      <div class="small text-secondary">${(prediction.prob * 100).toFixed(1)}%</div>
      <div class="out-bar mt-2"><div class="out-bar-fill" style="width:${percent}%;background:${barColor}"></div></div>
    </div>
  </div>
</div>`
    })
    .join('')

  return `<div class="panel" id="p5">
${explain(`To actually <strong>pick the next word</strong>, the model compares the FFN's output against every word's embedding using <em>cosine similarity</em> (basically: "how aligned are these two vectors?"), then applies softmax to turn the scores into probabilities. The top-scoring word is the prediction for what comes after "${TOKENS[TOKENS.length - 1]}".`)}
${note(`Real models also apply techniques like temperature scaling and top-k or nucleus sampling rather than always picking the single most likely word. This demo just shows the raw top picks.`)}
${sec(`Top predicted next tokens after "${TOKENS[TOKENS.length - 1]}"`)}
<div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2 mb-3">${cards}</div>
${explain(`<strong>Scale note:</strong> this toy uses 8 dimensions and 4 hand-crafted heads. Real transformers like GPT-4 or Claude use over 12,000 dimensions with dozens of layers, each containing dozens of learned heads, totaling billions of parameters. The <em>structure</em> is identical. Only the scale and the training do the heavy lifting.`)}
</div>`
}

/* ── Presets ─────────────────────────────────────────────────── */
const PRESETS = [
  'the cat sat on the mat',
  'a big dog ran',
  'the small bird saw a tree',
  'she found a red book',
  'he ran quickly',
]

function renderPresets() {
  const intro = `<span class="text-secondary small me-1 align-self-center">try:</span>`
  const chips = PRESETS.map((preset) => {
    return `<button class="btn btn-sm btn-outline-secondary preset-chip" data-preset="${preset}" type="button">${preset}</button>`
  }).join('')
  document.getElementById('presets')!.innerHTML = intro + chips
}

/* ── Wiring ──────────────────────────────────────────────────── */
renderPresets()

document.getElementById('visualize-btn')!.addEventListener('click', run)

document.getElementById('inp')!.addEventListener('keydown', (event) => {
  if ((event as KeyboardEvent).key === 'Enter') {
    run()
  }
})

document.getElementById('presets')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-preset]')
  if (!button) {
    return
  }
  ;(document.getElementById('inp') as HTMLInputElement).value = button.dataset.preset!
  run()
})

document.getElementById('steps')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-panel]')
  if (button) {
    showPanel(+button.dataset.panel!)
  }
})

document.getElementById('panels')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-head]')
  if (button) {
    selectHead(+button.dataset.head!)
  }
})

document.getElementById('prev-btn')!.addEventListener('click', () => {
  if (activePanel > 0) {
    showPanel(activePanel - 1)
  }
})
document.getElementById('next-btn')!.addEventListener('click', () => {
  if (activePanel < STEP_NAMES.length - 1) {
    showPanel(activePanel + 1)
  }
})

run()
