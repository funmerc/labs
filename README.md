# Labs

A small collection of interactive demos and learning modules. Each demo is its own page, built with Vite and TypeScript, and the site is deployed to GitHub Pages at `/labs/`. Demos are designed to be embedded as iframes inside another site.

## Getting started

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:5174/` (fixed port via `strictPort` so the iframe parent can rely on it).

Build for production with `npm run build`, preview the built output with `npm run preview`.

## Project layout

```
labs/
  index.html                     home page entry
  ai/                            category folder
    transformers/index.html      one demo per folder
    tokenizer/index.html
  src/
    main.ts                      home page renderer
    shared.ts                    bootstrap import, theme handling
    shared.css                   shared styles
    demos.ts                     registry of demos and category labels
    ai/
      transformers/              demo source (multi-module)
        main.ts
        math.ts
        vocab.ts
        ...
      tokenizer/
        main.ts
        bpe.ts
        corpus.ts
        ...
  vite.config.ts                 multi-page entries derived from src/demos.ts
```

Each demo lives in two places:
- `src/<category>/<slug>/` for source modules
- `<category>/<slug>/index.html` for the entry HTML that Vite turns into a page

The home page reads `src/demos.ts` to render the grouped card index.

## Adding a demo

1. Pick a category folder (e.g. `ai`) and a slug (e.g. `tokenizer`).
2. Create the source folder `src/ai/tokenizer/main.ts` (plus any modules you need) and an `style.css` if it has demo-specific styles.
3. Create the entry HTML at `ai/tokenizer/index.html`. It needs a `<script type="module" src="/src/ai/tokenizer/main.ts"></script>`.
4. Add an entry to `src/demos.ts`:

   ```ts
   {
     slug: 'ai/tokenizer',
     title: 'Tokenizer',
     blurb: 'What it does in one sentence.',
     tags: ['ML'],
   }
   ```

5. If this is a new category, add a label to `CATEGORY_LABELS` in `src/demos.ts` so the home page displays it nicely.

Vite picks up the new entry on next dev/build. No config changes needed.

## Embedding and theme sync

Demos are meant to be dropped into an iframe on another site. The parent can sync its theme into the iframe via `postMessage`:

```js
const iframe = document.querySelector('iframe')

iframe.addEventListener('load', () => {
  iframe.contentWindow.postMessage({ theme: currentTheme }, '*')
})

// later, on parent theme change:
iframe.contentWindow.postMessage({ theme: newTheme }, '*')
```

`theme` accepts `'dark'`, `'light'`, or `'auto'`. Sending `'auto'` clears the override and lets the iframe follow the visitor's OS preference. Before any message arrives, the iframe already follows the OS, so nothing breaks if the parent forgets to send.

## Deployment

GitHub Actions builds and deploys on push to `main` via `.github/workflows/deploy.yml`. The deployed base path is `/labs/`, so production URLs look like `https://<user>.github.io/labs/ai/transformers/`.
