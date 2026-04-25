# Deploy Liliw Frontend to Vercel

**Frontend:** Next.js 16.2.1  
**Current Status:** Ready for deployment ✅  
**Deployment Target:** Vercel (free tier)

---

## 🚀 DEPLOYMENT STEPS (5 minutes)

### Step 1: Push Code to GitHub

First, make sure all changes are committed:

```bash
cd liliw-frontend
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

---

### Step 2: Go to Vercel

1. Open https://vercel.com
2. Sign in with your GitHub account (or create one)
3. Click **"New Project"**

---

### Step 3: Import Project

1. Find **liliw-frontend** repository
2. Click **Import**
3. Keep default settings
4. Click **Continue**

---

### Step 4: Configure Environment Variables

**CRITICAL:** Add these environment variables before deploying:

1. Click **Environment Variables** section
2. Add each variable:

```
NEXT_PUBLIC_STRAPI_URL = https://liliw-backend.onrender.com
```

```
NEXT_PUBLIC_STRAPI_API_TOKEN = 325c181e3826684965a65faeb68254a59971aef790ff2f28d118c0e5be066135fcf5d762fff33706a55324a486ef15826557e0c183fe4dda56d34e54b6736b9af83d7292824acb3e4cc078dbc9c7957cdcb9abfaff40fce7e99a9cd07c32d37c3e5b1916e03f0af040a6ab0b4e85e5f0459e85748c3e41023bf908b65c18e84c
```

```
NEXT_PUBLIC_ALGOLIA_APP_ID = KE234A4QAB
```

```
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY = a459c028d752659091a96ffaadbcdedf
```

```
NEXT_PUBLIC_ALGOLIA_INDEX_NAME = liliw-items
```

```
NEXT_PUBLIC_SUPABASE_URL = https://vrdqvvhzbnpecbedwmqu.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZHF2dmh6Ym5wZWNiZWR3bXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTAzOTcsImV4cCI6MjA5MjQyNjM5N30.kujdsUsE2p8MVZIUvKc5jKGl8r971ZaNl3X8rSoG84k
```

**Note:** These are public keys (NEXT_PUBLIC_*), safe to commit. Private keys stay secret.

---

### Step 5: Deploy

1. Click **Deploy**
2. Wait 2-5 minutes for build to complete
3. You'll see a ✅ when live

---

## ✅ VERIFICATION

After deployment, you should see:

- **Build Status:** ✅ Success
- **Live URL:** Something like `https://liliw-frontend-xxx.vercel.app`
- **Homepage:** Works and shows content
- **Hero section:** Loads with images
- **Attractions:** Displays all heritage sites, tourist spots, etc.

---

## 🧪 TESTING THE DEPLOYMENT

Click the live URL and test:

1. **Homepage loads** ✅
2. **Navigation works** ✅
3. **Attractions page** Shows data from backend
4. **Search bar** Works (Algolia)
5. **Map** Displays correctly
6. **Forms** (Contact, Newsletter) Submit successfully

---

## 🔗 ENVIRONMENT VARIABLES REFERENCE

| Variable | Value | Public? | Source |
|----------|-------|---------|--------|
| NEXT_PUBLIC_STRAPI_URL | https://liliw-backend.onrender.com | ✅ Yes | Render backend |
| NEXT_PUBLIC_STRAPI_API_TOKEN | (long token) | ✅ Yes | Strapi admin panel |
| NEXT_PUBLIC_ALGOLIA_APP_ID | KE234A4QAB | ✅ Yes | Algolia dashboard |
| NEXT_PUBLIC_ALGOLIA_SEARCH_KEY | (search key) | ✅ Yes | Algolia dashboard |
| NEXT_PUBLIC_SUPABASE_URL | (supabase url) | ✅ Yes | Supabase project |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | (anon key) | ✅ Yes | Supabase project |

**⚠️ Important:** All NEXT_PUBLIC_* vars are visible in frontend code (client-side). That's expected and safe for API keys with read-only access.

---

## 📊 DEPLOYMENT STATUS TRACKER

- [ ] GitHub account created
- [ ] liliw-frontend pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Build completed successfully
- [ ] Homepage loads at live URL
- [ ] Backend connection working (data showing)
- [ ] All pages functional

---

## 🆘 TROUBLESHOOTING

### Build Fails
**Error:** "Cannot find module 'next'"
- **Solution:** Usually auto-fixed by Vercel. Just redeploy.

### Blank Page / No Data
**Error:** Homepage loads but no attractions shown
- **Solution:** Check if backend is running
  - Go to https://liliw-backend.onrender.com/admin
  - If error, redeploy Render backend

### 404 on Collections
**Error:** "Cannot fetch heritage-sites"
- **Solution:** Collections not published yet
  - Go to local Strapi at localhost:1337/admin
  - Publish all collections
  - Restart frontend

### Environment Variable Issues
**Error:** "Algolia not working" or "Maps not showing"
- **Solution:** Verify all NEXT_PUBLIC_* vars are set in Vercel
  - Go to Project Settings → Environment Variables
  - Verify each one is present
  - Redeploy: click three dots → Redeploy

---

## 🎯 NEXT STEPS (After Deployment)

1. **Test the live frontend** at your Vercel URL
2. **Add content** to Strapi collections if needed
3. **Configure custom domain** (optional)
   - In Vercel: Settings → Domains
   - Add your domain (liliw.com, etc.)
4. **Setup analytics** (optional)
   - Vercel Analytics
   - Google Analytics

---

## 💡 PRODUCTION CHECKLIST

Before going fully live:

- [ ] Homepage displays correctly
- [ ] All attractions load with images
- [ ] Search (Algolia) works
- [ ] Map displays
- [ ] Contact form submits
- [ ] Newsletter signup works
- [ ] Mobile responsive works
- [ ] No console errors
- [ ] Page speed acceptable (Lighthouse)
- [ ] SEO tags present

---

## 📱 CUSTOM DOMAIN (Optional)

To use your own domain like `liliw.com`:

1. In Vercel: Settings → Domains
2. Add `liliw.com`
3. In your domain registrar:
   - Add CNAME pointing to Vercel
   - Or update nameservers (Vercel will guide)
4. Wait 24-48 hours for DNS to propagate
5. HTTPS auto-enabled ✅

---
