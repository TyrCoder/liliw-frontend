# Complete Strapi Content Types & Field Definitions

**Last Updated:** April 24, 2026

---

## 📋 TABLE OF CONTENTS

1. [Required Collections](#required-collections) (Frontend depends on these)
2. [Critical Missing](#critical-missing) (Must add for full functionality)
3. [Highly Recommended](#highly-recommended) (Complete the experience)
4. [Optional Collections](#optional-collections) (Nice to have)

---

## ✅ REQUIRED COLLECTIONS

### 1. Heritage Site
**Collection Name:** `heritage-sites`  
**Singular:** `heritage-site`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Max 255 chars |
| description | Blocks (Rich Text) | ❌ No | Main description |
| history | Blocks (Rich Text) | ❌ No | Historical background |
| location | String | ❌ No | Physical address |
| category | Enumeration | ❌ No | `tangible` \| `intangible` |
| place_type | Enumeration | ❌ No | `heritage_site` \| `landmark` \| `museum` |
| coordinates | JSON | ❌ No | `{"latitude": 14.1297, "longitude": 121.4358}` |
| distance_from_center | String | ❌ No | e.g., "2.5 km" |
| rating | Integer | ❌ No | Min: 0, Max: 5 |
| is_featured | Boolean | ❌ No | Show on homepage |

---

### 2. Tourist Spot
**Collection Name:** `tourist-spots`  
**Singular:** `tourist-spot`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Max 255 chars |
| description | Blocks (Rich Text) | ❌ No | Main description |
| tips | Blocks (Rich Text) | ❌ No | Visitor tips |
| location | String | ❌ No | Physical address |
| category | Enumeration | ❌ No | `nature` \| `shopping` \| `dining` \| `entertainment` \| `accommodation` |
| best_time_to_visit | String | ❌ No | Recommended season |
| difficulty_level | Enumeration | ❌ No | `easy` \| `moderate` \| `difficult` |
| entrance_fee | String | ❌ No | e.g., "50 pesos" |
| opening_hours | String | ❌ No | e.g., "8:00 AM - 6:00 PM" |
| coordinates | JSON | ❌ No | `{"latitude": 14.322, "longitude": 121.315}` |
| rating | Integer | ❌ No | Min: 1, Max: 5 |
| photos | Media | ❌ No | Multiple images allowed |

---

### 3. Event
**Collection Name:** `events`  
**Singular:** `event`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | ✅ Yes | Event name |
| description | Blocks (Rich Text) | ❌ No | Event details |
| date_start | DateTime | ❌ No | Start date/time |
| date_end | DateTime | ❌ No | End date/time |
| venue | String | ❌ No | Location |
| category | Enumeration | ❌ No | `festival` \| `cultural` \| `competition` \| `other` |
| program | Blocks (Rich Text) | ❌ No | Detailed schedule |
| photos | Media | ❌ No | Multiple images allowed |
| registration_url | String | ❌ No | Registration link |
| ticket_price | String | ❌ No | Price info |

---

### 4. FAQ
**Collection Name:** `faqs`  
**Singular:** `faq`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| question | String | ✅ Yes | FAQ question |
| answer | Blocks (Rich Text) | ✅ Yes | FAQ answer |
| category | Enumeration | ❌ No | `heritage` \| `tourism` \| `events` \| `general` \| `directions` |
| keywords | String | ❌ No | Search keywords |

---

## 🔴 CRITICAL MISSING

### 5. Review/Rating
**Collection Name:** `reviews`  
**Singular:** `review`  
**Draft & Publish:** No (auto-publish)  
**Why Critical:** Used by Ratings component in attractions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| item_id | String | ✅ Yes | Attraction ID being reviewed |
| rating | Integer | ✅ Yes | Min: 1, Max: 5 |
| comment | Text | ❌ No | Review text |
| user_name | String | ✅ Yes | Reviewer name |
| user_email | Email | ❌ No | Reviewer email |
| created_at | DateTime | ✅ Yes | Timestamp (auto) |
| verified | Boolean | ❌ No | Verified reviewer |

**API Endpoint:** `/api/reviews?filters[item_id][$eq]=<id>&populate=*`

---

## 🟡 HIGHLY RECOMMENDED

### 6. Booking
**Collection Name:** `bookings`  
**Singular:** `booking`  
**Draft & Publish:** No  
**Why Recommended:** Tour/activity bookings

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Visitor name |
| email | Email | ✅ Yes | Contact email |
| phone | String | ✅ Yes | Phone number |
| attraction_id | String | ✅ Yes | Booked attraction |
| date | Date | ✅ Yes | Booking date |
| time | Time | ❌ No | Booking time |
| guests | Integer | ✅ Yes | Number of people |
| special_requests | Text | ❌ No | Any special needs |
| status | Enumeration | ❌ No | `pending` \| `confirmed` \| `cancelled` \| `completed` |
| created_at | DateTime | ✅ Yes | Booking timestamp |

**API Endpoint:** `/api/bookings`

---

### 7. Newsletter Subscription
**Collection Name:** `newsletter_subscriptions`  
**Singular:** `newsletter_subscription`  
**Draft & Publish:** No  
**Why Recommended:** Email marketing list

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | Email | ✅ Yes | Subscriber email (unique) |
| subscribed_at | DateTime | ✅ Yes | Subscription date |
| active | Boolean | ✅ Yes | Is subscribed (default: true) |
| tags | String | ❌ No | Interests (e.g., "events,heritage") |
| unsubscribe_token | String | ❌ No | Token for unsubscribe link |

**API Endpoint:** `/api/newsletter`

---

### 8. Form Submission
**Collection Name:** `submissions`  
**Singular:** `submission`  
**Draft & Publish:** No  
**Why Recommended:** Contact/feedback forms

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Visitor name |
| email | Email | ✅ Yes | Contact email |
| phone | String | ❌ No | Phone number |
| message | Text | ✅ Yes | Message/feedback |
| type | Enumeration | ✅ Yes | `contact` \| `feedback` \| `inquiry` \| `complaint` |
| subject | String | ❌ No | Message subject |
| status | Enumeration | ❌ No | `new` \| `read` \| `resolved` |
| created_at | DateTime | ✅ Yes | Submission timestamp |

**API Endpoint:** `/api/submissions`

---

### 9. Artisan
**Collection Name:** `artisans`  
**Singular:** `artisan`  
**Draft & Publish:** Yes  
**Why Recommended:** Showcase tsinelas makers & local craftspeople

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Artisan name |
| bio | Text | ❌ No | Biography |
| specialty | String | ✅ Yes | Craft specialty (e.g., "Tsinelas making") |
| location | String | ❌ No | Workshop location |
| contact | String | ❌ No | Phone/email |
| photo | Media | ❌ No | Profile photo |
| products | Text | ❌ No | Products created |
| years_experience | Integer | ❌ No | Years in craft |
| rating | Integer | ❌ No | Min: 1, Max: 5 |
| website | String | ❌ No | Personal website |
| social_media | JSON | ❌ No | `{"facebook": "url", "instagram": "url"}` |

**Why Important:** Liliw is famous for artisans!

---

### 10. Dining & Food
**Collection Name:** `dining_and_food`  
**Singular:** `dining_and_food`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Restaurant/cafe name |
| description | Blocks (Rich Text) | ❌ No | Description |
| location | String | ✅ Yes | Address |
| cuisine_type | String | ✅ Yes | e.g., "Filipino, Italian" |
| price_range | String | ✅ Yes | Budget indicator (e.g., "$-$$") |
| opening_hours | String | ❌ No | Hours of operation |
| phone | String | ❌ No | Contact number |
| website | String | ❌ No | Website URL |
| photos | Media | ❌ No | Food/restaurant photos |
| coordinates | JSON | ❌ No | Location coordinates |
| specialties | String | ❌ No | Signature dishes |
| rating | Integer | ❌ No | Min: 1, Max: 5 |

---

### 11. Accommodation
**Collection Name:** `accommodations`  
**Singular:** `accommodation`  
**Draft & Publish:** Yes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Hotel/resort name |
| description | Blocks (Rich Text) | ❌ No | Full description |
| location | String | ✅ Yes | Address |
| coordinates | JSON | ❌ No | GPS coordinates |
| price_per_night | String | ✅ Yes | e.g., "PHP 2,500" |
| room_types | String | ❌ No | e.g., "Deluxe, Standard" |
| amenities | String | ❌ No | List of facilities |
| contact | String | ✅ Yes | Phone number |
| website | String | ❌ No | Booking website |
| email | Email | ❌ No | Contact email |
| photos | Media | ❌ No | Room/property photos |
| rating | Integer | ❌ No | Min: 1, Max: 5 |
| star_rating | Integer | ❌ No | 1-5 stars |
| total_rooms | Integer | ❌ No | Number of rooms |

---

## 🟢 OPTIONAL COLLECTIONS

### 12. Article
**Collection Name:** `articles`  
**Singular:** `article`  
**Draft & Publish:** Yes  
**Purpose:** Blog posts, guides, stories

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | ✅ Yes | Article title |
| slug | String | ❌ No | URL slug |
| content | Blocks (Rich Text) | ✅ Yes | Article body |
| excerpt | String | ❌ No | Short summary |
| featured_image | Media | ❌ No | Cover image |
| author | Relation | ❌ No | Link to Author |
| category | Relation | ❌ No | Link to Category |
| tags | String | ❌ No | Search tags |
| published_at | DateTime | ❌ No | Publication date |
| views | Integer | ❌ No | View counter |

---

### 13. News
**Collection Name:** `news`  
**Singular:** `news`  
**Draft & Publish:** Yes  
**Purpose:** Announcements, latest updates

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | ✅ Yes | News headline |
| content | Blocks (Rich Text) | ✅ Yes | News body |
| featured_image | Media | ❌ No | Featured image |
| published_date | DateTime | ✅ Yes | Publication date |
| source | String | ❌ No | News source |
| priority | Enumeration | ❌ No | `high` \| `medium` \| `low` |

---

### 14. Participation Request
**Collection Name:** `participation_requests`  
**Singular:** `participation_request`  
**Draft & Publish:** No  
**Purpose:** Event participation form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| event_id | String | ✅ Yes | Event ID |
| name | String | ✅ Yes | Participant name |
| email | Email | ✅ Yes | Contact email |
| phone | String | ✅ Yes | Phone number |
| status | Enumeration | ❌ No | `pending` \| `approved` \| `rejected` |
| created_at | DateTime | ✅ Yes | Application timestamp |

---

### 15. Feedback
**Collection Name:** `feedback`  
**Singular:** `feedback`  
**Draft & Publish:** No  
**Purpose:** General feedback (separate from submissions)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ Yes | Submitter name |
| email | Email | ✅ Yes | Contact email |
| rating | Integer | ❌ No | Satisfaction rating (1-5) |
| message | Text | ✅ Yes | Feedback message |
| created_at | DateTime | ✅ Yes | Submission date |

---

## 📊 PRIORITY IMPLEMENTATION PLAN

### Phase 1: MUST DO (Before going live)
- [x] Heritage Site
- [x] Tourist Spot
- [x] Event
- [x] FAQ
- [ ] **Review** ← ADD THIS

### Phase 2: SHOULD DO (Week 1)
- [ ] Booking
- [ ] Newsletter Subscription
- [ ] Form Submission
- [ ] Artisan

### Phase 3: NICE TO HAVE (Week 2+)
- [ ] Dining & Food
- [ ] Accommodation
- [ ] Article
- [ ] News
- [ ] Participation Request
- [ ] Feedback

---

## 🔗 API ENDPOINTS REFERENCE

```
GET  /api/heritage-sites?populate=*
GET  /api/tourist-spots?populate=*
GET  /api/events?populate=*
GET  /api/faqs?populate=*
GET  /api/reviews?filters[item_id][$eq]=<id>&populate=*
POST /api/bookings
POST /api/newsletter
POST /api/submissions
GET  /api/artisans?populate=*
GET  /api/dining_and_food?populate=*
GET  /api/accommodations?populate=*
```

---

## 📝 NOTES

- All **DateTime** fields are auto-populated on creation
- All **Enumeration** values must match exactly
- **JSON** fields should be valid JSON format
- **Media** fields can have `multiple: true` for galleries
- **Relations** link collections together
- **Draft & Publish** affects visibility in API (must publish to show)

---

## ✅ CHECKLIST FOR FULL DEPLOYMENT

- [ ] All 4 required collections created
- [ ] Review collection created
- [ ] At least 1-2 items per required collection
- [ ] API token generated for frontend
- [ ] Frontend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] All pages tested for data loading
- [ ] Phase 2 collections added (Booking, Newsletter, Submission, Artisan)
- [ ] Admin can create/edit/delete entries
- [ ] Public can view/submit (with proper permissions)

---
