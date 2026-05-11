# Explore AI 🗺️

Discover hidden gems and amazing lesser-known places across all 50 US states, powered by Claude AI and interactive Leaflet maps.

## Features

- **50 States** with emoji cards on the landing page, searchable and filterable
- **Multi-region loading** — each state is split into 2–8 regions (California has 8), fetching 25 places per region with a live "Loading 2 of 8 regions…" counter
- **Interactive Leaflet map** with colored pins per category (Nature, History, Food, Adventure, Art)
- **Global search** — searches state names and any cached places from previously visited states
- **Find Places Near Me** — uses browser geolocation to auto-detect your state and sort places by distance
- **Detail cards** — Unsplash photo (800×500), description, local tip, GPS coordinates, Google Maps navigation
- **Dark / Light mode** with localStorage persistence (sun/moon toggle)
- **Mobile responsive** — sidebar slides up as a bottom drawer on phones, swipe-down to close, 3-column state grid

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

# 3. Start dev server
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

> **Note:** The `VITE_` prefix exposes the variable to the browser bundle. This is intentional for this demo app — for production, proxy API calls through a backend.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add `VITE_ANTHROPIC_API_KEY` with your key
4. Click **Deploy**

The included `vercel.json` handles SPA routing so deep links work correctly.

## Tech Stack

- **React 19** + **Vite 8**
- **Leaflet 1.9** (loaded from CDN, dark CARTO tiles)
- **Claude claude-sonnet-4-6** via Anthropic API (direct browser access)
- **Unsplash Source API** for place photos
- **Nominatim** (OpenStreetMap) for reverse geocoding

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```
