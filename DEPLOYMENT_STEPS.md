# Step-by-Step Deployment Guide

## PHASE 1: SUPABASE DATABASE SETUP (5-10 minutes)

### Step 1.1: Create Supabase Account
1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign up"**
3. Click **"Sign up with GitHub"**
4. Authorize Supabase to access your GitHub account
5. Click **Create account**

✅ You now have a Supabase account

---

### Step 1.2: Create a New Project
1. You'll see the dashboard - click **"New project"**
2. Fill in the form:
   - **Name:** `liliw`
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose the one closest to you (e.g., "Singapore" or "North Virginia")
3. Click **"Create new project"**
4. Wait 2-3 minutes for the database to be created
5. You'll see a success notification

✅ Supabase project created

---

### Step 1.3: Get Your Database Connection String
1. In Supabase dashboard, click **"Settings"** (⚙️ icon in left sidebar)
2. Click **"Database"** tab
3. Look for **"Connection string"** section
4. Click the dropdown that says **"URI"** (if not already selected)
5. Copy the entire string (it looks like):
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
6. postgresql://postgres:Teemo1232343@db.ogwccrkgnjlwhcvgwxla.supabase.co:5432/postgres



⚠️ **IMPORTANT:** Replace `YOUR_PASSWORD` with the actual password you created in Step 1.2

✅ You have your database connection string

---

### Step 1.4: Get Your API Keys
1. Still in Supabase dashboard, click **"Settings"** ⚙️
2. Click **"API"** tab
3. You'll see:
   - **Project URL** - https://ogwccrkgnjlwhcvgwxla.supabase.co
   - **Anon Key** - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2Njcmtnbmpsd2hjdmd3eGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODgwNTMsImV4cCI6MjA5MjU2NDA1M30.pGMval9EAAx9WF7_TKyu58AdEU6W1Di3KjVxeIhQ0-w
4. **SAVE BOTH** in a text file

✅ You have your Supabase credentials ready

---

## PHASE 2: DEPLOY BACKEND TO RENDER (10-15 minutes)

### Step 2.1: Create Render Account
1. Go to https://render.com
2. Click **"Get started"** or **"Sign up"**
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub
5. Verify your email

✅ Render account created

---

### Step 2.2: Connect Your Backend Repository
1. In Render dashboard, click **"New +"** button (top right)
2. Click **"Web Service"**
3. You'll see a list of your GitHub repositories
4. Find **"liliw-strapi-backend"** and click **"Connect"**
5. Click **"Connect"** again to confirm

⏳ Wait for the repository to connect (30 seconds)

✅ Repository connected

---

### Step 2.3: Configure the Service
Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `liliw-backend` |
| **Environment** | `Node` |
| **Region** | Same region as Supabase (if available) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run develop` |
| **Plan** | `Free` |

✅ Service configured

---

### Step 2.4: Add Environment Variables
1. Click on the **"Environment"** section (still on same page)
2. Click **"Add Environment Variable"**
3. Add each variable one by one:

**Variable 1: Database Client**
- **Key:** `DATABASE_CLIENT`
- **Value:** `postgres`
- Click Add

**Variable 2: Database Host**
- **Key:** `DATABASE_HOST`
- **Value:** (Extract from your connection string - the part between `@` and `:5432`)
  - Example: `db.xxxxx.supabase.co`
- Click Add

**Variable 3: Database Port**
- **Key:** `DATABASE_PORT`
- **Value:** `5432`
- Click Add

**Variable 4: Database Name**
- **Key:** `DATABASE_NAME`
- **Value:** `postgres`
- Click Add

**Variable 5: Database Username**
- **Key:** `DATABASE_USERNAME`
- **Value:** `postgres`
- Click Add

**Variable 6: Database Password**
- **Key:** `DATABASE_PASSWORD`
- **Value:** (The password you created in Step 1.2)
- Click Add

**Variable 7: Database SSL**
- **Key:** `DATABASE_SSL`
- **Value:** `true`
- Click Add

**Variable 8: Node Environment**
- **Key:** `NODE_ENV`
- **Value:** `production`
- Click Add

✅ All environment variables added

---

### Step 2.5: Deploy Backend
1. At the bottom of the page, click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. You'll see logs scrolling
4. When complete, you'll see: ✅ **"Your service is live"** (or similar)
5. Copy the URL shown (looks like: `https://liliw-backend.onrender.com`)
6. **SAVE THIS URL**

✅ Backend is now live!

---

### Step 2.6: Verify Backend Works
1. Open your backend URL in a new tab
2. Add `/admin` to the URL (e.g., `https://liliw-backend.onrender.com/admin`)
3. You should see Strapi admin login screen
4. **First time only:** Create admin account
   - **Email:** Use your email
   - **Password:** Create a strong password
   - Click **Let's start**

