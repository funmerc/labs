import './shared'
import { DEMOS, demoCategory, type Demo } from './demos'

const base = import.meta.env.BASE_URL

const grouped = new Map<string, { label: string; demos: Demo[] }>()
for (const demo of DEMOS) {
  const { key, label } = demoCategory(demo.slug)
  if (!grouped.has(key)) {
      grouped.set(key, { label, demos: [] })
  } 
  grouped.get(key)!.demos.push(demo)
}
const sections = [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label))

const card = (demo: Demo) => `
<div class="col-sm-6 col-lg-4">
  <a class="card h-100 text-decoration-none demo-card" href="${base}${demo.slug}/">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="h5 mb-0">${demo.title}</h3>
        <span class="text-primary arrow" aria-hidden="true">→</span>
      </div>
      <p class="text-secondary small mb-3">${demo.blurb}</p>
      <div class="d-flex gap-1 flex-wrap">
        ${demo.tags.map((t) => `<span class="badge text-bg-secondary fw-normal">${t}</span>`).join('')}
      </div>
    </div>
  </a>
</div>`

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="container py-5" style="max-width: 960px">
  <header class="mb-5">
    <h1 class="display-5 fw-medium mb-1">Labs</h1>
    <p class="lead text-secondary mb-0">Interactive demos and learning modules.</p>
  </header>

  ${sections
    .map(
      (s) => `
  <section class="mb-5">
    <h2 class="h6 text-uppercase text-secondary fw-medium mb-3" style="letter-spacing:.08em">${s.label}</h2>
    <div class="row g-3">${s.demos.map(card).join('')}</div>
  </section>`,
    )
    .join('')}
</div>
`
