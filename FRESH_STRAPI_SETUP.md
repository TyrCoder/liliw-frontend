# Fresh Strapi Backend Setup Checklist

This document lists all content types, fields, and configurations needed for a completely new Strapi backend installation.

---

## ✅ REQUIRED CONTENT TYPES & FIELDS

### 1. **Heritage Sites** 
**Collection:** `heritage-sites`  
**Display Name:** Heritage Site

#### Fields:
```
- name (String, Required) - max 255
- description (Blocks / Rich Text)
- history (Blocks / Rich Text)
- location (String)
- category (Enumeration: tangible, intangible)
- place_type (Enumeration: heritage_site, landmark, museum)
- coordinates (JSON)
- distance_from_center (String)
- rating (Integer, min: 0, max: 5)
- is_featured (Boolean)
- has_virtual_tour (Boolean)
```

**Draft & Publish:** ✅ Enabled

---

### 2. **Tourist Spots**
**Collection:** `tourist-spots`  
**Display Name:** Tourist Spot

#### Fields:
```
- name (String, Required) - max 255
- description (Blocks / Rich Text)
- tips (Blocks / Rich Text)
- location (String)
- category (Enumeration: nature, shopping, dining, entertainment, accommodation)
- best_time_to_visit (String)
- difficulty_level (Enumeration: easy, moderate, difficult)
- entrance_fee (String)
- opening_hours (String)
- coordinates (JSON)
- rating (Integer, min: 1, max: 5)
- photos (Media, Multiple, Allowed: images/files/videos/audios)
```

**Draft & Publish:** ✅ Enabled

---

### 3. **Events**
**Collection:** `events`  
**Display Name:** Event

#### Fields:
```
- title (String, Required)
- description (Blocks / Rich Text)
- date_start (DateTime)
- date_end (DateTime)
- venue (String)
- category (Enumeration: festival, cultural, competition, other)
- program (Blocks / Rich Text)
- photos (Media, Multiple, Allowed: images/files/videos/audios)
- registration_url (String)
- ticket_price (String)
```

**Draft & Publish:** ✅ Enabled

---

### 4. **FAQs**
**Collection:** `faqs`  
**Display Name:** FAQ

#### Fields:
```
- question (String, Required)
- answer (Blocks / Rich Text, Required)
- category (Enumeration: heritage, tourism, events, general, directions)
- keywords (String)
```

**Draft & Publish:** ✅ Enabled

---

### 5. **Itineraries** (Optional, for future use)
**Collection:** `itineraries`  
**Display Name:** Itinerary

#### Fields:
```
- title (String, Required)
- description (Blocks / Rich Text)
- duration (String) - e.g., "3 days"
- difficulty_level (Enumeration: easy, moderate, difficult)
- included_attractions (Relation to Heritage Sites & Tourist Spots)
- estimated_cost (String)
```

**Draft & Publish:** ✅ Enabled

---

