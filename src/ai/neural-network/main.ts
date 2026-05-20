import '../../shared'
import './style.css'

import { createNetworkScene, type SceneHighlight } from './scene'

const STEP_NAMES = ['Network', 'Neuron', 'Forward Pass', 'Training', 'Uses']
const STEP_HIGHLIGHTS: SceneHighlight[] = [
  'overview',
  'neuron',
  'overview',
  'training',
  'layers',
]
const RUN_LABELS = [
  '▶ Run forward pass',
  '▶ Show a neuron firing',
  '▶ Run forward pass',
  '▶ Run backprop',
  '▶ Run forward pass',
]

let activePanel = 0

const canvas = document.getElementById('nn-canvas') as HTMLCanvasElement
const scene = createNetworkScene(canvas)

const explain = (html: string) =>
  `<div class="alert alert-secondary small mb-3">${html}</div>`
const note = (html: string) =>
  `<div class="note small mb-3"><strong>Heads up:</strong> ${html}</div>`
const sec = (label: string) =>
  `<div class="text-uppercase small text-secondary fw-medium mb-2" style="letter-spacing:.06em">${label}</div>`

function renderStepFlow() {
  const html = STEP_NAMES.map((name, index) => {
    const arrow = index > 0 ? '<span class="step-arrow">→</span>' : ''
    const activeClass = index === activePanel ? ' active' : ''
    return `${arrow}<button class="step-btn${activeClass}" data-panel="${index}" type="button"><span class="step-num">${index + 1}</span><span class="step-label">${name}</span></button>`
  }).join('')
  document.getElementById('steps')!.innerHTML = html
}

