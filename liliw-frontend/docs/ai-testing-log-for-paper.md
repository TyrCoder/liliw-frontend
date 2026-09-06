# VI. Specialized AI Testing Log — prompts and reference answers

For the manuscript. Each reference answer was prepared from CHATO-approved
content (`status = 'approved'`) **before** testing, as the testing tool
requires. Every prompt is answerable — or deliberately not answerable — from
content the system actually holds.

Observed responses below were recorded against the deployed build. Re-run
`node scripts/test-ai-prompts.mjs` after any change to the guide and replace the
Observed column; the run also records the model, which belongs in the results.

**Test conditions to state alongside the results**

| Item | Value |
| --- | --- |
| Endpoint | `POST /api/chat` on the deployed build |
| Model | as reported by `GET /api/chat` at time of run |
| Language | English prompts (the guide also locks to Tagalog and Taglish) |
| Reference source | `cms_attractions`, `cms_faqs` where `status = 'approved'` |

---

## AI-01 · Known tourism fact

**Prompt:** What is Liliw known for?

**Reference answer (approved content):** Handmade *tsinelas* — Filipino
slippers — crafted by local artisans; the Footwear District is where they are
sold. Source: FAQ *"What is Liliw known for?"*

**Pass criterion:** Names tsinelas or footwear.

---

## AI-02 · Cultural heritage / history fact

**Prompt:** Who was Gat Tayaw?

**Reference answer:** A respected pre-colonial leader and folk hero of Liliw,
celebrated for wisdom and bravery in shaping the municipality's early history;
the Gat Tayaw Festival and Monument honour his legacy. Source: FAQ
*"What is Gat Tayaw and why is it important?"*

**Pass criterion:** Identifies him as a pre-colonial leader or folk hero.
Must not attribute the town's footwear trade to him — that claim appears
nowhere in the approved answer.

---

## AI-03 · Location / destination inquiry

**Prompt:** Where is Kilangin Falls and what can I do there?

**Reference answer:** Kilangin Falls, Liliw, 4005 Laguna — a natural tourist
destination known for its clear waters. Source: `cms_attractions`,
*Kilangin Falls* (tourist spot).

**Pass criterion:** Names the falls, places them in Liliw, and links to the
attraction page.

---

## AI-04 · Tourist recommendation within supported scope

**Prompt:** Can you recommend an Italian restaurant in Liliw?

**Reference answer:** Arabela — Italian fusion, established 2003, Plaza Rizal
Street; or Caffè Lilio Ristorante — Italian-Spanish, Brgy. Rizal. Source:
`cms_attractions`, dining category.

**Pass criterion:** Recommends a restaurant that exists in the database. Any
venue not in the approved content is a failure regardless of how plausible it
sounds.

---

## AI-05 · Out-of-scope question

**Prompt:** What is the capital of France and what is the weather there today?

**Reference answer:** Out of scope. The guide answers only on Liliw tourism,
culture, food and events.

**Pass criterion:** Declines and redirects to Liliw, in the first person. Must
not answer "Paris".

---

## AI-06 · Ambiguous question

**Prompt:** How much is it?

**Reference answer:** No referent — the question names no place, product or
service. This is an *in-scope* question missing information, not an
out-of-scope one.

**Pass criterion:** Asks which place is meant. Treating it as out-of-scope is a
failure, as is inventing a price.

---

## AI-07 · Unsupported / specific fact

**Prompt:** Exactly how much is the entrance fee at Kilangin Falls, and what
time does it close?

**Reference answer:** Not present in approved content — the Kilangin Falls
record carries no entrance fee and no closing time. The correct behaviour is to
say so and point the visitor to the attraction page or the tourism office.

**Pass criterion:** States that it does not have the figure. Any peso amount or
closing time is a failure.

---

## AI-08 · Repeated prompt consistency

**Prompt:** What is Liliw known for? — asked three times under the same
conditions.

**Reference answer:** As AI-01.

**Pass criterion:** All three answers stay within the approved information
boundary. Wording may vary; substance may not.

---

## AI-09 · AI service / API unavailable

**Procedure:** Remove `GROQ_API_KEY` from the staging environment, redeploy or
restart, then open the chat widget. This cannot be induced from outside the
server, so it is executed manually rather than by the test script.

**Expected result:** The endpoint returns HTTP 503 and the widget shows
"Chat is temporarily unavailable." The rest of the application remains usable.

**Pass criterion:** A clear fallback message, and no other feature affected.

---

## Note for the manuscript

Testing this module found four defects, all corrected and retested:

1. **Truncated answers.** The token budget was shared with the model's internal
   reasoning, so answers to harder questions were cut mid-sentence.
2. **A parroted refusal.** The out-of-scope instruction was written as a line to
   repeat, and the model repeated it verbatim in the second person.
3. **Ambiguity treated as out-of-scope.** A vague but in-scope question received
   the out-of-scope reply instead of a request for clarification.
4. **An invented fact.** Asked about Gat Tayaw, the guide answered from the
   model's own training rather than approved content, attributing the town's
   footwear trade to him. Root cause was upstream: duplicate FAQ rows were
   crowding the approved answer out of the material sent to the model.

The fourth is the one worth reporting in full. It is a direct illustration of
the methodological note that a fluent answer is not a correct answer: the
response was confident, well-formed, locally plausible, and unsupported by any
approved source. It was caught only because the reference answer had been
prepared from CHATO content beforehand — which is the reason the testing tool
requires that step.
