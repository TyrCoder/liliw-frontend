# 3.10 System Architecture

*Liliw Virtual Guide — an AI-driven tourism platform for the Liliw Culture, History, Arts and Tourism Office (CHATO), Liliw, Laguna.*

> Every figure in this chapter is taken from the working system rather than from a plan.
> Counts were produced by inventorying the repository on 9 September 2026.

---

## 3.10 Overview

The Liliw Virtual Guide is a **Progressive Web Application (PWA)** built on a single
full-stack framework. Rather than separating a browser client from a standalone API
server, the system uses Next.js App Router, in which page rendering and server
endpoints are deployed together as one application. This removes an entire class of
version-mismatch problems between front end and back end, at the cost of tying both to
one runtime.

The architecture has four tiers:

| Tier | Responsibility | Realised as |
|---|---|---|
| **Presentation** | Pages, components, offline shell | 31 routed pages, 65 React components, service worker |
| **Application** | Business rules, authorisation, orchestration | 100 server endpoints, 43 shared modules |
| **Data** | Persistence, row-level security | PostgreSQL (Supabase), 39 tables, 30 migrations |
| **External services** | Capabilities not built in-house | AI inference, mapping, media, e-mail |

**How the architecture meets the requirements.** The *functional* requirements — content
management with review, business self-service, visitor engagement, AI planning and an
AI assistant — map onto the module groups in §3.10.2, each owning its own endpoints and
tables. The *non-functional* requirements are addressed structurally rather than
incidentally:

- **Security** — authorisation is enforced in the server endpoints, not in the interface.
  A hidden button is not a control; every mutating endpoint independently re-checks the
  caller's role. PostgreSQL row-level security is enabled as a second barrier.
- **Availability** — the service worker precaches the application shell and the content
  endpoints, so a visitor with an intermittent connection keeps a usable site.
- **Maintainability** — schema changes are versioned as numbered migrations, and shared
  rules (password policy, narration keys, content validation) live in single modules so
  two parts of the system cannot disagree about them.
- **Performance** — content responses are cached at the edge and in-process; heavy assets
  (the 3D model, the panoramas) are loaded only on the pages that use them.

---

## 3.10.1 Hardware and Software Requirements

### A. Development

| Resource | Specification |
|---|---|
| Development machine | HP ProBook 450 G3 — Intel Core i-series, 8 GB RAM, 256 GB SSD *(confirm against your unit)* |
| Operating system | Linux (Ubuntu-based), kernel 7.0 |
| Runtime | Node.js 20 LTS or newer |
| Package manager | npm |
| Editor | Visual Studio Code |
| Version control | Git, hosted on GitHub |
| Browser for testing | Firefox and a Chromium browser; one Android handset for PWA and camera testing |

### B. Deployment (production)

| Resource | Specification |
|---|---|
| Application hosting | Vercel — serverless functions, global edge network, automatic HTTPS |
| Database hosting | Supabase — managed PostgreSQL with row-level security |
| Media hosting | Cloudinary — images and the hero video |
| Build requirement | Node.js 20+, ~1 GB build memory |
| Domain | `visitliliw.vercel.app` |

No physical server is provisioned or maintained by the office. This is a deliberate
choice: a municipal tourism office has no systems administrator, and an architecture
requiring one would stop working the moment the project ended.

### C. End users

| Resource | Minimum |
|---|---|
| Device | Any smartphone, tablet, laptop or desktop from roughly 2018 onward |
| Browser | Chrome, Edge, Firefox or Safari, current version |
| Connection | 3G or better; previously visited pages remain available offline |
| Permissions | Camera (QR check-in only), location (proximity features only) — both optional |
| Installation | None. The PWA may be added to the home screen but is not required to be |

The interface degrades rather than fails: the 3D storyteller falls back to a flat
illustration where WebGL is unavailable, and browsers that refuse local storage lose
remembered preferences rather than the site itself.

---

## 3.10.2 System Components and Modules

The system comprises **eight functional modules**. Each owns its endpoints and its
tables; they meet only through the database and a small set of shared libraries.

