# Free Deployment Setup Guide

Deploy to: **Vercel (Frontend) + Render (Backend) + Supabase (Database)**

---

## Step 1: Supabase Database Setup (10 minutes)

### 1.1 Create Supabase Account
- Go to https://supabase.com
- Sign up with GitHub
- Create a new project
  - Name: `liliw`
  - Region: Choose closest to you
  - Password: Save it securely

### 1.2 Get Connection String
After project created:
1. Go to **Settings → Database**
2. Find **Connection String** 
3. Copy the **URI** (starts with `postgresql://`)
4. Replace `[YOUR-PASSWORD]` with your database password

**Example format:**
```
postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

### 1.3 Keep This Info Saved
Save these for later:
- Database URL
- Database Password
- Supabase URL (for frontend)
- Supabase Anon Key (go to Settings → API Keys)

---

## Step 2: Deploy Backend to Render (15 minutes)

### 2.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2.2 Connect GitHub Repo
1. On Render dashboard, click **"New +"**
2. Select **Web Service**
3. Choose **liliw-strapi-backend** repository
4. Click **Connect**

### 2.3 Configure Deployment
Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `liliw-backend` |
| **Region** | Choose closest region |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run develop` |

### 2.4 Add Environment Variables
Before deploying, go to **Environment** tab and add:

```
DATABASE_CLIENT=postgres
DATABASE_HOST=[supabase-host]
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=[your-password]
DATABASE_SSL=true
NODE_ENV=production
```

**Where to find these:**
- `DATABASE_HOST`: From Supabase connection string (the domain part)
- `DATABASE_PASSWORD`: Your Supabase database password

### 2.5 Deploy
- Click **Create Web Service**
- Wait for deployment (takes 2-3 minutes)
- Copy the deployed URL (e.g., `https://liliw-backend.onrender.com`)

### 2.6 Verify Backend
Once deployed, visit: `https://liliw-backend.onrender.com/admin`
- You should see Strapi admin login
- First time: Create admin account

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

### 3.2 Import Project
1. Click **"Add New" → Project**
2. Select **liliw-frontend** repository
3. Click **Import**

### 3.3 Configure Project
- **Framework Preset:** Next.js
- **Root Directory:** `./` (or leave blank)

### 3.4 Add Environment Variables
Click **Environment Variables** and add:

```
NEXT_PUBLIC_STRAPI_URL=https://liliw-backend.onrender.com
NEXT_PUBLIC_STRAPI_API_TOKEN=[get-from-strapi-admin]
```

**To get API token:**
1. Go to your deployed Strapi admin
2. Settings → API Tokens → Create new token
3. Name it: `vercel-frontend`
4. Copy the token

### 3.5 Deploy
- Click **Deploy**
- Wait for deployment (takes 1-2 minutes)
- Your frontend is live! 🎉

---

## Step 4: Verify Everything Works

### 4.1 Test Frontend
- Visit your Vercel URL
- Go to `/attractions` page
- Should load attraction data from Render backend

### 4.2 Test Backend API
- Visit `https://your-backend-url.onrender.com/api/attractions`
- Should return JSON data from Supabase

### 4.3 Check Logs
If something breaks:
- **Vercel:** Deployments tab → View logs
- **Render:** Logs tab on service page
- **Supabase:** Logs in Settings

---

## Step 5: Custom Domain (Optional)

### Vercel
1. Go to project Settings → Domains
2. Add your domain
3. Follow DNS instructions

### Render
1. Go to service Settings → Custom Domains
2. Add domain
3. Update DNS

---

## Troubleshooting

### Backend won't start
- Check Supabase connection string (verify password)
- Check DATABASE_SSL=true is set
- Look at Render logs

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_STRAPI_URL` is correct
- Make sure API token is valid
- Check CORS if issues persist

### Database connection timeout
- Verify Supabase project is active
- Check if firewall needs IP whitelist (Supabase → Settings → Network)

---

## Summary of URLs You'll Get

After deployment:
- **Frontend:** https://your-project.vercel.app
- **Backend:** https://liliw-backend.onrender.com
- **Admin Panel:** https://liliw-backend.onrender.com/admin
- **Database:** Supabase (managed)

---

## Next Steps After Deployment

1. Add custom domains
2. Set up monitoring (Vercel + Render have free tiers)
3. Configure email notifications
4. Set up CI/CD (already automatic)
5. Monitor costs (all should be free tier)

**Estimated cost: $0/month** ✅
