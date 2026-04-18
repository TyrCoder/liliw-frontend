# WEEK 1 IMPLEMENTATION - ACTION PLAN
**Starting Date**: April 16, 2026  
**Goal**: Complete critical tech stack foundations (PWA + AI + Maps)

---

## 📅 WEEK 1 BREAKDOWN

### **DAY 1 - PWA Setup & Package Installation**

#### Task 1: Install All Required Packages
```bash
cd liliw-frontend
npm install next-pwa groq-sdk algoliasearch instantsearch.js \
  @react-google-analytics/essential qrcode.react recharts web-push \
  mapbox-gl @mapbox/mapbox-gl-draw
```

#### Task 2: Create PWA Files

**A) Create `public/manifest.json`**
- App name, description, icons
- Display mode: standalone
- Theme colors: purple (#7c3aed)
- Add home screen shortcuts

**B) Create `public/service-worker.js`**
- Cache strategy for offline
- Pre-cache essential assets
- Handle API requests
- Background sync for feedback

#### Task 3: Update `next.config.ts`
- Add next-pwa middleware
- Configure PWA options
- Enable offline mode

#### Task 4: Create `.env.local`
- GROQ_API_KEY=your_key_here
- MAPBOX_TOKEN=your_token_here
- NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337

---

### **DAY 2 - Groq AI Chatbot Integration**

#### Task 1: Create Chat Component (`src/components/ChatBot.tsx`)
- Floating chat bubble
- Message history UI
- Input field with send button
- Loading states
- Error handling
- Framer Motion animations

#### Task 2: Create Chat API Endpoint (`src/pages/api/chat.ts`)
- Receive user message
- Call Groq LLaMA 3 API
- Process response
- Return to frontend
- Error handling

#### Task 3: Integrate into Layouts
- Add ChatBot component to `src/app/layout.tsx`
- Make it appear on all pages
- Handle Z-index stacking

#### Task 4: Test Chatbot
- Test with sample questions
- Verify Groq API connection
- Test error scenarios

---

### **DAY 3 - Interactive Map Component**

#### Task 1: Create Map Component (`src/components/AttractionMap.tsx`)
- Initialize Mapbox GL
- Display Liliw coordinates
- Add attraction pins from Strapi
- Popup on pin click
- Zoom/pan controls
- Mobile responsive

#### Task 2: Create Maps Integration (`src/lib/mapbox.ts`)
- Initialize map instance
- Add markers from attractions data
- Handle clustering
- Info window templates

#### Task 3: Add Map to Pages
- Add to `/attractions` page
- Add to home page as preview
- Add location display in detail pages

#### Task 4: Test Maps
- Verify attractions display as pins
- Test interactions
- Test mobile responsiveness

---

### **DAY 4 - Analytics & Tracking Setup**

#### Task 1: Create Analytics Module (`src/lib/analytics.ts`)
- Initialize Google Analytics 4
- Track page views
- Track user interactions
- Track chatbot usage

#### Task 2: Create Analytics API (`src/pages/api/analytics.ts`)
- Log custom events
- Track attraction views
- Track search queries
- Track feedback submissions

#### Task 3: Add Tracking to Components
- Track page navigation
- Track button clicks
- Track chatbot conversations
- Track search interactions

#### Task 4: Setup GA4 Dashboard
- Create GA4 account
- Add measurement ID
- Verify events tracking

---

### **DAY 5 - Testing & Polish**

#### Task 1: PWA Testing
- ✅ Install to home screen (mobile)
- ✅ Offline functionality
- ✅ Service worker registration
- ✅ Cache behavior

#### Task 2: Chatbot Testing
- ✅ AI responses
- ✅ Error handling
- ✅ Performance
- ✅ Taglish support

#### Task 3: Map Testing
- ✅ Pin rendering
- ✅ Interactions
- ✅ Mobile responsive
- ✅ Performance

#### Task 4: Full System Testing
- ✅ All pages load
- ✅ No console errors
- ✅ Animations smooth
- ✅ Links work

#### Task 5: Documentation
- ✅ Update README with setup
- ✅ Document env variables
- ✅ Create deployment guide

---

## 📋 FILES TO CREATE THIS WEEK

### Frontend
```
src/components/
  ├── ChatBot.tsx (AI chatbot bubble)
  ├── AttractionMap.tsx (Interactive map)
  
src/pages/api/
  ├── chat.ts (AI endpoint)
  ├── analytics.ts (tracking endpoint)
  
src/lib/
  ├── mapbox.ts (map utilities)
  ├── analytics.ts (analytics setup)
  
public/
  ├── manifest.json (PWA manifest)
  ├── service-worker.js (offline support)
  ├── icons/ (favicon, app icons)
  
.env.local (environment variables)
next.config.ts (updated with PWA)
```

---

## 📦 PACKAGES INSTALLING

```json
{
  "next-pwa": "Progressive Web App support",
  "groq-sdk": "AI chatbot API",
  "algoliasearch": "Smart search",
  "instantsearch.js": "Search UI",
  "@react-google-analytics/essential": "GA4",
  "qrcode.react": "QR code generation",
  "recharts": "Analytics charts",
  "web-push": "Push notifications",
  "mapbox-gl": "Interactive maps"
}
```

---

## 🔑 ENVIRONMENT VARIABLES NEEDED

Create `.env.local`:
```env
# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Strapi
NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337

# Google Analytics
NEXT_PUBLIC_GA_ID=your_ga_measurement_id

# PWA
NEXT_PUBLIC_APP_NAME=Liliw Tourism
NEXT_PUBLIC_APP_DESCRIPTION=Discover the Heritage and Beauty of Liliw
```

---

## ✅ WEEK 1 SUCCESS CRITERIA

By end of week, verify:
- [ ] App installable to home screen
- [ ] PWA works offline
- [ ] Chatbot responds to queries
- [ ] Map displays attractions
- [ ] Analytics tracking events
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All animations smooth
- [ ] Performance acceptable

---

## 🚨 POTENTIAL BLOCKERS

1. **API Keys**: Need to get Groq, Mapbox, GA4 keys
2. **PostgreSQL**: Need Supabase setup (sequential, not blocking Week 1)
3. **Rate Limits**: Monitor API usage during testing
4. **CORS Issues**: May need backend CORS config
5. **Service Worker**: May conflict with dev mode

---

## 💾 DEPLOYMENT AFTER WEEK 1

Once Week 1 complete:
1. Push to GitHub
2. Deploy frontend to Vercel
3. Test live deployment
4. Monitor performance

---

**Next: Start with package installation on Day 1**
