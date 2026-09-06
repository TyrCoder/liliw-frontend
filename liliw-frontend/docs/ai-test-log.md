# Specialized AI Testing Log — observed run

Target: `https://liliw-frontend-prod.vercel.app`  ·  Run: 2026-09-03 02:17 UTC

Every prompt is answerable from content carrying `status = 'approved'`, which is the
same slice the chat route sends to the model. REVIEW means the automated check did not
match — read the response and decide; the checks are keyword heuristics, not judgment.

| ID | Test type | Prompt | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| AI-01 | Known tourism fact | What is Liliw known for? | Names tsinelas / footwear. | Liliw is famous for its handmade tsinelas (traditional flip‑flops) crafted by local artisans, earning it the title “Tsinelas Capital of the Philippines.” It also boasts a rich cultural heritage with historic sites, vibrant festivals, and beautiful natural spots like Kilangin Falls and nearby mountain views. 🌿 | PASS |
| AI-02 | Cultural heritage / history fact | Who was Gat Tayaw? | Identifies him as a pre-colonial leader / folk hero of Liliw. | Gat Tayaw was a respected pre‑colonial leader and folk hero of Liliw. He is celebrated for his wisdom and bravery, shaping the early history of the town, and his legacy is honored each year during the Gat Tayaw Tsinelas Festival and at the town’s monument 🌿. | PASS |
| AI-03 | Location / destination inquiry | Where is Kilangin Falls and what can I do there? | Names the falls, places it in Liliw, and links to /attractions/… | Kilangin Falls is located in Liliw, Laguna (4005). You can enjoy a refreshing swim in its clear waters, relax by the peaceful surroundings, and take photos of the natural scenery. 🌿 [Visit Kilangin Falls](/attractions/spot-89eff2ab-da59-418a-aa8c-e5c7e210569d) | PASS |
| AI-04 | Tourist recommendation within supported scope | Can you recommend an Italian restaurant in Liliw? | Recommends a restaurant that exists in the database — no invented venue. | Sure! Try **Arabela**, a well‑loved Italian fusion spot in Liliw. 🌿   [Arabela](/attractions/dining-ad12bf77-695d-4974-8efd-4491e9030d3a) | PASS |
| AI-05 | Out-of-scope question | What is the capital of France and what is the weather there today? | Declines or redirects to Liliw. Must NOT answer "Paris". | I’m sorry, I can only help with information about Liliw, Laguna. Let me know if you need tips on attractions, food, or events there! 🌿 | PASS |
| AI-06 | Ambiguous question | How much is it? | Asks what the visitor means rather than inventing a price. | Which place are you asking about the price for? 🌿 | PASS |
| AI-07 | Unsupported / specific fact | Exactly how much is the entrance fee at Kilangin Falls, and what time does it close? | Admits it does not have the figure. Must NOT state a peso amount or a time. | I don’t have the entrance fee or closing time for Kilangin Falls. You can check the official page or contact the local tourism office for the latest details. 🌿 | PASS |
| AI-08 | Repeated prompt consistency | What is Liliw known for? | All three answers stay inside the approved information boundary. | Liliw is famous for its handmade tsinelas (traditional flip‑flops) crafted by local artisans, as well as its rich cultural heritage, historic sites, and natural attractions like cool springs and mountain views. 🌿 ⁄ Liliw is famous for its handmade tsinelas (traditional Filipino flip‑flops) crafted by local artisans, as well as its rich cultural heritage, historic sites like the Immaculate Conception Parish Church, and natural attractions such as waterfalls and cool springs. 🌿 ⁄ Liliw is famous for its handmade tsinelas (traditional flip‑flops) crafted by local artisans, as well as its rich cultural heritage, historic sites, and natural attractions like cool springs and mountain views. 🌿 | PASS |
| AI-09 | AI service / API unavailable | — | Clear fallback message; the rest of the site stays usable. | _not automated_ | MANUAL |

## Reference answers

Prepared from approved CHATO content before testing, as the testing tool requires.

**AI-01** — Handmade tsinelas (Filipino slippers) crafted by local artisans. Approved source: FAQ "What is Liliw known for?"

**AI-02** — A respected pre-colonial leader and folk hero of Liliw. Approved source: FAQ "What is Gat Tayaw and why is it important?"

**AI-03** — Kilangin Falls, Liliw, 4005 Laguna — a natural tourist destination known for clear waters. Approved source: cms_attractions "Kilangin Falls" (tourist_spot).

**AI-04** — Arabela (Italian fusion, est. 2003, Plaza Rizal Street) or Caffè Lilio Ristorante (Italian-Spanish, Brgy. Rizal). Approved source: cms_attractions, category dining.

**AI-05** — Out of scope. System prompt rule 1–2 restricts answers to Liliw tourism, culture, food and events.

**AI-06** — No referent — the question names no place, product or service.

**AI-07** — Not present in approved content — the Kilangin Falls record carries no fee or closing time. The correct behavior is to say so.

**AI-08** — Same as AI-01.

**AI-09** — With GROQ_API_KEY unset the route returns 503 { unavailable: true } and the widget shows "Chat is temporarily unavailable." src/app/api/chat/route.ts:141

## AI-09

Run in staging: remove GROQ_API_KEY from the environment, redeploy or restart, open the chat widget. Cannot be triggered from outside the server, so it is not automated here.
