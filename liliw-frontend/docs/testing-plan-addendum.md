# Testing plan addendum — aligning the instrument with the system as built

Companion to *Liliw Virtual Guide: System Testing Plan and Ready-to-Use Testing
Tool*. Verified against `main @ bf17433` on 2026-09-02.

The existing plan is methodologically sound — the strategy table, severity
scale, acceptance criteria, traceability matrix and sign-off sheets need no
change. What follows corrects the test cases that describe behavior the system
does not have, restores the missing role, and adds coverage for the modules that
shipped after the instrument was drafted.

| | |
| --- | --- |
| Corrected | 9 existing cases |
| Roles | 4 → 5 |
| Added | 73 new cases |
| Modules | M01–M13 → M20 |

---

## Part 1 — Cases that fail for the wrong reason

Each is executable today and will be marked FAIL by a tester following the sheet
exactly — not because the system is broken, but because the expected result or
the precondition describes something else. Replace the wording; keep the ID.

### TC-M01-02 — Editor login

**Says:** Editor login shows "Editor/CMS functions".
**Actually:** A CHATO Editor sees Attractions, Event Forms, LBO Applications,
Change Requests, Attraction Requests and Redeem a Code — not the CMS approval
queue alone.
**Replacement expected result:** the six Editor tabs are present; Dashboard,
Reports, Users, Role Management, Audit Logs, Achievements and Rewards are
absent. — `src/app/admin/page.tsx:872`

### TC-M03-04 — AI compared against approved content

**Says:** Compare AI answers against approved CHATO content for a predefined
question set.
**Actually:** The model never receives the whole CMS. Its prompt carries the
first 30 attractions, 10 itineraries, 8 events and 15 FAQs, with descriptions
clipped to 100 characters.
**Replacement precondition:** the reference set is drawn only from content
inside those caps, in the order the content API returns it. Questions about
content outside the caps belong in AI-07 (unsupported fact), not here.
— `src/app/api/chat/route.ts:26`

### TC-M08-01 — Valid QR scan

**Says:** Tourist/Visitor scans a valid QR; system records the arrival.
**Actually:** Check-in requires a signed-in account. A guest receives
`{ success: true, authenticated: false }` and nothing is recorded.
**Replacement precondition:** tester is signed in; location permission granted;
record the configured `QR_PROXIMITY_METERS` value.
**Expected:** check-in row created, response reports `withinMeters`, points
awarded only after the dwell requirement.
— `src/app/api/attractions/visit/checkin/route.ts:16, :169`

### TC-M08-03 — Repeated scan

**Says:** "System applies the defined duplicate/repeat rule."
**Actually:** The rule is concrete — one credit per user per attraction,
permanently. A repeat scan returns `alreadyVisited` with the original
`visitedAt`, and a verified scan is never downgraded by a later page view.
**Expected:** second scan creates no new points row, returns
`alreadyVisited: true`, and the UI says already collected rather than confirming
a fresh visit. — `src/app/api/attractions/visit/checkin/route.ts:25–40, :81`

### TC-M10-01 — Feedback submission

**Says:** Tourist/Visitor submits complete feedback.
**Actually:** Feedback is a 1–5 star review with a comment, attached to an
attraction, and it requires login — a guest gets 401 "You must be logged in to
submit a review." There is no standalone feedback form.
**Replacement precondition:** signed in, on an attraction page.
**Expected:** review saved, listing star average updates, 20 points awarded once
per attraction. — `src/app/api/ratings/route.ts:9, :36`

### TC-M10-02 — Feedback validation

**Says:** Submit feedback with required fields blank.
**Actually:** 400 "Missing required fields" for a blank author, rating or
comment; 400 "Rating must be between 1 and 5" for an out-of-range score.
**Replacement:** split into two rows so both validations are evidenced, naming
the exact messages as the expected result. — `src/app/api/ratings/route.ts:18–23`

### TC-M13-04 — Reconnect