✅ Backend is working!

---

## PHASE 3: CREATE STRAPI API TOKEN (2-3 minutes)

### Step 3.1: Create API Token
1. You're now in Strapi admin panel
2. Click **"Settings"** (⚙️ icon) in left sidebar
3. Click **"API Tokens"**
4. Click **"Create new API token"**
5. Fill in:
   - **Name:** `vercel-frontend`
   - **Description:** Token for Vercel frontend deployment
   - **Token duration:** Leave as is (or set to Never if available)
   - **Token type:** `Custom` or `Full access`
6. Under **Permissions**, make sure:
   - ✅ **read** is checked
   - ✅ **create** is checked
   - ✅ **update** is checked
   - ✅ **delete** is checked
7. Click **"Save"**
8. Copy the token shown (long string)
9. **SAVE THIS TOKEN** in a text file

⚠️ You won't be able to see this token again, so save it now!

✅ API token created

---

## PHASE 4: DEPLOY FRONTEND TO VERCEL (5-10 minutes)

### Step 4.1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Click **"Sign up with GitHub"**
4. Authorize Vercel
5. Verify your email

✅ Vercel account created

---

### Step 4.2: Import Your Frontend Project
1. In Vercel dashboard, click **"Add New"** → **"Project"**
2. You'll see your GitHub repos
3. Find **"liliw-frontend"** and click **"Import"**
4. On the next page, leave all settings as default
5. Scroll down and click **"Deploy"** (or wait for auto-deploy)

⏳ Vercel is building your project (2-3 minutes)

✅ Frontend imported

---

### Step 4.3: Add Environment Variables (IMPORTANT!)
1. While deployment is happening, look for **"Environment Variables"** section
2. Or click the project name → **"Settings"** → **"Environment Variables"**
3. Add two variables:

**Variable 1: Strapi URL**
- **Name:** `NEXT_PUBLIC_STRAPI_URL`
- **Value:** Your backend URL (from Step 2.5, e.g., `https://liliw-backend.onrender.com`)
- Click **"Add"**

**Variable 2: Strapi API Token**
- **Name:** `NEXT_PUBLIC_STRAPI_API_TOKEN`
- **Value:** The token you created in Step 3.1
- Click **"Add"**

⚠️ These env vars are needed for your app to work!

---

### Step 4.4: Trigger Redeploy (if needed)
1. If the initial deploy is already done, click **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** menu → **"Redeploy"**
4. Wait for the new deployment to complete
5. When done, you'll see a live URL (e.g., `https://liliw-frontend.vercel.app`)

✅ Frontend is deployed!

---

## PHASE 5: TEST EVERYTHING (5-10 minutes)

### Step 5.1: Test Frontend
1. Click your Vercel URL or visit the deployment
2. You should see the Liliw homepage
3. Click on **"Attractions"** in the navbar
4. Wait a moment...
5. You should see attraction cards loading from your database ✅

### Step 5.2: Test Backend API
1. Visit your backend URL
2. Add `/api/attractions` to the URL
3. You should see JSON data returned from Strapi

### Step 5.3: Test Admin Panel
1. Visit your backend URL
2. Add `/admin` 
3. You should be able to login with the credentials you created

✅ Everything is working!

---

## TROUBLESHOOTING

### Frontend shows blank page
- **Check:** Environment variables in Vercel
- **Check:** Backend URL is correct
- **Solution:** Redeploy frontend after confirming env vars

### Backend won't start
- **Check:** Render logs (click your service → Logs tab)
- **Check:** Database connection string is correct
- **Solution:** Verify DATABASE_HOST, DATABASE_PASSWORD, DATABASE_SSL settings

### Frontend can't reach backend
- **Check:** CORS error in browser console
- **Solution:** Make sure `NEXT_PUBLIC_STRAPI_URL` matches your Render backend URL exactly

### Database connection timeout
- **Check:** Supabase project is running
- **Solution:** Go to Supabase Settings → Database → make sure project is active

---

## YOUR LIVE URLS

After deployment, you'll have:
- 🌐 **Frontend:** https://liliw-frontend.vercel.app (or your custom domain)
- 🔧 **Backend:** https://liliw-backend.onrender.com (or your custom domain)
- 🗄️ **Database:** Supabase (managed, no public URL needed)
- 📊 **Admin Panel:** https://liliw-backend.onrender.com/admin

---

## WHAT'S NEXT?

After verification:
1. **Add custom domain** (optional)
2. **Set up monitoring** (optional)
3. **Configure backups** (optional)
4. **Add team members** (optional)

All of these are available in each platform's settings.

---

## NEED HELP?

Each platform has excellent documentation:
- **Vercel:** https://vercel.com/docs
- **Render:** https://render.com/docs
- **Supabase:** https://supabase.com/docs

Good luck! 🚀
