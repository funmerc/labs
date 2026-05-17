import '../../shared'
import './style.css'

import {
  applyMergesToWord,
  buildVocabRank,
  displayToken,
  encode,
  train,
  type Merge,
  type TrainResult,
  type WordTrace,
} from './bpe'
import { CORPORA, getCorpus } from './corpus'
import { COST_SAMPLES } from './samples'
import { tokenColor } from './colors'

const STEP_NAMES = ['Characters', 'Train', 'Vocab', 'Encode', 'Cost']
const MAX_MERGES = 150
const DEFAULT_PLAY_SPEED_MS = 220
const WORD_EVOLUTION_COUNT = 8

type State = {
  corpusKey: string
  corpusText: string
  trainResult: TrainResult
  currentMergeCount: number
  isPlaying: boolean
  playSpeedMs: number
  playTimeout: number | null
  inputText: string
  encodeTraces: WordTrace[]
  activePanel: number
  activeWordIndex: number
  wordStepIndex: number
}

const initialCorpus = CORPORA[0]
const initialTrain = train(initialCorpus.text, MAX_MERGES)

const state: State = {
  corpusKey: initialCorpus.key,
  corpusText: initialCorpus.text,
  trainResult: initialTrain,
  currentMergeCount: initialTrain.merges.length,
  isPlaying: false,
  playSpeedMs: DEFAULT_PLAY_SPEED_MS,
  playTimeout: null,
  inputText: (document.getElementById('inp') as HTMLInputElement).value,
  encodeTraces: [],
  activePanel: 0,
  activeWordIndex: 0,
  wordStepIndex: 0,
}

function activeMerges(): Merge[] {
  return state.trainResult.merges.slice(0, state.currentMergeCount)
}

function activeVocabRank(): Map<string, number> {
  return buildVocabRank(activeMerges())
}

function recomputeEncoding() {
  state.encodeTraces = encode(state.inputText, activeVocabRank())
  if (state.activeWordIndex >= state.encodeTraces.length) {
    state.activeWordIndex = 0
  }
  const trace = state.encodeTraces[state.activeWordIndex]
  if (!trace) {
    state.wordStepIndex = 0
    return
  }
  if (state.wordStepIndex > trace.steps.length) {
    state.wordStepIndex = trace.steps.length
  }
}

function rebuildVocabList(): string[] {
  const list: string[] = []
  for (const symbol of state.trainResult.initialVocab) {
    list.push(symbol)
  }
  for (const merge of activeMerges()) {
    list.push(merge.result)
  }
  return list
}

const explain = (html: string) =>
  `<div class="alert alert-secondary small mb-3">${html}</div>`
const note = (html: string) =>
  `<div class="note small mb-3"><strong>Heads up:</strong> ${html}</div>`
const sec = (label: string) =>
  `<div class="text-uppercase small text-secondary fw-medium mb-2" style="letter-spacing:.06em">${label}</div>`

function tokenChip(token: string, extra = ''): string {
  const color = tokenColor(token)
  const display = displayToken(token) || '·'
  return `<span class="tok-chip" style="background:${color.bg};border-color:${color.bd};color:${color.tx}" title="${escapeAttr(token)}">${escapeHtml(display)}${extra}</span>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

function showPanel(panelIndex: number) {
  state.activePanel = panelIndex
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

function renderStepFlow() {
  const html = STEP_NAMES.map((name, index) => {
    const arrow = index > 0 ? '<span class="step-arrow">→</span>' : ''
    const activeClass = index === state.activePanel ? ' active' : ''
    return `${arrow}<button class="step-btn${activeClass}" data-panel="${index}" type="button"><span class="step-num">${index + 1}</span><span class="step-label">${name}</span></button>`
  }).join('')
  document.getElementById('steps')!.innerHTML = html
}

function renderAll() {
  recomputeEncoding()
  renderStepFlow()
  document.getElementById('panels')!.innerHTML = `
${panelCharacters()}
${panelTrain()}
${panelVocab()}
${panelEncode()}
${panelCost()}
`
  showPanel(state.activePanel)
}

/* ── Panel 1: Characters ─────────────────────────────────────── */
function panelCharacters(): string {
  const chars = [...state.inputText]
  const cells = chars
    .map((char, index) => {
      const codepoint = char.codePointAt(0) ?? 0
      const display = char === ' ' ? '␣' : escapeHtml(char)
      return `<div class="char-cell">
        <div class="char-pos">${index}</div>
        <div class="char-glyph">${display}</div>
        <div class="char-code">U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}</div>
      </div>`
    })
    .join('')

  return `<div class="panel" id="p0">