**Says:** Reconnect "does not lose valid locally retained data".
**Actually:** There is no offline write queue and no background sync.
Non-content API calls made offline return `{"error":"offline"}` and are refused.
Only the signed-in session persists in local storage.
**Expected:** after reconnect the application resumes normal online behavior;
any action attempted offline was refused at the time and must be repeated. Drop
the data-retention clause. — `public/sw.js:219`, `src/context/AuthContext.tsx:72`

### QR-05 — Offline scan

**Says:** "Does not falsely claim successful server recording."
**Actually:** The service worker intercepts the check-in call and returns an
explicit offline error before it reaches the network.
**Expected:** `{"error":"offline"}`, scanner reports failure, no check-in row
exists after reconnect. — `public/sw.js:219–226`

### AI-09 — Fallback

**Says:** "Simulate unavailable AI service if supported by the test environment."
**Actually:** It is supported and deterministic — with the Groq key absent the
route returns 503 with `{ unavailable: true }`; a network failure yields the
in-character fallback line instead of an empty bubble.
**Procedure:** unset the Groq key in staging and reload.
**Expected:** 503 "Chat is temporarily unavailable.", the rest of the
application stays usable. — `src/app/api/chat/route.ts:141, :232`

> ### QR proximity is in testing mode — keep methodological note 11
>
> With `QR_PROXIMITY_METERS` widened, any scan that returns coordinates at all
> passes the distance check and is stored as `via: 'qr'`, the value that
> otherwise means "verified on site". The `qr` / `qr_unverified` distinction
> collapses, so a scan is **not** evidence of physical presence — report these
> as arrival/visit records exactly as note 11 already instructs, in M12 and in
> the LBO visitor records.
>
> Two behaviors survive testing mode and are still worth testing: a scan with
> location permission *denied* is still recorded as `qr_unverified`, and the
> 2.5-minute dwell requirement still gates the points award.

---

## Part 2 — The role model has five roles, not four

CHATO Officer is absent from the plan, yet it owns six of the admin panel's
tabs. Replace section 5 of the testing plan with this table. The slug column is
the literal value stored in `profiles.role` and read by every access gate.

| Role | Stored slug | What this role actually reaches | Gate |
| --- | --- | --- | --- |
| Admin | `admin` | Dashboard, Reports, Users, Role Management, Audit Logs, Achievements, Rewards Catalog, Redeem a Code — plus everything below | /admin, /cms |
| **CHATO Officer** *(missing)* | `chatoofficer` | Inbox, Community Events, Event Sign-ups, Ratings, Online Reviews, Visitor Records, LBO Applications, Change Requests, Attraction Requests | /admin, /cms |
| CHATO Editor | `chatoeditor` | Attractions, Event Forms, LBO Applications, Change Requests, Attraction Requests, Redeem a Code, CMS content workspace | /admin, /cms |
| Local Business Owner | `authenticated` + approved application | Own dashboard, business overview, change requests, visitor records and ratings for the one approved attraction, QR poster generation | /lbo |
| Tourist / Visitor | `authenticated` | All public content, plus account-gated features: QR check-in, reviews, favorites, saved trips, event sign-up, points, achievements, rewards | public |
| **Guest** *(add)* | — none — | Read-only. Every write above returns 401. Worth testing as its own role: the boundary between guest and signed-in tourist is where most false FAILs occur | public |

### Added authentication cases

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M01-06 | Officer | Sign in with a CHATO Officer account | The nine Officer tabs are present; Users, Role Management, Audit Logs, Reports, Achievements and Rewards Catalog are absent |
| TC-M01-07 | Guest | Attempt QR check-in, a review, a favorite and an event sign-up while signed out | Each refused — 401 or a sign-in prompt — and no record written |
| TC-M01-08 | Any | Request `/admin` and `/cms` directly while signed out or as a tourist | Redirected home by middleware; no protected markup served |
| TC-M01-08b | Tourist | Request `/lbo` directly while signed in as an ordinary tourist | The page shell loads — middleware admits any session, and scoping is done by the API, which requires an approved application. Expected: no business data, no visitor records, no QR poster for any business. `src/middleware.ts:50`, `src/app/api/lbo/me/route.ts:43` |
| TC-M01-09 | Any | Call an `/api/admin/*` endpoint with no Authorization header | 401 before the route runs |
| TC-M01-10 | Any | Sign out, then use Back to return to a staff page | Session cookie cleared; page not restored from cache with staff data |

