# Liliw Tourism — Technical Specifications
## Tech Stack

---

## Frontend

| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |

---

## Backend

| Category | Technology |
|---|---|
| CMS / API | Strapi v4 (Headless CMS, REST API) |
| Runtime | Node.js |
| Database (Production) | PostgreSQL via Supabase |
| Database (Local Dev) | SQLite |
| File Storage | Cloudinary |

---

## Immersive / 3D Technology

**WebXR** (Web Extended Reality) — W3C web standard that enables browser-based immersive VR and AR experiences without plugins.

| Library | Role |
|---|---|
| `@react-three/xr` | WebXR session management (VR/AR headset entry) |
| `@react-three/fiber` | React renderer for WebGL/Three.js scenes |
| `@react-three/drei` | Helpers — Html hotspots, controls, distance factor |
| `three.js` | Low-level 3D engine that WebXR runs on top of |

> The system provides 360° panoramic virtual tours with full VR headset support on compatible devices, powered by the WebXR standard.

---

## AI & External Services

| Service | Purpose |
|---|---|
| Groq API (LLaMA 3.3 70B) | AI-powered itinerary generation |
| Cloudinary | Image upload, storage, and transformation |
| Supabase | Managed PostgreSQL database (production) |
| Algolia | Full-text search indexing |

---

## Deployment & Infrastructure

| Component | Platform |
|---|---|
| Frontend Hosting | Vercel (auto-deploy from GitHub) |
| Backend Hosting | Render |
| Version Control | Git / GitHub |
| Package Manager | npm |

- **Frontend repo:** `TyrCoder/liliw-frontend`
- **Backend repo:** `TyrCoder/liliw-strapi-backend`

---

## Key Frontend Libraries

| Library | Purpose |
|---|---|
| `lucide-react` | Icon set |
| `framer-motion` | Page and component animations |
| `qrcode.react` | QR code generation |
| `groq-sdk` | Groq AI API client |
| `@react-three/xr` | WebXR immersive experiences |

---

## Progressive Web App (PWA)

- Custom Service Worker (`sw.js`) for offline caching
- Web App Manifest for installability
- Install prompt banner for mobile and desktop users
