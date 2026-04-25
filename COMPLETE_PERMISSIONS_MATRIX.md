# Complete Strapi Permissions Matrix - All Roles & Collections

**Last Updated:** April 25, 2026  
**Strapi Version:** 5.40.0

---

## 📊 PERMISSIONS OVERVIEW

### Default Permission Actions
Every collection has these standard actions:
- **create** - Create new entries
- **find** - List all entries
- **findOne** - View single entry details
- **update** - Edit existing entries
- **delete** - Delete entries
- **publish** - Publish draft entries (if Draft & Publish enabled)
- **unpublish** - Unpublish entries (if Draft & Publish enabled)

---

## 🟢 ADMIN ROLE - FULL ACCESS

**Description:** Full administrative access to everything

### Content Types

| Collection | create | find | findOne | update | delete | publish |
|------------|--------|------|---------|--------|--------|---------|
| About | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accommodation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Article | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Artisan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Author | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Category | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dining-and-food | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Event | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Faq | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feedback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Global | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Heritage-site | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Itenerary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| News | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Participation-request | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tourist-spot | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Plugins

| Plugin | Access |
|--------|--------|
| Content types builder | ✅ Full |
| Email | ✅ Full |
| i18n | ✅ Full |
| Media Library | ✅ Full |
| Users-permissions | ✅ Full |

### Additional Admin Capabilities
- ✅ Manage users & roles
- ✅ Create/edit/delete any content
- ✅ Publish/unpublish any content
- ✅ Access admin panel
- ✅ Manage API tokens
- ✅ Configure settings
- ✅ Manage media library
- ✅ View all analytics

---

## 🔵 AUTHENTICATED ROLE - LIMITED ACCESS

**Description:** Standard logged-in users (for future team members)

### Content Types

| Collection | create | find | findOne | update | delete | publish |
|------------|--------|------|---------|--------|--------|---------|
| About | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Accommodation | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Article | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Artisan | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Author | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Category | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dining-and-food | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Event | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Faq | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Feedback | ✅ | ✅ Own | ✅ Own | ✅ Own | ❌ | N/A |
| Global | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Heritage-site | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Itenerary | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| News | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Participation-request | ✅ | ✅ Own | ✅ Own | ✅ Own | ❌ | N/A |
| Tourist-spot | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Plugins

| Plugin | Access |
|--------|--------|
| Content types builder | ❌ None |
| Email | ❌ None |
| i18n | ❌ None |
| Media Library | ⚠️ Read Only |
| Users-permissions | ❌ None |

### Authenticated User Capabilities
- ✅ View published content
- ✅ Create own submissions/feedback
- ✅ Edit own entries
- ✅ Submit participation requests
- ❌ Cannot publish/delete
- ❌ Cannot access admin settings
- ❌ Cannot manage users

---

## 🟡 PUBLIC ROLE - MINIMAL ACCESS

**Description:** Unauthenticated visitors (no login required)

### Content Types

| Collection | create | find | findOne | update | delete | publish |
|------------|--------|------|---------|--------|--------|---------|
| About | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Accommodation | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Article | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Artisan | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Author | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Category | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Dining-and-food | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Event | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Faq | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Feedback | ✅ Form | ❌ | ❌ | ❌ | ❌ | Auto |
| Global | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Heritage-site | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Itenerary | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| News | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |
| Participation-request | ✅ Form | ❌ | ❌ | ❌ | ❌ | Auto |
| Tourist-spot | ❌ | ✅ | ✅ | ❌ | ❌ | N/A |

### Plugins

| Plugin | Access |
|--------|--------|
| Content types builder | ❌ None |
| Email | ❌ None |
| i18n | ❌ None |
| Media Library | ❌ None |
| Users-permissions | ❌ None |

### Public User Capabilities
- ✅ View published content only
- ✅ Submit feedback/participation requests via forms
- ❌ Cannot view unpublished drafts
- ❌ Cannot edit anything
- ❌ Cannot access admin panel
- ❌ Cannot see other users' submissions

---

## 🎯 PERMISSION SETUP GUIDE

### For ADMIN Role
**In Strapi Admin → Settings → Roles → CHATO Admin:**
1. Select ALL collections
2. Check: create, find, findOne, update, delete, publish, unpublish
3. Enable all plugins: Content types builder, Email, i18n, Media Library, Users-permissions

### For AUTHENTICATED Role
**In Strapi Admin → Settings → Roles → Authenticated:**
1. For content viewing (About, Accommodation, Article, etc.):
   - Check: find, findOne only
2. For user submissions (Feedback, Participation-request):
   - Check: create, find (own), findOne (own), update (own)
3. Disable all plugins

### For PUBLIC Role
**In Strapi Admin → Settings → Roles → Public:**
1. For content viewing:
   - Check: find, findOne only
2. For form submissions (Feedback, Participation-request):
   - Check: create only
3. Disable all plugins

---

## 📋 IMPLEMENTATION CHECKLIST

### Step 1: Set Admin Permissions
- [ ] Go to Strapi Settings → Roles → CHATO Admin
- [ ] For each collection, set to:
  - ✅ create
  - ✅ find
  - ✅ findOne
  - ✅ update
  - ✅ delete
  - ✅ publish (if available)
  - ✅ unpublish (if available)
- [ ] Save

### Step 2: Set Authenticated Permissions
- [ ] Go to Settings → Roles → Authenticated
- [ ] For About, Accommodation, Article, Artisan, Author, Category, Dining-and-food, Event, Faq, Global, Heritage-site, Itenerary, News, Tourist-spot:
  - ✅ find
  - ✅ findOne
  - Others: leave unchecked
- [ ] For Feedback and Participation-request:
  - ✅ create
  - ✅ find
  - ✅ findOne
  - ✅ update
  - Others: leave unchecked
- [ ] Save

### Step 3: Set Public Permissions
- [ ] Go to Settings → Roles → Public
- [ ] For all content collections (About through Tourist-spot):
  - ✅ find
  - ✅ findOne
  - Others: leave unchecked
- [ ] For Feedback and Participation-request:
  - ✅ create
  - Others: leave unchecked
- [ ] Save

### Step 4: Verify Permissions
- [ ] Test frontend can read published content
- [ ] Test forms can submit (Feedback, Participation-request)
- [ ] Test admin can create/edit/delete
- [ ] Test unauthenticated access works

---

## 🔒 SECURITY NOTES

### What CANNOT Be Done By Each Role

**Public:**
- ❌ Create content (except forms)
- ❌ Edit anything
- ❌ Delete anything
- ❌ View unpublished/drafts
- ❌ Access admin panel
- ❌ See other submissions

**Authenticated:**
- ❌ Edit other users' content
- ❌ Delete published content
- ❌ Publish anything
- ❌ Manage users
- ❌ Access settings

**Admin:**
- ✅ Can do everything (intentional)

---

## 💡 NOTES

- **Published Content Only:** Public/Authenticated can only see published entries (not drafts)
- **Own Entries Only:** Users can only edit/view their own submissions
- **Forms Auto-Publish:** Feedback and Participation-request auto-publish (no moderation)
- **Admin Has Keys:** Admin role gives you complete control
- **No Token Needed:** Public & Authenticated use account-based permissions, not API tokens

---