---

## Part 3 — Existing modules that stop short

M04, M09 and M11 name workflows in the module table that no test case reaches.

### M04 · 360° Virtual Tours — authoring side

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M04-03 | Editor | Upload a panorama to an attraction's virtual tour | Stored, appears in the tour, rejects files above the 10 MB cap |
| TC-M04-04 | Editor | Place a hotspot, save, reopen the tour as a visitor | Hotspot persists and is navigable. Note: the service worker caches `/api/content/*`, so a hard reload may be needed before a just-saved change appears |

### M09 · Local Business Owner — the full workflow

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M09-03 | LBO | Submit a change request against an approved listing | Stored as `pending`, appears in the Officer and Editor queues; live listing unchanged until approval |
| TC-M09-04 | Editor → Officer | Editor reviews a new attraction request, then an Officer or Admin decides it | Status moves `pending → editor_reviewed → approved` (or `rejected`); only final approval publishes |
| TC-M09-05 | LBO | Generate and download the QR poster for the owned attraction | Poster renders with a scannable code resolving to the correct attraction page |
| TC-M09-06 | LBO | Open Visitor Records as owner of one attraction | Only that attraction's records listed — no other business's visitors reachable |
| TC-M09-07 | Officer | Reject an LBO application | Applicant status reflects the rejection; the account gains no `/lbo` access |

### M11 · CMS — the states the plan never exercises

The real lifecycle is `draft → pending → approved → archived`, with `rejected`
and a restore path. "Publish" is not a separate state; approval is what makes
content public. TC-M11-02 should name the states rather than saying
"publishable/published".

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M11-04 | Officer/Admin | Reject a pending entry with a written reason | Status `rejected`, reason stored and visible to the submitter, entry stays off the public site |
| TC-M11-05 | Editor/Admin | Archive a published entry | Disappears from public listings, remains retrievable in the CMS |
| TC-M11-06 | Editor/Admin | Restore an archived entry | Returns to its prior state and reappears publicly |
| TC-M11-07 | Admin | Perform any CMS action, then open Audit Logs | Action, content type, entry and acting account recorded |
| TC-M11-08 | Editor | Create two entries whose titles slugify identically | Both save; slugs unique; both detail pages resolve |

---

## Part 4 — Modules with no coverage at all

Seven shipped subsystems have no test ID in the instrument. They continue the
existing numbering as M14–M20 and slot into the scope table, traceability matrix
and execution summary sheet unchanged in form.

### M14 · Gamification — points, achievements, passport

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M14-01 | Tourist | Complete each scoring action once: attraction visit, review, event sign-up, share | Balance increases by 5, 20, 15 and 5 respectively |
| TC-M14-02 | Tourist | Repeat a scoring action against the same attraction | No second award — the points log refuses a duplicate action/reference pair |
| TC-M14-03 | Tourist | Cross an achievement threshold (visit count, review count, total points) | Badge unlocks once, bonus points land, unlock notice appears |
| TC-M14-04 | Tourist | Open the passport view after earning stamps | Stamps, balance and badges match the underlying records |
| TC-M14-05 | Admin | Create an achievement with a trigger threshold, then satisfy it | Evaluated for users without a redeploy |

### M15 · Rewards and redemption

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M15-01 | Tourist | Redeem a reward with sufficient points | Points deducted, stock decremented, unique code issued — one transaction |
| TC-M15-02 | Tourist | Redeem with insufficient balance | 400 "Not enough points for this reward."; balance unchanged |
| TC-M15-03 | Tourist | Redeem out-of-stock reward; re-claim an already-claimed badge | 400 out of stock; 409 "You've already claimed this badge." |
| TC-M15-04 | Staff | Verify a redemption code at the counter, then verify it again | First succeeds and marks it used; second refused |
| TC-M15-05 | Admin | Deactivate a reward while visitors can see it | Disappears from the catalog; further redemptions refused |