function showPanel(panelIndex: number) {
  activePanel = panelIndex
  document.querySelectorAll('.panel').forEach((panel, index) => {
    panel.classList.toggle('active', index === panelIndex)
  })
  document.querySelectorAll('.step-btn').forEach((button, index) => {
    button.classList.toggle('active', index === panelIndex)
  })
  scene.setHighlight(STEP_HIGHLIGHTS[panelIndex])
  const runButton = document.getElementById('run-btn') as HTMLButtonElement
  runButton.textContent = RUN_LABELS[panelIndex]
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

/* ── Panel 1: Network ────────────────────────────────────────── */
function panelNetwork(): string {
  const layers = [
    {
      color: '#4f8cff',
      title: 'Input layer',
      desc: 'The raw numbers you hand the network. Could be pixels of an image, an embedding of a word, a few sensor readings, whatever you have lying around.',
    },
    {
      color: '#8a7dff',
      title: 'Hidden layers',
      desc: 'Where the actual learning lives. Each layer reshapes its input into something more useful. Stack a few of them and the network starts spotting patterns inside patterns.',
    },
    {
      color: '#6ad1ff',
      title: 'More hidden layers',
      desc: 'Modern networks stack dozens, sometimes hundreds of these. "Deep learning" is really just shorthand for "a neural network with a lot of hidden layers".',
    },
    {
      color: '#ff9a55',
      title: 'Output layer',
      desc: 'The answer pops out here. One number per choice for classification, a single value for regression, or a whole vector when you want it to generate something like a next word.',
    },
  ]
  const pills = layers
    .map((layer) => {
      return `<div class="layer-pill">
        <span class="layer-dot" style="background:${layer.color}"></span>
        <div>
          <div class="layer-title">${layer.title}</div>
          <div class="layer-desc">${layer.desc}</div>
        </div>
      </div>`
    })
    .join('')

  return `<div class="panel active" id="p0">
${explain(`A <strong>neural network</strong> is basically a stack of tiny math units called <em>neurons</em>, sitting in layers, with a bunch of weighted connections wired between them. Numbers go in on the left, get reshaped layer by layer, and an answer falls out on the right. Drag the 3D view around to see it from any angle. Hit <em>Run forward pass</em> to watch signals ripple through it.`)}
${note(`The clean grid you see here is a feedforward network, the simplest flavor. Real architectures get weird pretty fast. Convolutional nets share weights for images, recurrent nets loop back on themselves, transformers have attention shortcuts that skip across layers. The core "neurons sitting in layers" idea still holds, just with extra wiring.`)}
${sec('What each layer is for')}
<div class="layer-list">${pills}</div>
${sec('Why depth matters')}
<p class="small text-secondary mb-0">A single layer can only learn a straight-line split between examples. Stack two and you start getting curves. Stack a hundred and the network can tell a cat apart from a muffin in a photo, or guess what word probably comes next in a sentence. Each layer builds on what the one before it figured out.</p>
</div>`
}

/* ── Panel 2: Neuron ─────────────────────────────────────────── */
function panelNeuron(): string {
  const math = `<span class="op">output</span> <span class="op">=</span> <span class="act">activation</span>( <span class="term">w₁·x₁</span> <span class="op">+</span> <span class="term">w₂·x₂</span> <span class="op">+</span> <span class="term">w₃·x₃</span> <span class="op">+</span> <span class="op">…</span> <span class="op">+</span> <span class="bias">bias</span> )`
  const activations = [
    {
      name: 'ReLU',
      desc: 'Negative numbers turn into zero, positives pass right through. Dirt cheap and works way better than it has any right to.',
      svg: `<path d="M0 50 L50 50 L100 5" stroke="currentColor" stroke-width="2" fill="none"/>`,
    },
    {
      name: 'Sigmoid',
      desc: 'Squashes anything to a value between 0 and 1. Handy when you want something that looks like a probability.',
      svg: `<path d="M0 55 C 30 55, 40 5, 100 5" stroke="currentColor" stroke-width="2" fill="none"/>`,
    },
    {
      name: 'Tanh',
      desc: 'Squashes to between -1 and 1. Centered around zero, which tends to make training a bit smoother.',
      svg: `<path d="M0 55 C 30 55, 40 5, 100 5" stroke="currentColor" stroke-width="2" fill="none" transform="translate(0,-5)"/><line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>`,
    },
    {
      name: 'GELU',
      desc: 'A smoothed out ReLU. The default inside most transformers these days, GPT-class models included.',
      svg: `<path d="M0 50 Q 40 55, 55 40 T 100 5" stroke="currentColor" stroke-width="2" fill="none"/>`,
    },
  ]
  const activationCards = activations
    .map((act) => {
      return `<div class="activation-card">
        <div class="activation-name">${act.name}</div>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none">${act.svg}</svg>
        <div class="activation-desc">${act.desc}</div>
      </div>`
    })
    .join('')

  return `<div class="panel" id="p1">
${explain(`A <strong>single neuron</strong> has a really small job. It grabs every incoming signal, multiplies each one by its own learned <em>weight</em>, adds them all up together with a constant called the <em>bias</em>, and then runs the result through an <em>activation function</em> that bends the line a bit. That little bend is what keeps the whole network from collapsing into one big linear equation. The bright neuron in the middle of the 3D view has every incoming connection lit up. Those are all the weights it owns.`)}
${note(`Calling them "neurons" is a bit of a historical accident from back when AI researchers thought they were copying brain cells. They really aren't. A modern neural network is closer to a big stack of well tuned matrix multiplications than to anything biological. The name just stuck because it sounded cool.`)}
${sec('What the math actually says')}
<div class="neuron-card">
  <div class="neuron-math">${math}</div>
  <p class="small text-secondary mb-0">Every <span style="color:var(--bs-primary)">w</span> is a learned weight, one per incoming connection. The <span class="bias">bias</span> shifts the result up or down. The <span class="act">activation</span> is what bends the line. Training is basically just nudging every weight and bias around until the outputs come out the way you want.</p>
</div>
${sec('Common activation functions')}
<p class="small text-secondary mb-2">Without a nonlinear activation, no matter how deep your network is, it collapses into a single straight line transformation. Picking the activation is one of the cheapest knobs you have and it ends up mattering a lot more than you'd expect.</p>
<div class="activation-grid">${activationCards}</div>
</div>`
}

/* ── Panel 3: Forward Pass ───────────────────────────────────── */
function panelForwardPass(): string {
  return `<div class="panel" id="p2">
${explain(`A <strong>forward pass</strong> is what happens any time you ask a trained model to do something. Numbers go in at the input, every neuron in the next layer fires based on what came before, then the layer after that fires, and on it goes until a prediction falls out at the end. No learning is happening here, no weights are changing. It's just plain execution, the same fixed math every time. Hit <em>Run forward pass</em> to watch a wave of activations sweep across.`)}
${note(`When you chat with an AI assistant, every token of its reply is one forward pass through a transformer with billions of weights. Multiply that by the number of tokens in your whole conversation and you start to see why inference gets expensive. The trip looks instant in this demo because there are only 32 neurons in the thing, not billions of parameters.`)}
${sec('What you are seeing')}
<ul class="small text-secondary mb-3" style="padding-left: 1.2rem; line-height:1.6">
  <li><strong>Pulses leaving each neuron</strong> are the weighted signals heading toward every neuron in the next layer.</li>
  <li><strong>Neurons flashing on arrival</strong> means they finished summing their inputs, added their bias, and applied their activation.</li>
  <li><strong>The wave reaching the right edge</strong> is the network's final prediction, done entirely with linear algebra under the hood.</li>
</ul>
${sec('Speed and scale')}
<p class="small text-secondary mb-0">A forward pass is mostly matrix multiplications, which happens to be exactly the kind of thing GPUs were built for. Modern accelerators can chew through trillions of these multiply adds a second. That's the whole reason "just make the model bigger" has been a working strategy for a decade. The hardware kept up.</p>
</div>`
}

/* ── Panel 4: Training ───────────────────────────────────────── */
function panelTraining(): string {
  return `<div class="panel" id="p3">
${explain(`<strong>Training</strong> is the part where the network actually learns something. You show it an example, let it take a guess, measure how wrong the guess was, and then nudge every single weight a tiny bit in the direction that would have made the guess less wrong. Do that millions of times over millions of examples and the weights eventually settle into a configuration that's actually useful. Press <em>Run backprop</em> to see error flow backwards through the network in red.`)}
${note(`Training a frontier model is a multi month, multi million dollar effort running on clusters of thousands of GPUs. Once the weights are locked in, those same weights then power every conversation you ever have with the thing. Train once, use forever. Or at least until the next version ships.`)}
${sec('The training loop')}
<ol class="train-steps">
  <li><strong>Forward pass.</strong> Feed in an example and let the network produce a prediction.</li>
  <li><strong>Compute the loss.</strong> Compare the prediction to the correct answer and boil it down to one number that says how bad it was. Lower is better.</li>
  <li><strong>Backpropagation.</strong> Work backwards through the network and figure out, for every weight, how much it contributed to the error. That info is called a gradient.</li>
  <li><strong>Update weights.</strong> Nudge every weight a tiny step in the direction that would shrink the loss a little. This step is called gradient descent.</li>
  <li><strong>Repeat.</strong> Do this for every example, over and over. The training set gets passed through the network many times until the loss flattens out.</li>
</ol>
${sec('Why it works')}
<p class="small text-secondary mb-0">Each weight ends up playing a tiny role in the bigger pattern. Some learn to detect edges in images, some learn to track what a pronoun refers to, some end up doing something nobody really has a clean name for. Add up billions of these little adjustments and you get a model that can write, draw, translate, or diagnose. Nobody hand codes the rules. They just fall out of the optimization.</p>
</div>`
}

/* ── Panel 5: Uses ───────────────────────────────────────────── */
function panelUses(): string {
  const uses = [
    {
      icon: '👁',
      title: 'Computer vision',
      desc: 'Spot objects in photos, segment medical scans, drive cars, catch defects on a factory line.',
      examples: 'ResNet, YOLO, Segment Anything',
    },
    {
      icon: '💬',
      title: 'Language',
      desc: 'Translate, summarize, answer questions, write code, hold a conversation. Transformers eat language for breakfast.',
      examples: 'GPT, Claude, Gemini, LLaMA',
    },
    {
      icon: '🎨',
      title: 'Generative media',
      desc: 'Turn a text prompt into images, video, music, or 3D models. Diffusion models and GANs are the heavy hitters here.',
      examples: 'Stable Diffusion, Midjourney, Sora',
    },
    {
      icon: '🔊',
      title: 'Speech',
      desc: 'Transcribe audio to text, clone voices, generate natural sounding speech, pull one speaker out of a noisy crowd.',
      examples: 'Whisper, ElevenLabs, Tortoise',
    },
    {
      icon: '🧬',
      title: 'Science',
      desc: 'Predict protein structures, simulate materials, model the climate, hunt for new drugs. Networks shine when the patterns are buried in messy data.',
      examples: 'AlphaFold, GraphCast, MatterGen',
    },
    {
      icon: '🎮',
      title: 'Decision making',
      desc: 'Play games at superhuman level, route packages, schedule warehouses, control robots. Often paired with reinforcement learning.',
      examples: 'AlphaGo, MuZero, robotics policies',
    },
    {
      icon: '🛒',
      title: 'Recommendations',
      desc: 'Pick the next video, the next song, the next product. The quiet workhorse behind most apps you open every day.',
      examples: 'YouTube, TikTok, Amazon',
    },
    {
      icon: '🔍',
      title: 'Anomaly detection',
      desc: 'Spot fraud in transactions, intrusions in network traffic, faults in machines before they break. Find the stuff that doesn\'t fit.',
      examples: 'Banking fraud, cybersec, predictive maintenance',
    },
  ]
  const cards = uses
    .map((use) => {
      return `<div class="use-card">
        <div class="use-icon">${use.icon}</div>
        <div class="use-title">${use.title}</div>
        <div class="use-desc">${use.desc}</div>
        <div class="use-examples">e.g. ${use.examples}</div>
      </div>`
    })
    .join('')

  return `<div class="panel" id="p4">
${explain(`The same basic idea, neurons in layers, gets bent into all sorts of shapes to solve wildly different problems. Vision, language, biology, robotics, recommendations. Once you can fit a network to pretty much any function, the real question becomes: what data, and what loss?`)}
${note(`Architecture matters. A vanilla feedforward net like the one in the 3D view above is not what runs ChatGPT. That's a transformer with attention. Vision systems use convolutions to share weights across image patches. The neuron is the atom. The architecture is what you build out of those atoms for each kind of problem.`)}
${sec('Where you bump into neural nets')}
<div class="uses-grid">${cards}</div>
${sec('Same idea, different scale')}
<p class="small text-secondary mb-0">The 3D network here has 32 neurons and a few hundred connections. A frontier language model has hundreds of billions of parameters and runs on clusters of accelerators that cost more than a city block. The math is the same either way. Scale and training data do all the heavy lifting.</p>
</div>`
}

function renderAll() {
  renderStepFlow()
  document.getElementById('panels')!.innerHTML = `
${panelNetwork()}
${panelNeuron()}
${panelForwardPass()}
${panelTraining()}
${panelUses()}
`
}

renderAll()
showPanel(0)

document.getElementById('steps')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-panel]')
  if (button) {
    showPanel(+(button.dataset.panel ?? '0'))
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

document.getElementById('run-btn')!.addEventListener('click', () => {
  scene.runForwardPass()
})
