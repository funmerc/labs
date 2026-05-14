import 'bootstrap/dist/css/bootstrap.min.css'
import './shared.css'

/* Parent pages embedding this in an iframe can sync the theme via
 * postMessage({ theme: 'dark' | 'light' | 'auto' }). 'auto' clears the
 * override and falls back to the OS preference. */

const darkModeQuery = matchMedia('(prefers-color-scheme: dark)')
let themeOverride: 'dark' | 'light' | null = null

function applyTheme() {
  let theme: 'dark' | 'light'
  if (themeOverride) {
    theme = themeOverride
  } else if (darkModeQuery.matches) {
    theme = 'dark'
  } else {
    theme = 'light'
  }
  document.documentElement.setAttribute('data-bs-theme', theme)
}

applyTheme()
darkModeQuery.addEventListener('change', applyTheme)

window.addEventListener('message', (event) => {
  const theme = event.data?.theme
  if (theme === 'dark' || theme === 'light') {
    themeOverride = theme
    applyTheme()
  } else if (theme === 'auto') {
    themeOverride = null
    applyTheme()
  }
})
