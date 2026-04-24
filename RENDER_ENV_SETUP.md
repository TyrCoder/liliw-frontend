# How to Add Environment Variables to Render

## Step 1: Open Render Dashboard
Go to https://render.com and click your **`liliw-backend`** service

## Step 2: Go to Settings
Click the **Settings** tab

## Step 3: Find Environment Variables Section
Scroll down to **Environment Variables**

## Step 4: Add Each Variable Below

Copy each line and paste into Render (Key = Value):

```
DATABASE_CLIENT=postgres
DATABASE_HOST=db.ogwccrkgnjlwhcvgwxla.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=Teemo1232343
DATABASE_SSL=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=120000
HOST=0.0.0.0
PORT=1337
NODE_ENV=production
APP_KEYS=U/AM6Mpk4lz6hyTiDULFDg==,yGiLSwVZ2LLvyb4jHZB+Wg==,paEe/GEMIhBUqoLP4ODn0g==,D/0TRRpsfzJoEENVr2KXPw==
API_TOKEN_SALT=0MYUPRFn424+GUNweTXZYw==
ADMIN_JWT_SECRET=3BVyBJ3xuDuz/fWYIO3MLA==
TRANSFER_TOKEN_SALT=YGIrRuQlAsUj7/b+X81JqA==
ENCRYPTION_KEY=T9AmOpm+rkuxW52JDYCDxA==
JWT_SECRET=FkND/UrllmdCkp6CU6QvOQ==
WEBHOOKS_POPULATE_RELATIONS=false
```

## Step 5: For Each Variable
1. Click **"Add Environment Variable"**
2. Paste the **Key** (before the `=`)
3. Paste the **Value** (after the `=`)
4. Click **Add**
5. Repeat for all 19 variables

## Step 6: Redeploy
1. Click **Redeploy** or **Manual Deploy**
2. Wait 3-5 minutes
3. Check **Logs** tab
4. Should see ✅ **"Your service is live"**

---

## ⚠️ IMPORTANT NOTES

- **DATABASE_PASSWORD:** Replace `Teemo1232343` with YOUR Supabase password
- **DATABASE_HOST:** Replace `db.ogwccrkgnjlwhcvgwxla.supabase.co` with YOUR Supabase host
- **SECRETS:** Do NOT change these values (they're the same for all deployments)
- **Total variables:** 19

---

## If Still Having Issues
Check these in the Logs:
- Look for "Your service is live" ✅
- Look for "Error:" ❌ (let me know what it says)
