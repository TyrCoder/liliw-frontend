# Fix Render: Admin Account Reset Issue

**Problem:** Render Strapi admin keeps asking to create a new account every time you visit  
**Root Cause:** Database is resetting (using SQLite instead of PostgreSQL)  
**Solution:** Force Render to use Supabase PostgreSQL

---

## 🔧 THE FIX

### Step 1: Go to Render Dashboard

1. Open https://render.com
2. Click **liliw-backend** service
3. Click **Settings** tab

---

### Step 2: Check & Update Environment Variables

**Important variables to verify:**

| Variable | Must Be | Current Value |
|----------|---------|----------------|
| `DATABASE_CLIENT` | `postgres` | ❌ Check if it's `sqlite` |
| `DATABASE_HOST` | `db.ogwccrkgnjlwhcvgwxla.supabase.co` | ❌ Check value |
| `DATABASE_PORT` | `5432` | ❌ Check value |
| `DATABASE_NAME` | `postgres` | ❌ Check value |
| `DATABASE_USERNAME` | `postgres` | ❌ Check value |
| `DATABASE_PASSWORD` | `Teemo1232343` | ⚠️ Must match Supabase |
| `DATABASE_SSL` | `true` | ❌ Check value |
| `NODE_ENV` | `development` | ❌ Should be development |

**If any are wrong:**
1. Click on the variable
2. Edit the value
3. Click **Save**

---

### Step 3: Add DATABASE_URL (Easier Method)

Instead of individual variables, you can use one connection string:

1. Go to **Environment Variables**
2. Click **Add Environment Variable**
3. **Key:** `DATABASE_URL`
4. **Value:** (see below)

**Get your DATABASE_URL:**

Go to Supabase → Your Project → Settings → Database → Connection String

It looks like:
```
postgresql://postgres:Teemo1232343@db.ogwccrkgnjlwhcvgwxla.supabase.co:5432/postgres?sslmode=require
```

Copy that and paste as the value.

---

### Step 4: Delete SQLite Database References

Make sure these variables are **REMOVED** from Render:

❌ `DATABASE_FILENAME`  
❌ `DATABASE_CLIENT=sqlite`

If you see SQLite variables, delete them.

---

### Step 5: Redeploy

1. Click **Manual Deploy**
2. Wait 5-10 minutes
3. Check logs for errors
4. Try accessing admin at `https://liliw-backend.onrender.com/admin`

---

## ✅ VERIFICATION

After redeploy, you should see:

```
✅ GOOD:
- Login page appears (same admin account as before)
- No "Create Admin" prompt
- Can access your previously created content
- Admin panel loads with data

❌ BAD:
- Still seeing "Create Admin" screen
- Connection refused error
- Database error in logs
```

---

## 🚨 WHY THIS HAPPENS

### Current (Wrong) Setup:
- Render uses **SQLite** (local storage)
- Every restart/deploy = **NEW database**
- Admin account is lost

### Fixed (Correct) Setup:
- Render uses **PostgreSQL** on Supabase (cloud storage)
- Data **persists** across restarts
- Admin account **never resets**

---

## 📋 RENDER ENV VARIABLES (PostgreSQL Version)

**Remove all these:**
```
DATABASE_CLIENT=sqlite
DATABASE_FILENAME
```

**Keep these:**
```
DATABASE_CLIENT=postgres
DATABASE_HOST=db.ogwccrkgnjlwhcvgwxla.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=Teemo1232343
DATABASE_SSL=true
DATABASE_CONNECTION_TIMEOUT=120000
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=3
HOST=0.0.0.0
PORT=1337
NODE_ENV=development
```

**Or use single connection string:**
```
DATABASE_URL=postgresql://postgres:Teemo1232343@db.ogwccrkgnjlwhcvgwxla.supabase.co:5432/postgres?sslmode=require
```

---

## 🆘 STILL NOT WORKING?

### Check 1: Logs
1. Click **Logs** tab
2. Look for "Database connection"
3. If error, paste it here

### Check 2: Local Test
1. Go to local Strapi: `http://localhost:1337/admin`
2. If it works locally but not on Render, it's a Render config issue

### Check 3: Supabase Connection
1. Go to Supabase dashboard
2. Try connecting to database with your credentials
3. If connection fails, update password in Render

---

## 💡 IMPORTANT NOTES

- **PASSWORD:** Make sure `DATABASE_PASSWORD` matches your Supabase password exactly
- **SSL:** Supabase requires `DATABASE_SSL=true`
- **POOL:** Reduce pool size to 1-3 for free tier (we already did this)
- **PERSISTENCE:** Once switched to PostgreSQL, admin account will stay forever ✅

---

## 🎯 QUICK CHECKLIST

- [ ] Verified DATABASE_CLIENT = postgres
- [ ] Updated DATABASE_HOST to Supabase host
- [ ] Updated DATABASE_PASSWORD
- [ ] Set DATABASE_SSL = true
- [ ] Removed any SQLite variables
- [ ] Set NODE_ENV = development
- [ ] Manually deployed
- [ ] Waited 10 minutes
- [ ] Tried accessing admin panel
- [ ] Admin account persists after reload

---
