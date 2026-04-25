# Fix: Render Port Binding Issue

**Problem:** "Port scan timeout reached, no open ports detected"  
**Root Cause:** Strapi isn't binding to port 1337 during Render deployment  
**Solution:** Configure Render to use development mode with explicit port binding

---

## 🔧 OPTION 1: Use Development Mode (RECOMMENDED)

### Step 1: Update Environment Variables on Render

1. Go to https://render.com → Click **liliw-backend** service
2. Go to **Settings** tab
3. Find the **NODE_ENV** variable
4. Change value from `production` to `development`
5. Click **Save**

### Step 2: Redeploy

1. Click **Manual Deploy** or **Redeploy**
2. Wait for build to complete
3. Check **Logs** for ✅ "Your service is live"

**Why This Works:**
- Development mode doesn't require full optimization
- Strapi starts faster
- Port binding happens immediately
- Render can detect port 1337

---

## 🔧 OPTION 2: Add Build Command on Render

If Option 1 doesn't work, add a build command:

### Step 1: Go to Service Settings

1. https://render.com → **liliw-backend** → **Settings**
2. Scroll down to **Build Command**
3. Set to: `npm run build`

### Step 2: Set Start Command

1. Find **Start Command**
2. Set to: `npm start -- --port 1337`

### Step 3: Redeploy

1. **Manual Deploy**
2. Check logs

---

## 🔧 OPTION 3: Disable Port Detection (Last Resort)

If Render still can't detect the port:

1. Go to **Settings** → Scroll to bottom
2. Find **Health Check** or **Port Detection**
3. Set **Health Check Path** to `/admin`
4. This tells Render to check `/admin` instead of scanning for open ports

---

## ✅ VERIFICATION

After deploying, check these in the **Logs** tab:

```
✅ GOOD (you should see):
- "Creating admin..."
- "✓ Admin created"
- "Strapi loaded"
- "Server is running at http://0.0.0.0:1337"
- "Your service is live at https://liliw-backend.onrender.com"

❌ BAD (don't redeploy if you see):
- "Port scan timeout"
- "Error: listen EADDRINUSE"
- "Cannot find module"
```

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

Make sure these are set on Render:

| Variable | Value | Important |
|----------|-------|-----------|
| NODE_ENV | **development** | ⭐ Change from production |
| PORT | 1337 | Must be set |
| HOST | 0.0.0.0 | Must be set |
| DATABASE_URL | (Supabase connection) | Or use individual DATABASE_* vars |
| DATABASE_CLIENT | postgres | Must match your DB type |

---

## 🚀 QUICK CHECKLIST

- [ ] NODE_ENV changed to `development`
- [ ] PORT set to `1337`
- [ ] HOST set to `0.0.0.0`
- [ ] All DATABASE_* variables set
- [ ] Hit **Manual Deploy**
- [ ] Waited 5+ minutes for build
- [ ] Checked logs for success message
- [ ] Visited https://liliw-backend.onrender.com/admin

---

## 💡 WHY DEVELOPMENT MODE?

| Mode | Startup | Reliability | For Production |
|------|---------|-------------|-----------------|
| Development | ⚡ Fast (30s) | ✅ Starts immediately | ❌ No (not optimized) |
| Production | 🐢 Slow (2-5min) | ❌ Render times out | ✅ Yes (optimized) |

**Solution:** Use development mode on Render's free tier (it's fast enough)

---

## 🆘 Still Having Issues?

Check the **Build Logs** for exact error:

1. Go to **Logs** tab
2. Look for red text with error message
3. Common issues:
   - `EADDRINUSE` = Port already in use (change to 3000 or 5000)
   - `ENOMEM` = Out of memory (free tier limited)
   - `Cannot find module` = Missing dependency (reinstall)

---