${explain(`<strong>Tokenization</strong> is the step that turns your typed text into the small units a model actually consumes. Before any clever splitting, every tokenizer sees text the same way: as a stream of characters. Each character has a number called a codepoint that uniquely identifies it across every script and emoji. The job of the next few panels is to learn shortcuts so the model does not have to deal with every character one by one.`)}
${note(`Production tokenizers like the ones inside GPT or Claude actually work at the <em>byte</em> level, not the codepoint level. That lets them handle absolutely anything you throw at them, including emoji and rare scripts, without ever falling back on an "unknown" token. This demo works at the codepoint level so the table below stays readable.`)}
${sec(`Your input as ${chars.length} characters`)}
<div class="char-grid">${cells}</div>
</div>`
}

/* ── Panel 2: Train ──────────────────────────────────────────── */
function panelTrain(): string {
  const corpusButtons = CORPORA.map((corpus) => {
    const activeClass = corpus.key === state.corpusKey ? ' active' : ''
    return `<button class="btn btn-sm btn-outline-secondary corpus-btn${activeClass}" data-corpus="${corpus.key}" type="button">${corpus.name}</button>`
  }).join('')

  const totalMerges = state.trainResult.merges.length
  const cap = Math.max(totalMerges, 1)
  const current = state.currentMergeCount
  const playLabel = state.isPlaying ? '⏸ Pause' : '▶ Play'

  const recentMerge = current > 0 ? state.trainResult.merges[current - 1] : null
  const nextMerge = current < totalMerges ? state.trainResult.merges[current] : null

  let topPairCallout = ''
  if (recentMerge) {
    topPairCallout = `<div class="top-pair-callout">
      <div class="text-secondary small mb-1">Just merged (rank ${recentMerge.rank})</div>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        ${tokenChip(recentMerge.pair[0])}<span class="text-secondary">+</span>${tokenChip(recentMerge.pair[1])}
        <span class="text-secondary">→</span>${tokenChip(recentMerge.result)}
        <span class="text-secondary small ms-2">seen ${recentMerge.count} times</span>
      </div>
    </div>`
  } else {
    topPairCallout = `<div class="top-pair-callout text-secondary small">No merges applied yet. Press play to start.</div>`
  }

  let upNext = ''
  if (nextMerge) {
    upNext = `<div class="text-secondary small mt-2">Up next: ${tokenChip(nextMerge.pair[0])} + ${tokenChip(nextMerge.pair[1])} (×${nextMerge.count})</div>`
  }

  const mergeRules = renderMergeRulesTable()
  const wordEvolution = renderWordEvolution()
  const currentCorpus = getCorpus(state.corpusKey)

  return `<div class="panel" id="p1">
${explain(`<strong>Byte Pair Encoding (BPE)</strong> is the trick almost every modern language model uses to chop text into pieces. It works in a loop. Start with raw characters as the only "tokens" the model knows about. Then count every adjacent pair across the corpus, find the pair that shows up most often, and add it to the vocabulary as a new merged token. Repeat. Common combinations like "th", "the", or "ing" rise to the top quickly because they appear everywhere. Rare combinations never get a shortcut and stay as individual characters.`)}
${note(`A real tokenizer is trained once on billions of words and then frozen. The same vocab gets used forever. This demo lets you re-train on tiny corpora so you can watch the process unfold. Don't expect the merges here to match what a production tokenizer would learn; the corpus is too small and too narrow.`)}
${sec('Pick a corpus')}
<div class="btn-group btn-group-sm mb-2 flex-wrap" role="group">${corpusButtons}</div>
<p class="text-secondary small mb-3">${currentCorpus.blurb}</p>
<details class="mb-3 small">
  <summary class="text-secondary">Edit or paste your own corpus</summary>
  <textarea id="corpus-text" class="form-control form-control-sm mt-2" rows="6">${escapeHtml(state.corpusText)}</textarea>
  <button id="retrain-btn" class="btn btn-sm btn-outline-primary mt-2" type="button">Retrain on this text</button>