### 1. Public Tourism Portal
Attractions, dining, heritage sites, artisans, art forms, gallery, news and events.
*Functions:* browse and filter listings, view detail pages with photographs, ratings and
map location; site-wide search across every content type.

### 2. Content Management System (CMS)
*Functions:* create, edit, submit, approve, reject, archive and restore content across
eight content types. Enforces a **separation of duties**: an Editor may write but not
publish; an Officer may publish but not write. Rejection requires written remarks. Every
action is written to an audit log with actor and role.

### 3. Local Business Owner (LBO) Portal
*Functions:* business application and approval; a dashboard showing the business record
and its public listing; change requests routed to CHATO for review; monthly visitor
records; a printable QR check-in poster; and 360° virtual tour requests.

### 4. Visitor Engagement
*Functions:* QR check-in at attractions, points, achievements, a rewards catalogue with
redemption, reviews gated on a credited visit, favourites and saved trips.

### 5. AI Services
*Functions:* **Lilio**, a conversational assistant answering questions about Liliw and
about the site itself, and an **itinerary planner** that generates a day plan from a
visitor's stated interests and available time. Both run on hosted inference; the
assistant answers from retrieved site content rather than from model memory alone.

### 6. Itinerary and Mapping
*Functions:* five curated themed tours and AI-generated plans; an interactive map;
road-accurate routing between stops; and a checklist that ticks off stops as the visitor
is credited with visiting them.

### 7. Immersive Media
*Functions:* 360° virtual tours with hotspot navigation, and a rigged 3D storyteller
(Gat Tayaw) with bilingual audio narration on the stories pages.

### 8. Administration and Analytics
*Functions:* user management and deactivation, staff account creation, a unified inbox
for submissions and enquiries, approval queues, page-view and live-session analytics,
and exportable reports.

### Shared libraries

Cross-cutting rules are centralised so that two parts of the system cannot disagree:

| Module | Responsibility |
|---|---|
| `lib/credentials` | Password policy and username rules, used by the form *and* the endpoint |
| `lib/cms-auth`, `lib/lbo-auth`, `lib/auth` | Role resolution for staff, business owners and visitors |
| `lib/session`, `lib/verifyToken` | Signed session cookie and bearer-token verification |
| `lib/cms-validate` | Content validation, including nonsense-text detection |
| `lib/content` | Approved-content reads with an in-process cache |
| `lib/safeStorage` | Browser storage that tolerates refusal (private browsing) |
| `lib/narrations` | The narration catalogue shared by the CMS and the story pages |
| `lib/siteUrl` | The deployment's own address, derived rather than configured |

---

## 3.10.3 Database Structure

PostgreSQL on Supabase. **39 tables**, evolved through **30 numbered migrations** kept in
the repository, so the schema's history is reproducible rather than remembered.

### Table groups

| Group | Tables |
|---|---|
| **Identity** | `profiles`, `tourist_profiles`, `avatars` |
| **Content** | `cms_attractions`, `cms_events`, `cms_news`, `cms_stories`, `cms_artisans`, `cms_art_forms`, `cms_faqs`, `cms_itineraries`, `cms_community_events`, `cms_media` |
| **Business** | `lbo_applications`, `lbo_change_requests`, `lbo_attraction_requests`, `lbo_visitor_records` |
| **Engagement** | `user_points`, `achievements`, `user_achievements`, `rewards`, `reward_redemptions`, `attraction_visit_checkins`, `reviews`, `external_reviews`, `saved_favorites`, `saved_itineraries` |
| **Participation** | `community_event_signups`, `event_forms`, `event_form_responses`, `event_signups`, `participation_requests`, `community_submissions`, `submissions`, `newsletter_subscribers` |
| **Operations** | `audit_logs`, `page_views`, `active_sessions`, `inbox_state`, `inbox_replies` |

### Design decisions worth defending

**A single content lifecycle.** Every content type carries the same status column —
`draft → pending → approved`, with `rejected` and `archived` — so one review workflow
serves all eight types instead of eight workflows drifting apart.

**Media as rows, not columns.** `cms_media` records each file against a `content_type`
and `content_id`, so any content type gains a gallery without a schema change. This is
also what allows the public gallery to link every photograph back to the entry it was
uploaded for.