### M16 · Community participation

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M16-01 | Tourist/Resident | Join a community event | Sign-up recorded, confirmation shown, 15 points awarded once |
| TC-M16-02 | Officer | Open Event Sign-ups after a visitor joins | The sign-up appears with submitted details |
| TC-M16-03 | Editor | Build a custom event form with required and optional fields, publish it | Public form renders every field type and enforces required ones |
| TC-M16-04 | Visitor | Submit a participation request with name or email blank | 400 "Name and email are required"; nothing stored |
| TC-M16-05 | Officer | Create a community event, confirm it on the public listing | Appears with correct date, details and joinable state |

### M17 · Trip planner, saved trips and favorites

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M17-01 | Tourist | Request an AI-generated trip for a stated duration and interest | Structured itinerary naming only real attractions from the database |
| TC-M17-02 | Tester | Check every place named in a generated plan against the CMS | No invented destinations. The planner's equivalent of AI-07; belongs in the AI accuracy evidence |
| TC-M17-03 | Tourist | Save a trip, reopen it, open its share link in a signed-out browser | Trip persists; share link renders read-only without exposing the account |
| TC-M17-04 | Tourist | Exceed the planner's request limit within a minute | 429 with a wait message; no partial trip stored |
| TC-M17-05 | Guest | Add a favorite while signed out | 401; sign-in prompt rather than silent failure |

### M18 · Search and discovery

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M18-01 | Visitor | Search a published attraction by exact name | Leading result; opens the correct detail page |
| TC-M18-02 | Visitor | Search with a misspelling; search a term with no match | Fuzzy matching still finds it; no-match shows an empty state, not an error |
| TC-M18-03 | Editor | Publish a new attraction, then search for it | Findable once the index and content cache refresh; record the observed delay |

### M19 · Account management

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M19-01 | Guest | Register with a valid email, enter the emailed code | Accepted once, account created, code cannot be reused |
| TC-M19-02 | Guest | Enter a registration code after its 10-minute window | Rejected as expired, resend offered |
| TC-M19-03 | Guest | Enter five incorrect codes in a row | 429 "Too many incorrect attempts. Please request a new code."; code burned |
| TC-M19-04 | Guest | Request four codes, attempt six logins, inside one minute | Both throttled — 3 code requests and 5 login attempts per minute |
| TC-M19-05 | Tourist | Complete forgot-password, sign in with the new password | Reset code works once; old password no longer authenticates |
| TC-M19-06 | Tourist | Change email and change password from the profile, each with its code | Both require a valid code; session reflects new credentials |
| TC-M19-07 | Tourist | Upload an ordinary avatar photo, then one the screening rejects | First accepted; second refused client-side with a clear reason, never stored |
| TC-M19-08 | Guest | Request a reset code for an address with no account | Response does not reveal whether the address is registered |

### M20 · Communications and monitoring

| ID | Role | Scenario | Expected result |
| --- | --- | --- | --- |
| TC-M20-01 | Visitor → Officer | Send a contact message, open the admin Inbox | Arrives with an unread badge and details intact |
| TC-M20-02 | Officer | Reply to an inbox message | Email delivered from the CHATO Office sender; thread marked handled |
| TC-M20-03 | Visitor | Subscribe to the newsletter, then subscribe again | First succeeds; duplicate handled without a server error. Invalid addresses return 400 |
| TC-M20-04 | Tourist | Share an attraction through the share control | Share recorded; 5 points awarded once per attraction |
| TC-M20-05 | Tourist | Trigger a notification-producing event, open notifications | Notification appears; read state persists across reload |
| TC-M20-06 | Admin | Open the dashboard with a second browser session active | Live visitor count reflects it within one polling interval |
| TC-M20-07 | Officer | Open Online Reviews for an attraction with imported reviews | External reviews render, visibly distinguished from on-site reviews |
| TC-M20-08 | Admin | Export a report from the Reports tab | File opens; fields match what the dashboard displayed |