</details>

${sec('Controls')}
<div class="d-flex align-items-center gap-2 flex-wrap mb-3">
  <button id="play-btn" class="btn btn-sm btn-primary" type="button">${playLabel}</button>
  <button id="step-btn" class="btn btn-sm btn-outline-secondary" type="button">⏭ Step</button>
  <button id="reset-btn" class="btn btn-sm btn-outline-secondary" type="button">↻ Reset</button>
  <div class="d-flex align-items-center gap-1 ms-2 small text-secondary">
    Speed
    <input type="range" id="speed-slider" min="60" max="700" step="20" value="${state.playSpeedMs}" style="width:80px" />
  </div>
  <div class="d-flex align-items-center gap-1 ms-auto small text-secondary">
    Merges
    <input type="range" id="merge-slider" min="0" max="${cap}" step="1" value="${current}" style="width:140px" />
    <span class="fw-medium text-body" style="min-width:50px;text-align:right">${current} / ${totalMerges}</span>
  </div>
</div>

${topPairCallout}
${upNext}

<div class="row g-3 mt-3">
  <div class="col-md-5">
    ${sec(`Merge rules learned (${current})`)}
    <div class="merge-rules-wrap">${mergeRules}</div>
  </div>
  <div class="col-md-7">
    ${sec('Word evolution')}
    <p class="text-secondary small mb-2">Top words from the corpus and how they tokenize right now. Watch them collapse into fewer pieces as merges accumulate.</p>
    <div class="word-evolution">${wordEvolution}</div>
  </div>
</div>
</div>`
}

function renderMergeRulesTable(): string {
  const rules = activeMerges()
  if (!rules.length) {
    return `<div class="text-secondary small p-3">No merges yet. The vocabulary is just the alphabet from the corpus.</div>`
  }
  const rows = rules
    .slice()
    .reverse()
    .map((merge) => {
      return `<tr>
        <td class="text-secondary small">${merge.rank}</td>
        <td>${tokenChip(merge.pair[0])} + ${tokenChip(merge.pair[1])}</td>
        <td>${tokenChip(merge.result)}</td>
        <td class="text-secondary small text-end">${merge.count}</td>
      </tr>`
    })
    .join('')
  return `<div class="table-responsive merge-table-scroll">
    <table class="table table-sm align-middle mb-0">
      <thead class="text-secondary small sticky-top bg-body">
        <tr><th style="width:42px">#</th><th>Pair</th><th>Merged</th><th class="text-end">Count</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function renderWordEvolution(): string {
  const topByFrequency = [...state.trainResult.wordFreq.entries()]
    .sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1])
    .slice(0, WORD_EVOLUTION_COUNT)
  if (!topByFrequency.length) {
    return `<div class="text-secondary small">The corpus is empty.</div>`
  }
  const merges = activeMerges()
  const recentMerge = state.currentMergeCount > 0
    ? state.trainResult.merges[state.currentMergeCount - 1]
    : null

  const rows = topByFrequency.map(([word, frequency]) => {
    const tokens = applyMergesToWord(word, merges)
    const wasAffected = recentMerge !== null && tokens.includes(recentMerge.result)
    return { word, frequency, tokens, wasAffected }
  })

  rows.sort((leftRow, rightRow) => {
    if (leftRow.wasAffected !== rightRow.wasAffected) {
      return leftRow.wasAffected ? -1 : 1
    }
    return rightRow.frequency - leftRow.frequency
  })

  return rows
    .map((row) => {
      const tokenHtml = row.tokens.map((token) => tokenChip(token)).join('')
      const affectedClass = row.wasAffected ? ' affected' : ''
      return `<div class="word-evo-row${affectedClass}">
        <div class="word-evo-label">
          <span class="fw-medium">${escapeHtml(row.word)}</span>
          <span class="text-secondary small">×${row.frequency}</span>
        </div>
        <div class="word-evo-tokens">${tokenHtml}</div>
      </div>`
    })
    .join('')
}