## 🔌 API ENDPOINTS USED

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/heritage-sites?populate=*` | GET | Fetch all heritage sites with full data |
| `/api/tourist-spots?populate=*` | GET | Fetch all tourist spots with full data |
| `/api/events?populate=*` | GET | Fetch all events with full data |
| `/api/faqs?populate=*` | GET | Fetch all FAQs with full data |
| `/api/itineraries?populate=*` | GET | Fetch all itineraries with full data |
| `/api/reviews?filters[item_id][$eq]=<id>&populate=*` | GET | Fetch ratings for an item |

---

## 🔐 API AUTHENTICATION

- **Token Required:** Yes, via `NEXT_PUBLIC_STRAPI_API_TOKEN` environment variable
- **Authorization Header:** `Bearer <TOKEN>`
- **Public Access:** Configure roles/permissions in Strapi admin panel if needed

---

## 📦 ENVIRONMENT VARIABLES (Frontend)

Required in `.env.production` (or `.env.production.local`):

```
NEXT_PUBLIC_STRAPI_URL=https://liliw-backend.onrender.com
NEXT_PUBLIC_STRAPI_API_TOKEN=<your-api-token-here>
```

---

## 🚀 INITIAL DATA TO CREATE

### Heritage Sites (2 minimum):
1. St. John the Baptist Parish Church
2. Tsinelas Craft Heritage District

### Tourist Spots (2 minimum):
1. Banahaw Cold Springs
2. Liliw Footwear District and Shoe Factory Tours

### Events (6 recommended):
1. Santo Niño Celebration (Jan 18-31)
2. Araw ng Liliw (Apr 24-May 4)
3. Fiesta of St. John the Baptist (Aug 24-29)
4. Tsinelas Festival (Oct 14-31)
5. Foundation Day (Dec 16)
6. Year-End Bazaar (Dec 20-31)

### FAQs (minimum 1, can add 30+ later)

---

## 📋 CONTENT TYPE CONFIGURATION CHECKLIST

- [ ] Heritage Sites collection created with all 10 fields
- [ ] Tourist Spots collection created with all 10 fields
- [ ] Events collection created with all 8 fields
- [ ] FAQs collection created with all 4 fields
- [ ] Itineraries collection created (optional)
- [ ] Draft & Publish enabled for all collections
- [ ] API tokens created and accessible
- [ ] At least 2-4 items added per collection for testing
- [ ] Frontend `.env.production` configured with correct URLs and tokens
- [ ] API caching working (5-minute TTL in frontend)

---

## 🔧 VALIDATION RULES

### Required Fields (Cannot be empty):
- Heritage Sites: `name`
- Tourist Spots: `name`
- Events: `title`
- FAQs: `question`, `answer`

### Coordinate Format (JSON):
```json
{
  "latitude": 14.1297,
  "longitude": 121.4358
}
```

### Enum Values Must Match Exactly:
- Heritage Category: `tangible` | `intangible`
- Tourist Category: `nature` | `shopping` | `dining` | `entertainment` | `accommodation`
- Event Category: `festival` | `cultural` | `competition` | `other`
- FAQ Category: `heritage` | `tourism` | `events` | `general` | `directions`

---

## ✅ FRONTEND FEATURES THAT DEPEND ON THIS

1. **Attractions Page** - Displays heritage sites + tourist spots (requires heritage-sites + tourist-spots)
2. **Heritage Page** - Displays heritage sites filtered by category (requires heritage-sites)
3. **Tourist Spots Page** - Displays tourist spots with filtering (requires tourist-spots)
4. **News/Events Page** - Displays events in calendar (requires events)
5. **FAQ Page** - Displays FAQs grouped by category (requires faqs)
6. **Ratings System** - Shows ratings for each attraction (requires reviews endpoint)
7. **Itinerary Page** - Displays planned itineraries (requires itineraries)

---

## 🎯 PRIORITY

**MUST HAVE (Frontend will crash without):**
1. Heritage Sites collection ✅
2. Tourist Spots collection ✅
3. Events collection ✅
4. FAQs collection ✅

**NICE TO HAVE (Frontend works, but pages are empty):**
5. Itineraries collection
6. Initial content data

---

## 📞 API Token Creation Steps (Render Admin)

1. Go to: `https://liliw-backend.onrender.com/admin`
2. Settings ⚙️ (bottom left)
3. API Tokens (left sidebar)
4. Create new API token
5. Name: `frontend` (or descriptive name)
6. Permissions: Select all (read, create, update, delete)
7. Copy token → Paste in frontend `.env.production`

---

## 🔄 Fresh Backend Setup Order

1. Deploy fresh Strapi to Render
2. Create admin account at `/admin`
3. Create all 4 content types with correct fields
4. Create API token
5. Add 2-4 test items per collection
6. Configure frontend `.env.production` with token + URL
7. Deploy frontend
8. Test all pages load data correctly

---
