# Palladium Frontend

This folder is the static frontend source for Palladium Games.

What lives here:

- HTML pages for the UI
- shared CSS and client-side JavaScript
- static images and favicon assets

What does not live here:

- AI runtime
- game files
- proxy/network runtime
- Monochrome hosting
- Discord bots

Deploy target:

- Host this folder on Netlify, Vercel, GitHub Pages, or any static host
- Point the UI at `https://api.sethpang.com` for backend APIs and hosted game files
- `render.yaml` is included so the `frontend` branch can deploy directly on Render as a static site

Notes:

- `game-player.html` loads game files from the backend origin
- `ai.html`, `proxy.html`, `discord.html`, and `games.html` call backend APIs through `backend.js`
- Local development still works against the monolith on `localhost`
