# Fix All Internal Server Errors - Step by Step

## 🔧 Quick Fix for Duplicate Key Errors

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Paste Sequence Fix Script
Copy and run this comprehensive fix:

```sql
-- Reset ALL table sequences
SELECT setval(pg_get_serial_sequence('heritage_sites', 'id'), COALESCE((SELECT MAX(id) FROM heritage_sites), 0) + 1);
SELECT setval(pg_get_serial_sequence('tourist_spots', 'id'), COALESCE((SELECT MAX(id) FROM tourist_spots), 0) + 1);
SELECT setval(pg_get_serial_sequence('dining_and_foods', 'id'), COALESCE((SELECT MAX(id) FROM dining_and_foods), 0) + 1);
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE((SELECT MAX(id) FROM events), 0) + 1);
SELECT setval(pg_get_serial_sequence('faqs', 'id'), COALESCE((SELECT MAX(id) FROM faqs), 0) + 1);
SELECT setval(pg_get_serial_sequence('files', 'id'), COALESCE((SELECT MAX(id) FROM files), 0) + 1);
SELECT setval(pg_get_serial_sequence('articles', 'id'), COALESCE((SELECT MAX(id) FROM articles), 0) + 1);
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 0) + 1);
SELECT setval(pg_get_serial_sequence('accommodations', 'id'), COALESCE((SELECT MAX(id) FROM accommodations), 0) + 1);
SELECT setval(pg_get_serial_sequence('artisans', 'id'), COALESCE((SELECT MAX(id) FROM artisans), 0) + 1);
SELECT setval(pg_get_serial_sequence('news', 'id'), COALESCE((SELECT MAX(id) FROM news), 0) + 1);
SELECT setval(pg_get_serial_sequence('iteneraries', 'id'), COALESCE((SELECT MAX(id) FROM iteneraries), 0) + 1);
SELECT setval(pg_get_serial_sequence('feedbacks', 'id'), COALESCE((SELECT MAX(id) FROM feedbacks), 0) + 1);
SELECT setval(pg_get_serial_sequence('participation_requests', 'id'), COALESCE((SELECT MAX(id) FROM participation_requests), 0) + 1);
SELECT setval(pg_get_serial_sequence('admin_users', 'id'), COALESCE((SELECT MAX(id) FROM admin_users), 0) + 1);
SELECT setval(pg_get_serial_sequence('admin_roles', 'id'), COALESCE((SELECT MAX(id) FROM admin_roles), 0) + 1);
SELECT setval(pg_get_serial_sequence('strapi_api_tokens', 'id'), COALESCE((SELECT MAX(id) FROM strapi_api_tokens), 0) + 1);
```

### Step 3: Click **Run**
✅ All sequences will be reset to prevent duplicate key errors

---

## 📁 Fix File Upload Issues

Create a new query and run:

```sql
-- Fix files table
ALTER TABLE files ALTER COLUMN id SET DEFAULT nextval('files_id_seq');
ALTER TABLE files ALTER COLUMN name SET NOT NULL;
ALTER TABLE files ALTER COLUMN hash SET NOT NULL;
ALTER TABLE files ALTER COLUMN size SET NOT NULL;

-- Rebuild indexes
REINDEX INDEX files_pkey;
VACUUM ANALYZE files;

-- Verify setup
SELECT COUNT(*) as total_files FROM files;
SELECT COUNT(*) as files_with_heritage FROM heritage_sites WHERE photos IS NOT NULL;
SELECT COUNT(*) as files_with_spots FROM tourist_spots WHERE photos IS NOT NULL;
SELECT COUNT(*) as files_with_dining FROM dining_and_foods WHERE photos IS NOT NULL;
```

---

## ✅ Verification Checklist

After running the scripts, verify in Strapi:

- [ ] Try adding a new heritage site → Should NOT get duplicate key error
- [ ] Try uploading photos → Should upload successfully  
- [ ] Try adding a tourist spot with images → Should work
- [ ] Try adding dining place with photos → Should work
- [ ] Publish records → Should succeed (no 500 errors)

---

## 🚨 If Still Getting Errors

Try this aggressive reset (WARNING: Clears all data):

```sql
-- ONLY IF ABOVE DOESN'T WORK
TRUNCATE heritage_sites CASCADE;
TRUNCATE tourist_spots CASCADE;
TRUNCATE dining_and_foods CASCADE;
TRUNCATE events CASCADE;
TRUNCATE faqs CASCADE;
TRUNCATE files CASCADE;

-- Then rerun sequence fixes above
```

Then run the seed script to repopulate data.

---

## 📝 Common Internal Server Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `duplicate key violates heritage_sites_pkey` | Sequence out of sync | Run sequence fix script |
| `Photos not uploading` | Files table constraints | Run file uploads fix |
| `500 on publish` | Missing required field | Add default values in schema |
| `Cannot create record` | ID generation failed | Reset sequences |

---

**Done! Now try adding data in Strapi again.** 🎉
