# Add Missing Variables to Render (FIX MEMORY ISSUE)

**Problem:** DATABASE_POOL_MIN and DATABASE_POOL_MAX are missing  
**Result:** Database holding unlimited connections = memory leak

---

## 🔧 FIX IN 3 MINUTES

### Step 1: Go to Render Dashboard
https://render.com → Click **liliw-backend** service

### Step 2: Go to Settings Tab
Click **Settings** at top

### Step 3: Scroll to Environment Variables
Find the section labeled "Environment Variables"

### Step 4: Add These 4 Variables

**Add each one by clicking "Add Environment Variable":**

| Key | Value |
|-----|-------|
| `DATABASE_POOL_MIN` | `1` |
| `DATABASE_POOL_MAX` | `3` |
| `NODE_ENV` | `development` |
| `PORT` | `1337` |

---

## 📝 STEP-BY-STEP

### For DATABASE_POOL_MIN:
1. Click **"Add Environment Variable"** button
2. **Key:** `DATABASE_POOL_MIN`
3. **Value:** `1`
4. Click **Add**

### For DATABASE_POOL_MAX:
1. Click **"Add Environment Variable"** button
2. **Key:** `DATABASE_POOL_MAX`
3. **Value:** `3`
4. Click **Add**

### For NODE_ENV:
1. Click **"Add Environment Variable"** button
2. **Key:** `NODE_ENV`
3. **Value:** `development` (change from `production`)
4. Click **Add**

### For PORT:
1. Click **"Add Environment Variable"** button
2. **Key:** `PORT`
3. **Value:** `1337`
4. Click **Add**

---

## 5️⃣ THEN REDEPLOY

1. Click **Manual Deploy** button (top right)
2. Wait 5-10 minutes for build
3. Go to **Logs** tab
4. Look for ✅ **"Your service is live"**

---

## ✅ VERIFICATION

After deploy, check if you see in logs:
```
✅ SUCCESS:
- "Creating admin..."
- "✓ Admin created"  
- "Your service is live at https://liliw-backend.onrender.com"

❌ STILL ERROR:
- "Out of memory"
- If still seeing this, we need Plan B
```

---

## 💡 WHY THESE VALUES?

| Variable | Value | Reason |
|----------|-------|--------|
| `DATABASE_POOL_MIN` | `1` | Free tier can't support multiple idle connections |
| `DATABASE_POOL_MAX` | `3` | Limit concurrent connections to save memory |
| `NODE_ENV` | `development` | Dev mode = 200MB less memory |
| `PORT` | `1337` | Strapi needs explicit port for Render to detect |

---

## 🆘 STILL NOT WORKING?

If you still see "Out of memory" after adding these:

1. Remove SQLite packages (not needed):
   ```bash
   cd liliw-strapi
   npm remove better-sqlite3 sqlite3
   npm install
   git add .
   git commit -m "Remove unused SQLite"
   git push
   ```

2. Wait for Render to auto-redeploy (1-2 minutes)
3. Check logs again

---