/* ── Panel 3: Vocab ──────────────────────────────────────────── */
function panelVocab(): string {
  const initialVocab = state.trainResult.initialVocab
  const merges = activeMerges()
  const initialChips = initialVocab.map((symbol) => tokenChip(symbol)).join('')
  const mergeRows = merges
    .slice()
    .reverse()
    .map((merge, indexFromEnd) => {
      const id = initialVocab.length + (merges.length - 1 - indexFromEnd)
      return `<tr>
        <td class="text-secondary small">${id}</td>
        <td>${tokenChip(merge.result)}</td>
        <td class="text-secondary small">${escapeHtml(merge.result)}</td>
        <td class="text-secondary small text-end">rank ${merge.rank}</td>
        <td class="text-secondary small text-end">${merge.count}</td>
      </tr>`
    })
    .join('')

  const totalVocab = initialVocab.length + merges.length

  return `<div class="panel" id="p2">
${explain(`Once training is done, the <strong>vocabulary</strong> is just the alphabet plus every merge that was learned. Each token gets a stable integer ID, which is what the model actually sees. There is nothing magical about a "token"; it is just an entry in this list. The text you give the model gets broken into pieces, each piece looked up in this table, and the resulting IDs are what flow into the rest of the network.`)}
${note(`A real GPT-class tokenizer has roughly 50,000 to 200,000 tokens. The one you just trained has ${totalVocab}. Real vocabs include things like leading-space variants of common words (' the' as one token, 'the' as another), numbers, punctuation, and a long tail of code and multilingual fragments.`)}
${sec(`Starting alphabet (${initialVocab.length} characters)`)}
<div class="vocab-chip-row mb-3">${initialChips}</div>

${sec(`Learned merges (${merges.length})`)}
<p class="text-secondary small mb-2">Sorted with the most recent merge at the top so you can see what just got added when scrubbing the slider on the previous step.</p>
<div class="table-responsive merge-table-scroll">
  <table class="table table-sm align-middle mb-0">
    <thead class="text-secondary small sticky-top bg-body">
      <tr><th style="width:54px">ID</th><th>Token</th><th>Raw</th><th class="text-end">Order</th><th class="text-end">Count</th></tr>
    </thead>
    <tbody>${mergeRows || '<tr><td colspan="5" class="text-secondary small p-3">No merges learned yet. Go back to the previous step and let some run.</td></tr>'}</tbody>
  </table>
</div>
</div>`
}

