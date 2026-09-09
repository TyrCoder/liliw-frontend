-- Phase 31: Business-guide import — footwear stores, accommodations, and a
-- handful of food/retail spots not yet in the CMS.
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Source: a Google Places pull of Liliw businesses (Sept 2026). Only entries
-- that were NOT already in cms_attractions are inserted here — the following
-- were skipped as duplicates of rows that already exist:
--   Arabela, Second Street Café, VINI Food Hub, L'Bella, White House Bistro
--   (guide: "1938 White House Bistro"), Popo & Nery's, Chef Mau Restaurant,
--   Caffe Lilio, GK Café, Liliw Bakeshop, Juntayas Bakery, The Rustic Bistro
--   (guide lists it under lodging too). Jennifer's Pasalubong is deliberately
--   left out — a 1.0★ listing the guide itself flags as selling expired goods.
--
-- Two new category values arrive with this seed and are wired through the app
-- in the same change:  'footwear'  and  'accommodation'.
--   footwear      → public type 'footwear' (badge "Footwear Store")
--   accommodation → public type 'stay'     (badge "Stay")
-- cms_attractions.category has no CHECK constraint, so no schema change is
-- needed; CAT_MAP and the type unions in src/ do the rest.
--
-- cms_attractions has no rating column — stars on the Tourism listing are
-- derived from the `reviews` table, so these places show no rating until they
-- receive visitor reviews. The Google rating and review sentiment are folded
-- into each description instead. map_lat/map_lng place every pin on the /map view.
--
-- Idempotent: skips any row whose slug already exists, so re-running will not
-- duplicate anything or overwrite edits made in the CMS since.

INSERT INTO cms_attractions
  (name, category, description, location, map_lat, map_lng, features,
   opening_hours, phone, website, price_level, best_for, slug,
   status, created_by, reviewed_by, published_at)
SELECT
  s.name, s.category, s.description, s.location, s.map_lat, s.map_lng, s.features,
  s.opening_hours, s.phone, s.website, s.price_level, s.best_for, s.slug,
  'approved', 'business-guide-import', 'business-guide-import', NOW()