**Points as an append-only ledger.** `user_points` records each award as a row rather
than maintaining a running total, so a visitor's score can always be recomputed and
audited. It is the same record that gates reviews, which is why a review cannot be left
for a place the visitor has not been credited with visiting.

**Row-level security.** RLS is enabled on the tables holding personal and business data.
Server endpoints use the service role deliberately and only after checking the caller's
role themselves; the browser client uses the anonymous key and is bound by RLS.

**Referential integrity.** Foreign keys tie dependent rows to their owners, and content
that is archived is retained rather than deleted so that points, reviews and check-ins
referring to it remain meaningful.

---

## 3.10.4 User Interface Design

**31 routed pages** built from **65 components**, in a single visual system: a deep navy
and gold palette drawn from Liliw's civic identity, a shared page banner carrying the
church-and-slippers heritage artwork, and one container width for grids and a narrower
one for reading.

### Principal interfaces

| Interface | Audience | Key elements |
|---|---|---|
| **Home** | Public | Full-bleed video hero, category shortcuts, featured attractions, events |
| **Listing pages** | Public | Filterable card grids with pagination |
| **Detail pages** | Public | Gallery, description, map, ratings and reviews, QR check-in, sharing |
| **Stories** | Public | One-at-a-time slideshow with the 3D storyteller walking the rail |
| **Itineraries** | Visitors | AI planner, curated tours, saved trips, map and progress checklist |
| **Interactive map** | Public | Clustered markers, category filters, routing |
| **Scanner** | Visitors | Camera QR capture with proximity confirmation |
| **Profile** | Visitors | Points, achievements, favourites, saved trips, business details |
| **CMS** | Editors, Officers | Tabbed content management with the review queue |
| **Admin panel** | Admin, Officers | Dashboard, user management, approvals, inbox, reports |
| **LBO dashboard** | Business owners | Business details, listing, change requests, visitor records, QR poster |

### Interaction principles applied

- **Progressive disclosure** — reviewing tools appear only for the roles that hold them.
- **Immediate, specific feedback** — a rejection states its reason; a failed save says
  what failed. Loading states are distinguished from empty ones, so "nothing here yet"
  is never shown while a request is still running.
- **Absence made visible** — a field with no value reads "Not submitted yet" with a way
  to supply it, rather than vanishing from the page.
- **Accessibility** — semantic landmarks, keyboard operation for carousels and dialogs,
  visible focus, labelled controls, and colour contrast meeting WCAG AA.
- **Responsive** — mobile-first, single breakpointed system from 360 px upward.
- **Bilingual content** — English and Filipino narration for the storyteller.

---

## 3.10.5 System Communication and Interaction

### Request flow

```
Visitor's browser
      │  HTTPS
      ▼
Vercel edge  ──►  Next.js application (rendering + 100 API endpoints)
                        │
      ┌─────────────────┼─────────────────┬──────────────┐
      ▼                 ▼                 ▼              ▼
 Supabase          Groq (AI)         Mapbox        Cloudinary
 PostgreSQL      chat + planner    geocoding,        media
 + Auth + RLS                       routing
                                          │
                                     Gmail SMTP
                                   (notifications)
```

### Communication mechanisms

| Mechanism | Where used |
|---|---|
| **HTTPS / REST (JSON)** | Every browser-to-server and server-to-service call |
| **Signed HttpOnly cookie** | Staff session, carrying role; not readable by scripts |
| **Bearer token** | Visitor requests authenticated against Supabase Auth |
| **Service worker** | Offline shell, cached content, update notification |
| **Polling** | Live visitor count on the admin dashboard, every 10 seconds |
| **SMTP** | One-time codes, password reset, staff notifications |

### Authentication and authorisation

Four roles: **Visitor**, **LBO (business owner)**, **CHATO Editor**, **CHATO Officer**,
and **Administrator**. Authorisation is checked **in the endpoint**, never only in the
interface — the CMS routes independently resolve the caller's role on every mutating
request, so a hidden button and a forbidden action are not the same thing.

### Inter-module interaction — worked example

*A visitor checks in at an attraction:*