/* ── Panel 4: Encode ─────────────────────────────────────────── */
function panelEncode(): string {
  const traces = state.encodeTraces
  if (!traces.length) {
    return `<div class="panel" id="p3">
${explain(`Type something in the box at the top, then press <em>Tokenize</em>, to see how the trained vocab splits it up.`)}
</div>`
  }

  const liveGrouping = renderLiveGrouping(traces)
  const tokenList = renderTokenIdList(traces)
  const stepTabs = renderEncodeWordTabs(traces)
  const stepView = renderEncodeStepView(traces[state.activeWordIndex])

  return `<div class="panel" id="p3">
${explain(`Encoding new text is just greedy merging. Start with each character as its own token, then look at every adjacent pair, find the one with the earliest (lowest-rank) merge rule, and apply it. Keep going until nothing else can be merged. That's it. The result is your token sequence. Unfamiliar characters that never showed up in training have no merges available, so they stay as single tokens.`)}
${note(`This demo uses an end-of-word marker called <code>&lt;/w&gt;</code> shown as a small dot, which is the classical BPE convention from the 2015 paper. Modern GPT-style tokenizers instead bake the leading space into the next token, so " the" is one token and "the" at the start of a sentence is a different one. Same idea, different bookkeeping.`)}
${sec('Live grouping')}
<p class="text-secondary small mb-2">Each colored chunk is one token. Hover to see the raw form including any end-of-word marker.</p>
<div class="live-grouping mb-3">${liveGrouping}</div>

${sec('Token sequence')}
<p class="text-secondary small mb-2">Same tokens listed out with their IDs in this vocab. Real models feed these integers into the embedding layer.</p>
<div class="token-list mb-4">${tokenList}</div>

${sec('Step through a single word')}
<p class="text-secondary small mb-2">Pick a word and walk through the merges one at a time. This is exactly what the encoder does internally.</p>
<div class="d-flex flex-wrap gap-1 mb-2">${stepTabs}</div>
${stepView}
</div>`
}

function renderLiveGrouping(traces: WordTrace[]): string {
  return traces
    .map((trace) => {
      const tokens = trace.final.map((token) => tokenChip(token)).join('')
      return `<span class="live-word">${tokens}</span>`
    })
    .join('<span class="live-space"> </span>')
}

function renderTokenIdList(traces: WordTrace[]): string {
  const vocabList = rebuildVocabList()
  const idLookup = new Map<string, number>()
  vocabList.forEach((token, index) => idLookup.set(token, index))

  const items: string[] = []
  for (const trace of traces) {
    for (const token of trace.final) {
      const id = idLookup.get(token)
      const idLabel = id === undefined ? '?' : String(id)
      items.push(`<div class="token-id-item">${tokenChip(token)}<span class="token-id">#${idLabel}</span></div>`)
    }
  }
  return items.join('')
}

function renderEncodeWordTabs(traces: WordTrace[]): string {
  return traces
    .map((trace, index) => {
      const activeClass = index === state.activeWordIndex ? ' active' : ''
      return `<button class="btn btn-sm btn-outline-secondary word-tab${activeClass}" data-word-index="${index}" type="button">${escapeHtml(trace.word)}</button>`
    })
    .join('')
}

function renderEncodeStepView(trace: WordTrace | undefined): string {
  if (!trace) {
    return ''
  }
  const totalSteps = trace.steps.length
  const stepIndex = Math.min(state.wordStepIndex, totalSteps)
  let tokensNow: string[]
  if (stepIndex === 0) {
    tokensNow = trace.initial
  } else {
    tokensNow = trace.steps[stepIndex - 1].tokensAfter
  }
  const tokensHtml = tokensNow.map((token) => tokenChip(token)).join('')

  let mergeLabel = ''
  if (totalSteps === 0) {
    mergeLabel = `<span class="text-secondary small">No merges apply to this word. The trained vocab has no rules that fit.</span>`
  } else if (stepIndex === 0) {
    mergeLabel = `<span class="text-secondary small">Step 0: starting characters. ${totalSteps} merges will fire.</span>`
  } else {
    const step = trace.steps[stepIndex - 1]
    mergeLabel = `<span class="small">Step ${stepIndex}: applied rule rank ${step.rank}, merging ${tokenChip(step.pair[0])} + ${tokenChip(step.pair[1])} → ${tokenChip(step.result)}</span>`
  }

  return `<div class="encode-step-box">
    <div class="encode-step-tokens">${tokensHtml}</div>
    <div class="encode-step-label mt-2">${mergeLabel}</div>
    <div class="d-flex align-items-center gap-2 mt-2">
      <button id="word-prev-btn" class="btn btn-sm btn-outline-secondary" ${stepIndex === 0 ? 'disabled' : ''} type="button">← Back</button>
      <button id="word-next-btn" class="btn btn-sm btn-outline-secondary" ${stepIndex >= totalSteps ? 'disabled' : ''} type="button">Next →</button>
      <button id="word-reset-btn" class="btn btn-sm btn-outline-secondary" type="button">↻ Reset</button>
      <span class="ms-auto text-secondary small">${stepIndex} / ${totalSteps}</span>
    </div>
  </div>`
}