FROM (VALUES
  -- ───────────────────────── FOOTWEAR STORES ─────────────────────────
  ('Badong Footwear', 'footwear',
   $d$One of Liliw's most iconic and longest-running footwear names, now standing on the site once occupied by Dimasira Footwear — the first shoemaker in town, founded in 1931 by Casiano Pisueña, "the father of the tsinelas." Badong is a multi-generational family business known across neighbouring towns for durable slippers and sandals as well as bags and wallets, with resident shop cats wandering among the displays.$d$,
   'Rizal St.', 14.130950, 121.435744,
   $f$<ul><li>Family-owned for generations; staff described as friendly and occasionally funny.</li><li>Products have a strong reputation for durability.</li><li>Returns and exchanges can be inconsistent — inspect items closely before leaving and keep your receipt.</li></ul>$f$,
   'Daily, 8:30 AM – 6:00 PM', NULL, NULL, NULL, 'Durable slippers, sandals, bags', 'badong-footwear'),
  ('Lilifoot Footwear Store', 'footwear',
   $d$A wholesaler with a strong reputation for turning out beautiful, high-quality and affordable sandals and shoes, all locally made. It is popular with everyday shoppers passing through and with entrepreneurs sourcing stock to start their own footwear resale business.$d$,
   'Gat Tayaw St.', 14.130563, 121.435752,
   $f$<ul><li>Staff — sisters running the shop — are noted for patiently helping customers who have a lot of questions.</li><li>A strong option for buying in bulk or sourcing for resale.</li><li>Weekend hours run slightly later, until 6:30 PM.</li></ul>$f$,
   'Mon 9 AM–6 PM; Tue–Fri 8:30 AM–6 PM; Sat–Sun 8 AM–6:30 PM', '+63 917 110 6738', NULL, NULL, 'Bulk buying, resale sourcing', 'lilifoot-footwear-store'),
  ('JOSMAR Shoes Liliw Laguna', 'footwear',
   $d$An affordable, entirely Filipino-made ("Gawang Pinoy") footwear shop with a wide selection of sandals and flats. Reviewers describe it as a one-of-a-kind experience for shopping durable, low-priced slippers, with a particular strength in flat shoe styles for those not looking for heels.$d$,
   'Liliw', 14.132126, 121.434896,
   $f$<ul><li>The owner is personally noted as nice and helpful by multiple reviewers.</li><li>Good stop if you are specifically looking for flats rather than heeled styles.</li><li>Prices are consistently described as low even relative to other Liliw shops.</li></ul>$f$,
   'Daily, 8:00 AM – 6:00 PM', '+63 49 563 1048', NULL, 'budget', 'Affordable flats and sandals', 'josmar-shoes-liliw-laguna'),
  ('Corcega Shoe Store', 'footwear',
   $d$One of the bigger, more established shoe stores on Gat Tayaw St., with a large physical footprint compared to the neighbouring stalls. Repeat customers highlight the durability of the flip-flops bought here; designs and quality are consistently rated as good, with reasonable pricing.$d$,
   'Gat Tayaw St.', 14.131896, 121.435255,
   $f$<ul><li>Despite its size, product density is high and shelf placement can feel cramped — budget extra browsing time.</li><li>Good for durable flip-flops specifically, per multiple long-term customers.</li><li>Shares an address with the newer Katelyn Footwear listing.</li></ul>$f$,
   'Mon–Sat 8 AM–5 PM; Sun 12 PM–5 PM', '+63 917 574 6058', NULL, NULL, 'Durable flip-flops', 'corcega-shoe-store'),
  ('Zhooz Enterprise', 'footwear',
   $d$A small footwear shop on Gat Tayaw Street. Limited review detail is available, though repeat customers describe it fondly as a spot they enjoy returning to.$d$,
   'Gat Tayaw St.', 14.131653, 121.435349,
   $f$<ul><li>Open later than most shoe-row shops, until 7 PM — useful if you are shopping after a late lunch.</li></ul>$f$,
   'Daily, 8:00 AM – 7:00 PM', '+63 49 503 1197', NULL, NULL, NULL, 'zhooz-enterprise'),
  ('Megansco Footwear', 'footwear',
   $d$A budget-friendly footwear shop and one of the earliest-opening stores in town, useful if you want to start shoe shopping before the crowds arrive. Reviews are brief but consistently note the affordability of the stock.$d$,
   'Liliw', 14.132199, 121.434996,
   $f$<ul><li>Opens at 7 AM, the earliest of the main shoe-row shops — good for beating the tour-bus crowds.</li></ul>$f$,
   'Daily, 7:00 AM – 6:00 PM', '+63 49 563 3811', NULL, 'budget', 'Early-morning budget shopping', 'megansco-footwear'),
  ('JHAZ Footwear', 'footwear',
   $d$At the corner of Gat Tayaw and 3rd St., this shop specialises in colourful, fashion-forward footwear with a soft "tapakan" (footbed). One reviewer rated the quality 10/10 and called the designs colourful and fashionable. Also listed on Facebook as "Elvira's Footwear."$d$,
   'Cor. Gat Tayaw & 3rd St.', 14.136448, 121.439904,
   $f$<ul><li>Price range runs roughly ₱1,500–3,800 — a step up from the ultra-budget stalls, positioned as a design-forward option.</li><li>Sunday hours are listed oddly on Google Maps — worth calling ahead.</li></ul>$f$,
   'Mon–Sat 8 AM–7 PM; Sun 11 AM–7 PM', '+63 917 501 5752', NULL, 'moderate', 'Fashion-forward designs', 'jhaz-footwear'),
  ('Sole Meet Shoes', 'footwear',
   $d$A manufacturer-direct footwear operation selling as maker, wholesaler and retailer all in one, with an active Shopee storefront for those who would rather order online than travel. A separate, more design-forward retail line trades in town under the "Solemeet Shoes" name and shares the same contact number.$d$,
   'Ibabang San Roque', 14.145088, 121.418663,
   $f$<ul><li>Located a bit outside the main Gat Tayaw shoe row — factor in extra travel time or order online via Shopee (solemeet.shoes) instead.</li><li>Closed Sundays, unlike most of the shoe-row shops.</li></ul>$f$,
   'Mon–Sat 9 AM–6 PM; closed Sunday', '+63 918 948 6119', 'https://shopee.ph/solemeet.shoes', NULL, 'Factory-direct, online orders', 'sole-meet-shoes'),
  ('Ai-She Footwear Factory', 'footwear',
   $d$A small factory-outlet-style footwear shop known as "Ai-She's Place." Listing details are thin, and the one review on record actually praises the food rather than the footwear, so the location may double as a small eatery or the listing has some crossover content.$d$,
   'Liliw', 14.145354, 121.430249,
   $f$<ul><li>Call ahead to confirm they are currently operating as a footwear factory outlet before making a special trip.</li></ul>$f$,
   'Daily, 9:00 AM – 6:00 PM', '+63 915 107 6260', NULL, NULL, NULL, 'ai-she-footwear-factory'),
  ('5 J''s Ness C Footwear', 'footwear',
   $d$A small local shop in the Pag-Asa area of town, close to several other shoe-row businesses. Very limited review data is available, suggesting either a newer listing or a shop that mostly relies on local walk-in traffic.$d$,
   'Pag-Asa', 14.131240, 121.435433,
   $f$<ul><li>No listed hours or phone number on Google — best approached in person, or ask around the Pag-Asa area since it is tucked among several bigger-name stores.</li></ul>$f$,
   NULL, NULL, NULL, NULL, NULL, '5-j-s-ness-c-footwear'),
  ('Mitz Footwear & Bags', 'footwear',
   $d$A small footwear and bag shop right on Rizal St., positioned close to Badong Footwear, one of the busiest stores in town. Combines footwear with a bag selection, giving it a slightly different product mix than the pure shoe stalls nearby.$d$,
   'Rizal St.', 14.130925, 121.435764,
   $f$<ul><li>Very few reviews — a newer or under-the-radar shop, essentially next door to the town's most famous footwear store.</li></ul>$f$,
   NULL, NULL, NULL, NULL, 'Footwear and bags together', 'mitz-footwear-bags'),
  ('Princess Lily Footwear', 'footwear',
   $d$A footwear wholesaler on M.H. Del Pilar St., right at the corner of Gat Tayaw. The one detailed review on file calls out the staff's patience: they reportedly took the time to help the customer find the right sizes and options rather than rushing the sale.$d$,
   'Cor. M.H. del Pilar & Gat Tayaw St.', 14.130668, 121.435210,
   $f$<ul><li>A good pick if you are unsure of your size or shopping for someone else — staff are reportedly attentive rather than transactional.</li></ul>$f$,
   NULL, '+63 917 511 5079', 'https://facebook.com/shop.princesslily', NULL, NULL, 'princess-lily-footwear'),
  ('Katelyn Footwear', 'footwear',
   $d$A small shop sharing an address with Corcega Shoe Store on Gat Tayaw St. — likely a stall within or directly beside the larger, more established store rather than a fully separate storefront. Newly listed with no reviews or hours yet.$d$,
   'Gat Tayaw St.', 14.131896, 121.435255,
   $f$<ul><li>Shares Corcega's address — worth popping in while you are already browsing there rather than making a dedicated trip.</li></ul>$f$,
   NULL, NULL, NULL, NULL, NULL, 'katelyn-footwear'),
  ('Solemeet Shoes', 'footwear',
   $d$A handmade shoe line marketed as "Where your sole meets comfort and style." All pieces are handmade in Liliw using hardsole construction with debossed rebranding detail. Reviewers compare the build quality favourably to mall-brand shoes while keeping local pricing.$d$,
   'Liliw', 14.132424, 121.434657,
   $f$<ul><li>Shares a phone number with the Sole Meet Shoes factory — likely the retail storefront for the same manufacturer, so ordering online via Shopee may also apply.</li><li>A middle ground between ultra-budget stalls and pricier designer-look shops.</li></ul>$f$,
   'Daily, 9:20 AM – 6:30 PM', '+63 918 948 6119', NULL, 'moderate', 'Handmade quality', 'solemeet-shoes'),
  ('Madaha Sandals Factory', 'footwear',
   $d$A sandals-focused factory outlet located in Barangay Calumpang, a bit removed from the main Gat Tayaw shoe row and closer to the edge of town.$d$,
   'Barangay Calumpang', 14.124980, 121.441433,
   $f$<ul><li>Off the main tourist strip — best suited to visitors specifically hunting for factory-direct sandals who do not mind a short drive out of the town centre.</li></ul>$f$,
   'Daily, 8:00 AM – 5:00 PM', '+63 906 388 0722', NULL, NULL, 'Factory-direct sandals', 'madaha-sandals-factory'),
  -- ───────────────────────── ACCOMMODATIONS ─────────────────────────
  ('Cevy''s Place', 'accommodation',
   $d$A private group resort and vacation-house rental, listed on Airbnb, that can comfortably accommodate up to 18 people. On-site amenities include a swimming pool, ping pong table and videoke setup, making it well suited to family reunions or barkada trips. Caretakers, referred to warmly as "Ate Maru," are consistently praised for being quick to respond and highly attentive.$d$,
   'Liliw', 14.139808, 121.428524,
   $f$<ul><li>Check-in/out window is only about 21 hours (3 PM–12 PM), and staff ask you to clear out about 15 minutes before the deadline.</li><li>Kid-friendly: the poolside is described as safe, with a small pool for children.</li><li>You bring your own food — the venue does not provide meals.</li></ul>$f$,
   'Check-in 3:00 PM · Check-out 12:00 PM', '+63 928 505 1045', 'https://airbnb.com/h/cevysplace', NULL, 'Family reunions, barkada trips', 'cevy-s-place'),
  ('Harmonia Nature Resort', 'accommodation',
   $d$Cozy, quiet private guest rooms in a nature setting — the sort of low-key spot suited to a relaxed weekend rather than an event or party stay. It is a newer or lesser-known listing, so there is not much of a public track record yet, but early reviews describe it simply and positively as "nice and cozy."$d$,
   'Liliw', 14.139686, 121.450157,
   $f$<ul><li>Very few reviews yet — confirm amenities such as WiFi, hot water and kitchen access directly by phone before booking.</li></ul>$f$,
   NULL, '+63 917 621 8133', NULL, NULL, 'Quiet weekend stays', 'harmonia-nature-resort'),
  ('CalleHouse', 'accommodation',
   $d$A newly built, modestly constructed transient house tucked on 2nd Street, within walking distance of the public market, Liliw Church and the tsinelas stores. It is set away from the bustle of jeepneys and tricycles, giving it a genuinely quiet feel despite the central location.$d$,
   '2nd St.', 14.130473, 121.440598,
   $f$<ul><li>Hosts Maret and Nina are repeatedly singled out as super-responsive — expect quick replies if you message ahead.</li><li>Rooms come air-conditioned with water heaters and WiFi, and there are a few on-site parking slots.</li><li>Rates are inexpensive — one guest paid around ₱1,300/night.</li></ul>$f$,
   NULL, '+63 997 730 0145', 'https://facebook.com/callehouseinlaguna', 'budget', 'Walkable town-centre base', 'callehouse'),
  ('Pangan - Liliw Transient House', 'accommodation',
   $d$A transient house located on Liliw–Magdalena Rd, on the outskirts of the town centre rather than directly within the shoe-shopping district. No reviews or public details yet.$d$,
   'Liliw–Magdalena Rd', 14.135732, 121.435667,
   $f$<ul><li>Call ahead to confirm room setup, rates and included amenities before booking, since there is no track record to reference.</li></ul>$f$,
   NULL, '+63 918 485 8085', NULL, NULL, NULL, 'pangan-liliw-transient-house'),
  ('Pack and Sheet Sports Hotel', 'accommodation',
   $d$A hotel open 24 hours a day, geared toward relaxed, family-style stays rather than short-term day-tour visits. One guest mentioned already booking their next family bonding trip here, and another described the atmosphere as feeling "like home."$d$,
   'Liliw', 14.148773, 121.434346,
   $f$<ul><li>The 24-hour operation is genuinely useful if you are arriving late at night or on an irregular schedule, unlike most transient houses with fixed check-in windows.</li><li>Positioned slightly north of the main town centre — check the route before heading over, especially at night.</li></ul>$f$,
   'Open 24 hours, daily', NULL, NULL, NULL, 'Late arrivals, family stays', 'pack-and-sheet-sports-hotel'),
  ('Villa Emerenciana Liliw Laguna', 'accommodation',
   $d$Private guest rooms located in Compound 1, a residential-style setup rather than a standalone hotel building. Limited public review data — just a brief "great experience" on record.$d$,
   'Compound 1', 14.131986, 121.441512,
   $f$<ul><li>Call ahead to confirm room configuration, pricing and what is included before booking.</li></ul>$f$,
   NULL, '+63 917 398 7951', NULL, NULL, NULL, 'villa-emerenciana-liliw-laguna'),
  ('Kan Bu Villa', 'accommodation',
   $d$A stylish, minimalist villa with a subtle Mediterranean touch, located in Barangay Kanlurang Bukal. Thoughtfully placed lighting keeps the property attractively lit even at night. Despite sitting within a residential community, it is described as feeling exclusive thanks to enclosed surroundings, and stays pleasantly quiet after dark.$d$,
   'Barangay Kanlurang Bukal', 14.126456, 121.440256,
   $f$<ul><li>Best suited to a photogenic, boutique-style stay rather than a large-group resort trip.</li><li>The ground-floor room was described as spacious enough for a group of 3 — good for couples or small families.</li></ul>$f$,
   NULL, NULL, NULL, NULL, 'Boutique, photogenic stays', 'kan-bu-villa'),
  -- ───────────────────── FOOD & DRINK (not yet in CMS) ─────────────────────
  ('Buttercream Dreams Cakeshop and Cafe', 'dining',
   $d$A cake shop and cafe on Rizal St. that is very new to the map — essentially untested by public reviews so far, but positioned right in the middle of the shoe-shopping district, making it convenient to combine with footwear browsing.$d$,
   'Rizal St.', 14.130564, 121.436496,
   $f$<ul><li>Very new listing — worth trying if you are looking for something fresh, but temper expectations since there is little track record yet.</li></ul>$f$,
   '10 AM–9 PM daily, closed Wednesday', '+63 906 323 6205', 'https://facebook.com/ButterCreamDreamsCakeshop', NULL, 'Cake and coffee', 'buttercream-dreams-cakeshop-and-cafe'),
  ('Monarchy Resto & Cafe', 'dining',
   $d$A pet-friendly restaurant on P. Burgos known for milk tea, burgers and rice bowls, with serving sizes described as generous, filling and good value. Staff are called welcoming, attentive and genuinely friendly from the moment guests arrive.$d$,
   'P. Burgos St.', 14.132557, 121.435829,
   $f$<ul><li>Music volume was flagged as extremely loud by at least one visitor — request a quieter table or visit during off-peak hours.</li><li>Pet-friendly, but bring your own cleanup supplies as a courtesy.</li><li>Open late, until midnight — a solid option for an evening meal after a full day of shopping.</li></ul>$f$,
   'Daily, 10:30 AM – 12:00 AM', '+63 961 432 9897', NULL, NULL, 'Late dinners, pet owners', 'monarchy-resto-cafe'),
  ('Kanlungan River Cafe', 'dining',
   $d$A forest cafe set beside a flowing river, well removed from the shoe-shopping crowds and framed by tall trees. The "Cloud Series" of coconut-based drinks is a must-try, and the owners are repeatedly described as warm and genuinely passionate. Tapsilog and horsesilog are also specifically recommended.$d$,
   'Liliw', 14.107186, 121.444590,
   $f$<ul><li>A genuine drive from downtown Liliw — budget travel time, but reviewers consistently say it is worth the trip for the setting alone.</li><li>Good for a slow, unhurried visit — the owners are known to engage warmly if you have the time.</li></ul>$f$,
   'Tue–Sun 12 PM–9 PM, closed Monday', '+63 916 638 4364', 'https://kanlunganresort.com', NULL, 'Nature escape, slow mornings', 'kanlungan-river-cafe'),
  ('Every Morning Coffee Liliw', 'dining',
   $d$Celebrated by reviewers as the first cafe in town to reliably open in the early morning — a genuine gap it fills for early risers heading out to shop. Standout drinks include the Caramel Bar and White Mocha. Baristas are called super friendly and willing to adjust drinks to your preference.$d$,
   'Liliw', 14.131666, 121.434826,
   $f$<ul><li>Runs a rewards programme called the "EM Club" with a physical goal card — worth asking about if you plan to return during your stay.</li><li>Genuinely useful as an early breakfast or coffee stop before the shoe stores open, given its 6 AM start.</li></ul>$f$,
   'Daily, 6:00 AM – 12:00 AM', '+63 915 231 3166', 'https://facebook.com/everymorningcoffeeshop', NULL, 'Early breakfast and coffee', 'every-morning-coffee-liliw'),
  ('Rhythm & Brews', 'dining',
   $d$A small cafe known for budget-friendly specialty drinks — reviewers specifically call out a well-regarded sakura (cherry blossom) drink as a standout, describing the quality as surprisingly high given the price point.$d$,
   'Liliw', 14.132354, 121.434291,
   $f$<ul><li>Open unusually late, until 2 AM — a rare option in town if you want a drink or coffee well into the evening.</li></ul>$f$,
   'Daily, 10:00 AM – 2:00 AM', NULL, NULL, 'budget', 'Late-night specialty coffee', 'rhythm-brews'),
  ('Kuya Bal Chowpan', 'dining',
   $d$Open 24 hours on M.H. Del Pilar St. (recently relocated to Mabini St. per one review), this spot is known simply for its "Chowpan" dish — a good option for a late-night or on-the-go meal when most other Liliw eateries are closed. Reviewers describe the food as delicious and reasonably priced, with accommodating staff even during off-hours.$d$,
   'Mabini St.', 14.131653, 121.434856,
   $f$<ul><li>Recently moved to a new location on Mabini St. per at least one review — double-check the current address, since Google's coordinates may reflect the old site.</li><li>Not a sit-down destination — more a reliable quick option.</li></ul>$f$,
   'Open 24 hours, daily', NULL, NULL, 'budget', 'Late-night, on-the-go meals', 'kuya-bal-chowpan'),
  -- ───────────────────── OTHER (markets, pasalubong, services) ─────────────────────
  ('GRACIAMAE', 'other',
   $d$A local food manufacturer based in Ilayang Taykin, somewhat removed from the main town centre. It functions more as a production operation than a walk-in retail storefront, based on its listing category and limited public review presence.$d$,
   'Ilayang Taykin', 14.139672, 121.445016,
   $f$<ul><li>Given the "manufacturer" listing type, it is worth calling ahead to confirm whether they sell direct to visitors or primarily supply other retailers.</li></ul>$f$,
   'Daily, 9:00 AM – 5:00 PM', '+63 966 273 2420', NULL, NULL, NULL, 'graciamae'),
  ('Liliw Public Market', 'other',
   $d$The town's central wet market — a half-block packed with small stores, food stalls and kiosks selling everything from hardware and produce to fresh fish and hand-cut meats. It is also a solid source of cheap footwear (noticeably cheaper than Manila prices) and a favourite for boots. Bonete bread, a tea stall and a few ATMs round out the options.$d$,
   'Liliw', 14.131488, 121.439109,
   $f$<ul><li>Good complementary stop for cheap footwear — especially boots — alongside your main shoe-row shopping.</li><li>Parking is genuinely tight — plan to walk in from a nearby spot.</li><li>Also a supply source for many of the town's sari-sari stores, so prices here tend to be lower.</li></ul>$f$,
   'Daily, 5:00 AM – 7:00 PM', NULL, NULL, 'budget', 'Cheap footwear, local produce', 'liliw-public-market'),
  ('Liliw Pasalubong Center', 'other',
   $d$Best known for fresh seafood — kuhol (snails), talangka (crab) and other shells — alongside hard-to-find local delicacies like paco (fern), cassava chips, espasol, uraro and puto seko, several of which are Laguna-wide specialties.$d$,
   'Liliw', 14.131393, 121.435482,
   $f$<ul><li>The selection is somewhat limited despite the friendly service — good for grabbing a handful of specialty snacks in one stop.</li><li>Worth combining with Arlena's House of Pasalubong or the Public Market for a fuller range.</li></ul>$f$,
   'Daily, 7:30 AM – 8:00 PM', NULL, NULL, NULL, 'Local delicacies, seafood', 'liliw-pasalubong-center'),
  ('Arlena''s House of Pasalubong', 'other',
   $d$A bakery-style pasalubong shop on M.H. Del Pilar St., listed as both a bakery and a food store — likely combining fresh-baked goods with packaged local delicacies typical of pasalubong shops in the area.$d$,
   'M.H. del Pilar St.', 14.130711, 121.435358,
   $f$<ul><li>Very new / limited review data — worth a quick stop given its central location, but treat it as a discovery rather than a guaranteed highlight until more reviews come in.</li></ul>$f$,
   'Daily, 8:00 AM – 6:00 PM', '+63 49 563 1325', NULL, NULL, NULL, 'arlena-s-house-of-pasalubong'),
  ('Inquisitive', 'other',
   $d$A finance and services business on Bonifacio St., distinct from the food and retail focus of most other entries in this guide. Limited detail is available about its specific offerings beyond its listing category, though it holds a solid rating from a modest review base.$d$,
   'Bonifacio St.', 14.133524, 121.433119,
   $f$<ul><li>Given the ambiguous "finance / services" categorisation and typo'd Friday hours on Google, it is best to call ahead if you have a specific need in mind.</li></ul>$f$,
   'Mon–Thu 9 AM–6 PM; closed weekends', '+63 49 508 7730', NULL, NULL, NULL, 'inquisitive')
) AS s(name, category, description, location, map_lat, map_lng, features,
       opening_hours, phone, website, price_level, best_for, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM cms_attractions a WHERE a.slug = s.slug
);

-- Verify — expect 33 new rows (plus anything already present)
SELECT category, count(*)
FROM cms_attractions
WHERE created_by = 'business-guide-import'
GROUP BY category
ORDER BY category;
