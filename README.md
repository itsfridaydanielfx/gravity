# Gravity Warriors App

Static ranking app for GitHub Pages.

## Files
- `index.html` — ranking view
- `zasady.html` — rules / methodology
- `generator.html` — helper page that generates athlete blocks for `athletes.js`
- `styles.css` — shared styles
- `config.js` — scoring config
- `athletes.js` — athlete data
- `scoring.js` — business logic
- `app.js` — ranking UI
- `generator.js` — generator logic

## GitHub Pages setup
1. Upload all files directly into the repo root.
2. In GitHub: Settings → Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/(root)`.
6. Wait for deploy and open the generated link.

## Important
Use relative paths only. Do not start links and asset paths with `/`.
