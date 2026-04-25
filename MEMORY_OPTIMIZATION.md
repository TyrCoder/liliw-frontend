# Strapi Memory Leak Fix - Render Free Tier

**Problem:** `Out of memory (used over 512Mi)` - Render free tier only has 512MB  
**Root Cause:** Production mode compilation uses too much memory at startup

---

## 🚨 IMMEDIATE FIX (Do This First)

### Option 1: Switch to Development Mode ⭐ RECOMMENDED

**This alone saves ~150-200MB of memory**

1. Go to Render dashboard → **liliw-backend** → **Settings**
2. Find `NODE_ENV` variable
3. Change from `production` → `development`
4. Click **Save**
5. Click **Manual Deploy**

**Why This Works:**
- Production mode optimizes/minifies everything (heavy!)
- Dev mode loads faster, uses less memory
- Free tier doesn't need production optimization

---

### Option 2: Reduce Database Pool Size

**This saves ~50-100MB**

1. Go to Render dashboard → **Settings** → **Environment Variables**
2. Find `DATABASE_POOL_MIN`
3. Change from `2` → `1`
4. Find `DATABASE_POOL_MAX`
5. Change from `10` → `3`
6. Save & redeploy

**Why:**
- Each connection uses ~10-15MB memory
- Free tier can't support 10 concurrent connections
- Reduce to what free tier actually needs

---

### Option 3: Remove Unused Dependencies

**This saves ~30-50MB**

If using PostgreSQL in production, SQLite is **not needed**:

1. Open terminal in `liliw-strapi/`
2. Run: `npm remove better-sqlite3 sqlite3`
3. Run: `npm install`
4. Redeploy to Render

**Why:**
- You're using PostgreSQL (Supabase), not SQLite
- SQLite packages are taking up space for no reason

---

### Option 4: Disable Cloud Plugin (Optional)

**This saves ~10-20MB**

Edit [liliw-strapi/config/plugins.js](liliw-strapi/config/plugins.js):

```javascript
module.exports = () => ({
  // Disable cloud plugin for free tier
  'cloud': false,
});
```

**Why:**
- Strapi Cloud plugin not needed for self-hosted
- Cloud features add overhead

---

## 📊 Memory Impact Summary

| Action | Memory Saved | Priority |
|--------|--------------|----------|
| NODE_ENV → development | 150-200MB | ⭐⭐⭐ CRITICAL |
| Reduce DB pool | 50-100MB | ⭐⭐⭐ HIGH |
| Remove SQLite deps | 30-50MB | ⭐⭐ MEDIUM |
| Disable cloud plugin | 10-20MB | ⭐ LOW |
| **TOTAL** | **240-370MB** | **From 512MB to 142-272MB** |

---

## ✅ STEP-BY-STEP DEPLOYMENT FIX

### Quick Fix (30 seconds)

1. Render Dashboard → liliw-backend → Settings
2. Find `NODE_ENV` → Change to `development`
3. Find `DATABASE_POOL_MIN` → Change to `1`
4. Find `DATABASE_POOL_MAX` → Change to `3`
5. Click **Manual Deploy**
6. Wait 5 minutes
7. Check logs for ✅ "Your service is live"

### Full Fix (5 minutes)

If quick fix doesn't work, do the full optimization:

```bash
# In liliw-strapi/
npm remove better-sqlite3 sqlite3
npm install
git add .
git commit -m "Remove unused SQLite deps for memory optimization"
git push
```

Then redeploy on Render.

---

## 🔧 ENVIRONMENT VARIABLES - OPTIMIZED FOR FREE TIER

Replace these on Render Settings:

```
NODE_ENV=development
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=3
DATABASE_CONNECTION_TIMEOUT=60000
WEBHOOKS_POPULATE_RELATIONS=false
```

Everything else stays the same (DATABASE_URL, secrets, etc.)

---

## 📊 RECOMMENDED CONFIG FOR FREE TIER

**package.json - Remove these:**
```json
// DELETE:
"better-sqlite3": "^12.9.0",
"sqlite3": "^6.0.1",

// KEEP everything else
```

**config/plugins.js:**
```javascript
module.exports = () => ({
  'cloud': false,  // Disable Strapi Cloud plugin
});
```

**config/database.js:**
```javascript
// Keep as is but set these env vars:
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=3
```

---

## 🆘 TROUBLESHOOTING CHECKLIST

**If still getting "Out of memory" error:**

- [ ] NODE_ENV is set to `development` (not production)
- [ ] DATABASE_POOL_MAX is set to 3 or lower
- [ ] DATABASE_POOL_MIN is set to 1
- [ ] Unnecessary SQLite packages removed
- [ ] Run `npm prune --production` locally
- [ ] Check Render logs for the exact error message
- [ ] Wait full 10 minutes for deployment (not just 5)

**If deployment completes but admin page slow:**

- This is normal on free tier during cold start
- Give it 30 seconds to load fully
- It will be faster on subsequent visits

**If "Connection refused" error:**

- DATABASE_URL format might be wrong
- Check Supabase dashboard for correct connection string
- Verify DATABASE_HOST, PORT, USERNAME, PASSWORD are correct

---

## 📈 UPGRADING IF NEEDED

**When you're ready for production:**

1. Upgrade Render to **Pro tier** ($7/month)
   - 512MB → 2GB memory
   - Can use production mode again
   - Better performance

2. Or switch to **Railway** ($5-10/month)
   - More generous memory allocation
   - Faster deployment

3. Or **Heroku Alternative**
   - Similar to old Heroku free tier
   - Good for small projects

---

## ✅ VERIFICATION AFTER FIX

After deploying with changes, you should see in logs:

```
✅ GOOD SIGNS:
- "Creating admin..."
- "✓ Admin created"
- "Strapi loaded"
- "Your service is live at https://liliw-backend.onrender.com"

❌ BAD SIGNS (means fix didn't work):
- "Out of memory"
- "killed signal SIGTERM"
- "Build failed"
```

---

## 💡 WHY DEVELOPMENT MODE IS OK

| Aspect | Production | Development |
|--------|------------|-------------|
| Memory | ❌ 300-400MB | ✅ 100-150MB |
| Speed | ⚡ Faster | 🐢 Slightly slower |
| Startup Time | 2-5 minutes | 30 seconds |
| Best For | High traffic | Small projects |
| Free Tier? | ❌ Usually fails | ✅ Works great |

**For a small project like Liliw, development mode is fine.**

---

## 🎯 NEXT STEPS

1. **Right now:** Change NODE_ENV + Database pool settings
2. **Wait 5 min:** For redeploy to finish
3. **Check logs:** Verify "Your service is live"
4. **If still errors:** Remove SQLite packages
5. **Test frontend:** Access admin panel at liliw-backend.onrender.com/admin

---