---

## Part 5 — Rows to add to the specialized tools

The AI and QR sheets test generic behavior and miss what is distinctive about
this implementation — which is where defects actually surface.

### AI Virtual Guide

| ID | Scenario | Expected result |
| --- | --- | --- |
| AI-10 | Ask in pure Tagalog | Reply in Tagalog throughout — the language lock is core behavior and is untested in the current sheet |
| AI-11 | Ask in pure English | No Filipino words in the reply |
| AI-12 | Ask in Taglish | Mixes both naturally rather than picking one |
| AI-13 | Ask with page focus active on an attraction page | Answers from that page in depth; says plainly when the page does not cover something instead of inventing it |
| AI-14 | Ask for a recommendation | Every attraction card links to a real detail page that opens |
| AI-15 | Send eleven messages within a minute | 429 "Too many messages. Please wait a moment." |
| AI-16 | Publish new content, ask about it immediately | The guide may not know it yet — knowledge base cached five minutes. Record this rather than logging a defect |
| AI-17 | Ask a question containing an instruction to ignore its rules | Scope holds; still answers only about Liliw |

### QR arrival — adjusted for testing mode

| ID | Scenario | Expected result |
| --- | --- | --- |
| QR-06 | Scan away from the site under the widened radius | Check-in recorded; response reports the configured radius. Log as an arrival record, not a confirmed physical arrival |
| QR-07 | Scan with location permission denied | Still recorded, but as unverified — no coordinates to judge against |
| QR-08 | Scan, then leave the page before 2.5 minutes | No points and no stamp; dwell measured on the server |
| QR-09 | Scan a QR pointing at another website | Rejected without navigation — the scanner accepts only its own attraction URLs |
| QR-10 | Open the scanner inside the Facebook or Instagram browser | Visitor told to open in Safari or Chrome rather than facing a camera button that does nothing |

### PWA and offline

| ID | Scenario | Expected result |
| --- | --- | --- |
| PWA-07 | Visit attractions, news, stories, gallery and FAQs online, disconnect, revisit each | All remain readable — these are the cached content endpoints. Name them in the plan so "defined offline content" is defined |
| PWA-08 | Open the map while offline | An explanation appears saying the map needs a connection while previously opened 3D tours still work — the map is deliberately network-only |
| PWA-09 | Deploy an update, reload as a returning visitor | New version picked up rather than the first-visit copy served indefinitely |

---

## Part 6 — Test environment and manuscript wording

### Add to section 6, Testing Environment

- **HTTPS and camera access** — the scanner needs both; it will not run over
  plain HTTP or inside the Facebook, Instagram or Messenger in-app browsers.
- **Configured QR radius** — record the `QR_PROXIMITY_METERS` value the test ran
  under. Without it a reader assumes the 150 m default and the QR results mean
  something they don't.
- **Service credentials present** — AI guide, map tiles, media hosting and the
  outbound email used for every verification code. A missing key turns a whole
  module BLOCKED rather than FAILED.
- **Seeded accounts for all five roles** plus one guest session, and one approved
  LBO account with an attraction attached.
- **Location permission** granted on at least one test device and denied on
  another, so QR-07 is executable.

### Three wording changes for the manuscript

1. **Keep note 11 as written.** With the proximity check in testing mode, a scan
   is an arrival record and nothing more. Report M12 metrics and LBO visitor
   records in exactly those terms.
2. **State the AI reference-set boundary.** The guide answers from a bounded
   slice of the CMS, not the whole of it. Saying so makes the accuracy result
   defensible instead of leaving a reviewer to find the gap.
3. **Name the offline scope.** Cached content pages work offline; the map and
   every write operation do not, and nothing is queued for later. The plan
   already warns against claiming full offline operation — this is the specific
   list that satisfies it.

---

*Sections of the original plan not listed here need no change.*