/* ── Panel 5: Cost ───────────────────────────────────────────── */
function panelCost(): string {
  const vocabRank = activeVocabRank()
  const rows = COST_SAMPLES.map((sample) => {
    const traces = encode(sample.text, vocabRank)
    const tokens: string[] = []
    for (const trace of traces) {
      for (const token of trace.final) {
        tokens.push(token)
      }
    }
    const charCount = [...sample.text].length
    const tokenCount = tokens.length
    const ratio = tokenCount > 0 ? charCount / tokenCount : 0
    const tokenChips = tokens.map((token) => tokenChip(token)).join('')
    const barWidth = Math.min(100, Math.round((tokenCount / Math.max(charCount, 1)) * 100))
    return `<div class="cost-row">
      <div class="cost-head">
        <div>
          <div class="fw-medium">${sample.label}</div>
          <div class="text-secondary small">${escapeHtml(sample.description)}</div>
        </div>
        <div class="cost-stats">
          <div><span class="text-secondary small">chars</span> <span class="fw-medium">${charCount}</span></div>
          <div><span class="text-secondary small">tokens</span> <span class="fw-medium">${tokenCount}</span></div>
          <div><span class="text-secondary small">chars/token</span> <span class="fw-medium">${ratio.toFixed(2)}</span></div>
        </div>
      </div>
      <div class="cost-text small text-body-secondary mb-1">${escapeHtml(sample.text)}</div>
      <div class="cost-bar"><div class="cost-bar-fill" style="width:${barWidth}%"></div></div>
      <div class="cost-tokens mt-2">${tokenChips}</div>
    </div>`
  }).join('')

  const currentCorpus = getCorpus(state.corpusKey)

  return `<div class="panel" id="p4">
${explain(`A tokenizer trained on one kind of text compresses that kind of text best. Anything outside its training data has to fall back on shorter, more numerous tokens. That is why the same idea costs a different number of tokens depending on the language or script you write it in. Look at how each sample below tokenizes against the vocab you just trained on the <em>${escapeHtml(currentCorpus.name)}</em> corpus.`)}
${note(`Token count is what you actually pay for in most API pricing and what counts against the context window. For users writing in non-English scripts, an English-biased tokenizer can mean their prompts cost two to five times as much for the same information. Real production tokenizers like cl100k or o200k are trained on far more multilingual data than this demo to soften that gap, but it never goes away entirely.`)}
${sec('Same idea, different scripts')}
<div class="cost-list">${rows}</div>
</div>`
}

/* ── Animation ───────────────────────────────────────────────── */
function startPlay() {
  if (state.currentMergeCount >= state.trainResult.merges.length) {
    state.currentMergeCount = 0
  }
  state.isPlaying = true
  scheduleNextStep()
  refreshTrainPanel()
}

function stopPlay() {
  state.isPlaying = false
  if (state.playTimeout !== null) {
    clearTimeout(state.playTimeout)
    state.playTimeout = null
  }
  refreshTrainPanel()
}

function scheduleNextStep() {
  if (state.playTimeout !== null) {
    clearTimeout(state.playTimeout)
  }
  state.playTimeout = window.setTimeout(() => {
    if (!state.isPlaying) {
      return
    }
    if (state.currentMergeCount >= state.trainResult.merges.length) {
      stopPlay()
      return
    }
    state.currentMergeCount += 1
    refreshTrainPanel()
    scheduleNextStep()
  }, state.playSpeedMs)
}

function refreshTrainPanel() {
  renderAll()
}

function retrainOnCurrentText() {
  stopPlay()
  state.trainResult = train(state.corpusText, MAX_MERGES)
  state.currentMergeCount = state.trainResult.merges.length
  renderAll()
}

function selectCorpus(key: string) {
  stopPlay()
  const corpus = getCorpus(key)
  state.corpusKey = corpus.key
  state.corpusText = corpus.text
  state.trainResult = train(corpus.text, MAX_MERGES)
  state.currentMergeCount = state.trainResult.merges.length
  renderAll()
}

/* ── Presets ─────────────────────────────────────────────────── */
const PRESETS = [
  'the little cat sat by the door',
  'a big dog ran to the house',
  'tokenization is interesting',
  'function getUser(id) { return id }',
  '小猫坐在门边',
]