1. The visitor scans the printed QR code, opening the attraction page with a scan token.
2. `/api/attractions/visit/checkin` verifies the bearer token, then confirms the device
   is within the configured proximity of the attraction's coordinates.
3. A row is appended to `attraction_visit_checkins` and an award row to `user_points`.
4. Achievement thresholds are evaluated; any newly earned achievement is recorded and
   returned so the interface can announce it.
5. The review form on that page becomes available, because the same `user_points` row is
   what gates it.
6. The itinerary checklist ticks that stop, because it reads the same record.

One event, one write, and four features respond — because they consult a single source
of truth rather than each keeping their own.

### External service failure

Every outbound dependency has a defined degradation, so that a third party's outage is
a reduced feature and not an error page:

| Service | On failure |
|---|---|
| Groq (AI) | Assistant reports it is unavailable; the rest of the site is unaffected |
| Mapbox routing | Straight-line distance, drawn dashed and labelled as an estimate |
| Cloudinary | Placeholder artwork in the site's own style |
| SMTP | The action still completes; the notification is logged as failed |
| Network (visitor) | Service worker serves the cached shell and last-seen content |

---

# Resources and Technologies

## Programming languages

| Language | Use |
|---|---|
| **TypeScript 5** | The entire application — pages, endpoints, shared modules |
| **SQL (PostgreSQL)** | Schema, constraints, row-level security policies, migrations |
| **CSS** | Tailwind utility classes with a small hand-written layer for the page furniture |

## Frameworks and libraries

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.10 | Full-stack React framework (App Router, Turbopack) |
| `react` / `react-dom` | 19.2.4 | User-interface library |
| `tailwindcss` | 4 | Utility-first styling |
| `@supabase/supabase-js` | 2.105 | Database and authentication client |
| `framer-motion` | 12.38 | Animation and transitions |
| `three` | 0.184 | 3D rendering |
| `@react-three/fiber` | 9.6 | React renderer for three.js |
| `@react-three/drei` | 10.7 | Helpers for loading and animating 3D scenes |
| `mapbox-gl` / `react-map-gl` | 3.20 / 8.1 | Interactive mapping |
| `groq-sdk` | 1.1 | AI inference client |
| `dompurify` | 3.4 | HTML sanitisation for CMS rich text |
| `nodemailer` | 9.0 | Transactional e-mail |
| `lucide-react` | 1.8 | Icon set |
| `sonner` | 2.0 | Toast notifications |

*34 runtime dependencies and 10 development dependencies in total.*

## Databases and storage

| Resource | Use |
|---|---|
| **PostgreSQL** (Supabase) | Primary store — 39 tables, row-level security |
| **Supabase Auth** | Identity, password hashing, session issuance |
| **Cloudinary** | Images and the hero video, with signed uploads |
| **Repository-served assets** | The 3D model and narration audio, versioned with the code |
| **Browser storage** | Per-device preferences only; never a source of truth |

## External services and APIs

| Service | Use |
|---|---|
| **Groq** (`openai/gpt-oss-120b`) | Conversational assistant and itinerary generation |
| **Mapbox** (GL JS, Directions) | Maps and road-accurate routing that respects one-way streets |
| **Cloudinary** | Media hosting and transformation |
| **Gmail SMTP** | One-time codes, password reset, staff notification |
| **Apify** | External review collection |
| **OpenStreetMap Nominatim** | Address lookup |

## Development tools and platforms

| Tool | Use |
|---|---|
| **Visual Studio Code** | Editor |
| **Git / GitHub** | Version control and remote repository |
| **Vercel** | Continuous deployment from `main`; preview builds per commit |
| **Supabase Studio** | Schema management and SQL execution |
| **ESLint 9** | Static analysis |
| **TypeScript compiler** | Type checking as part of every build |
| **Turbopack** | Build and bundling |
| **Chrome DevTools / Lighthouse** | Performance, PWA and accessibility auditing |

## System scale

| Measure | Count |
|---|---|
| Routed pages | 31 |
| Server API endpoints | 100 |
| React components | 65 |
| Shared modules | 43 |
| Database tables | 39 |
| Schema migrations | 30 |
| Content types under review workflow | 8 |
| User roles | 5 |