function renderPresets() {
  const intro = `<span class="text-secondary small me-1 align-self-center">try:</span>`
  const chips = PRESETS.map((preset) => {
    return `<button class="btn btn-sm btn-outline-secondary preset-chip" data-preset="${escapeAttr(preset)}" type="button">${escapeHtml(preset)}</button>`
  }).join('')
  document.getElementById('presets')!.innerHTML = intro + chips
}

/* ── Wiring ──────────────────────────────────────────────────── */
function runEncodeFromInput() {
  state.inputText = (document.getElementById('inp') as HTMLInputElement).value || ''
  state.activeWordIndex = 0
  state.wordStepIndex = 0
  renderAll()
}

renderPresets()
renderAll()

document.getElementById('encode-btn')!.addEventListener('click', runEncodeFromInput)

document.getElementById('inp')!.addEventListener('keydown', (event) => {
  if ((event as KeyboardEvent).key === 'Enter') {
    runEncodeFromInput()
  }
})

document.getElementById('presets')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-preset]')
  if (!button) {
    return
  }
  const input = document.getElementById('inp') as HTMLInputElement
  input.value = button.dataset.preset ?? ''
  runEncodeFromInput()
})

document.getElementById('steps')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-panel]')
  if (button) {
    showPanel(+(button.dataset.panel ?? '0'))
  }
})

document.getElementById('panels')!.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const corpusButton = target.closest<HTMLElement>('[data-corpus]')
  if (corpusButton) {
    selectCorpus(corpusButton.dataset.corpus ?? CORPORA[0].key)
    return
  }
  if (target.closest('#play-btn')) {
    if (state.isPlaying) {
      stopPlay()
    } else {
      startPlay()
    }
    return
  }
  if (target.closest('#step-btn')) {
    stopPlay()
    if (state.currentMergeCount < state.trainResult.merges.length) {
      state.currentMergeCount += 1
      refreshTrainPanel()
    }
    return
  }
  if (target.closest('#reset-btn')) {
    stopPlay()
    state.currentMergeCount = 0
    refreshTrainPanel()
    return
  }
  if (target.closest('#retrain-btn')) {
    const textarea = document.getElementById('corpus-text') as HTMLTextAreaElement | null
    if (textarea) {
      state.corpusText = textarea.value
      retrainOnCurrentText()
    }
    return
  }
  const wordTab = target.closest<HTMLElement>('[data-word-index]')
  if (wordTab) {
    state.activeWordIndex = +(wordTab.dataset.wordIndex ?? '0')
    state.wordStepIndex = 0
    refreshEncodePanel()
    return
  }
  if (target.closest('#word-prev-btn')) {
    if (state.wordStepIndex > 0) {
      state.wordStepIndex -= 1
      refreshEncodePanel()
    }
    return
  }
  if (target.closest('#word-next-btn')) {
    const trace = state.encodeTraces[state.activeWordIndex]
    if (trace && state.wordStepIndex < trace.steps.length) {
      state.wordStepIndex += 1
      refreshEncodePanel()
    }
    return
  }
  if (target.closest('#word-reset-btn')) {
    state.wordStepIndex = 0
    refreshEncodePanel()
    return
  }
})

document.getElementById('panels')!.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement
  if (target.id === 'merge-slider') {
    stopPlay()
    state.currentMergeCount = +target.value
    refreshTrainPanel()
    return
  }
  if (target.id === 'speed-slider') {
    state.playSpeedMs = +target.value
    if (state.isPlaying) {
      scheduleNextStep()
    }
    return
  }
})

function refreshEncodePanel() {
  renderAll()
}

document.getElementById('prev-btn')!.addEventListener('click', () => {
  if (state.activePanel > 0) {
    showPanel(state.activePanel - 1)
  }
})
document.getElementById('next-btn')!.addEventListener('click', () => {
  if (state.activePanel < STEP_NAMES.length - 1) {
    showPanel(state.activePanel + 1)
  }
})

