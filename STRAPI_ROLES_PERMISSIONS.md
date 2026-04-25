# Strapi Roles & Permissions Matrix

**Strapi Version:** 5.40.0  
**Last Updated:** April 24, 2026

---

## 📋 ROLES OVERVIEW

| Role | Description | Users | Use Case |
|------|-------------|-------|----------|
| **Public** | Default unauthenticated (frontend visitors) | 0 | Read-only access |
| **Authenticated** | Default logged-in users | 0 | Standard users |
| **CHATO Admin** | Full administrative access | 0 | You (project owner) |
| **CHATO Editor** | Content creation with approval workflow | 0 | Future team members |

---

## 🔐 PERMISSIONS BY ROLE

### 1. PUBLIC ROLE
**Description:** Default role for unauthenticated visitors  
**Recommended For:** Frontend visitors

| Collection | Create | Read | Update | Delete | Publish |
|------------|--------|------|--------|--------|---------|
| Heritage Sites | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Tourist Spots | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Events | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| FAQs | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Reviews | ✅ (form) | ✅ | ❌ | ❌ | Auto |
| Bookings | ✅ (form) | ❌ | ❌ | ❌ | Auto |
| Newsletter | ✅ (form) | ❌ | ❌ | ❌ | Auto |
| Submissions | ✅ (form) | ❌ | ❌ | ❌ | Auto |

**Key Permission:** `find` (read), `findOne` (view detail)

---

### 2. AUTHENTICATED ROLE
**Description:** Standard logged-in user  
**Recommended For:** Regular users (if any)

| Collection | Create | Read | Update | Delete | Publish |
|------------|--------|------|--------|--------|---------|
| Heritage Sites | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Tourist Spots | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Events | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| FAQs | ❌ | ✅ Published only | ❌ | ❌ | N/A |
| Reviews | ✅ | ✅ Own only | ✅ Own only | ✅ Own only | Auto |
| Bookings | ✅ | ✅ Own only | ✅ Own only | ❌ | Auto |
| Newsletter | ✅ | ❌ | ❌ | ❌ | Auto |
| Submissions | ✅ | ❌ | ❌ | ❌ | Auto |

**Key Permissions:** Limited to their own content

---

### 3. CHATO EDITOR ROLE
**Description:** Can create & edit content, but CANNOT publish  
**Recommended For:** Content team members, blog writers

| Collection | Create | Read | Update | Delete | Publish |
|------------|--------|------|--------|--------|---------|
| Heritage Sites | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| Tourist Spots | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| Events | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| FAQs | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| Articles | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| News | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |
| Reviews | ✅ | ✅ All | ✅ Own | ❌ | ❌ |
| Bookings | ✅ | ✅ All | ✅ | ❌ | N/A |
| Artisans | ✅ Draft | ✅ All | ✅ Own | ❌ | ❌ |

**Key Permissions:** 
- ✅ `create` (drafts only)
- ✅ `read` (all content)
- ✅ `update` (own content only)
- ❌ `publish` (NOT allowed)
- ❌ `delete` (NOT allowed)

**Workflow:** Editor creates → Admin reviews → Admin publishes

---

### 4. CHATO ADMIN ROLE ⭐
**Description:** Full administrative access - Can do EVERYTHING  
**Recommended For:** You (project owner)

| Collection | Create | Read | Update | Delete | Publish |
|------------|--------|------|--------|--------|---------|
| **ALL** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key Permissions:** `all` (full access to everything)

**Additional Admin Capabilities:**
- ✅ Manage users & roles
- ✅ Publish/unpublish content
- ✅ Delete any content
- ✅ Edit other users' content
- ✅ Access admin panel
- ✅ Manage API tokens
- ✅ Configure settings
- ✅ View all analytics

---

## 📊 DETAILED ACTION MATRIX

### CREATE Permission
```
Public:         ❌ (Except forms: reviews, bookings, newsletter, submissions)
Authenticated:  ✅ (Limited - forms only)
Editor:         ✅ (Drafts for content types)
Admin:          ✅ (Everything)
```

### READ Permission
```
Public:         ✅ (Published content only)
Authenticated:  ✅ (Published + own drafts)
Editor:         ✅ (All content, including drafts)
Admin:          ✅ (Everything)
```

### UPDATE Permission
```
Public:         ❌
Authenticated:  ✅ (Own records only)
Editor:         ✅ (Own drafts only)
Admin:          ✅ (Everything)
```

### DELETE Permission
```
Public:         ❌
Authenticated:  ✅ (Own records only, limited)
Editor:         ❌
Admin:          ✅ (Everything)
```

### PUBLISH Permission
```
Public:         N/A (No drafts)
Authenticated:  N/A (Auto-published forms)
Editor:         ❌ (Cannot publish!)
Admin:          ✅ (Can publish/unpublish)
```

---

## 🔑 SPECIAL PERMISSIONS BY COLLECTION

### Heritage Sites
- **Public:** Read published only
- **Editor:** Create draft, edit own
- **Admin:** Full CRUD + publish

### Tourist Spots
- **Public:** Read published only
- **Editor:** Create draft, edit own
- **Admin:** Full CRUD + publish

### Events
- **Public:** Read published only
- **Editor:** Create draft, edit own
- **Admin:** Full CRUD + publish

### FAQs
- **Public:** Read published only
- **Editor:** Create draft, edit own
- **Admin:** Full CRUD + publish

### Reviews (User-Generated)
- **Public:** Submit (create), read published
- **Authenticated:** Create own, read own
- **Editor:** Create, read all, moderate
- **Admin:** Full access + delete spam

### Bookings (User-Generated)
- **Public:** Submit (create only)
- **Authenticated:** Create, view own
- **Editor:** Create, view all, update status
- **Admin:** Full CRUD + send confirmations

### Newsletter Subscriptions
- **Public:** Submit email only
- **Admin:** Manage list, export, delete

### Submissions/Feedback
- **Public:** Submit only
- **Admin:** Read all, mark as read/resolved

---

## 🛡️ SECURITY BEST PRACTICES

### What CANNOT Be Done By Each Role:

**Public:**
- ❌ Create content (except forms)
- ❌ Edit anything
- ❌ Delete anything
- ❌ Access admin panel
- ❌ See unpublished content

**Authenticated:**
- ❌ Create/edit articles (unless own)
- ❌ Publish anything
- ❌ Delete published content
- ❌ Manage users
- ❌ Access admin settings

**Editor:**
- ❌ Publish content (requires admin approval)
- ❌ Delete content
- ❌ Manage users
- ❌ Access settings
- ❌ Edit other editors' drafts

**Admin:**
- ✅ Can do everything (intentional)

---

## 👥 RECOMMENDED USER SETUP

### For Solo Operation (Current)
```
Admin: YOU
  - Login with your email
  - Full control
  - Use CHATO Admin role
```

### For Team Operation (Future)
```
Admin: You (1 account)
  - Project owner role

Editors: Content team (1-3 people)
  - Use CHATO Editor role
  - Create drafts → You approve/publish

Public: Visitors
  - No account needed
  - View published content only
```

---

## 🔐 API TOKEN PERMISSIONS

**Token Name:** `vercel-frontend`  
**Type:** Custom/Full Access

### Permissions Included:
- ✅ `heritage-sites.find` (list)
- ✅ `heritage-sites.findOne` (read)
- ✅ `tourist-spots.find` (list)
- ✅ `tourist-spots.findOne` (read)
- ✅ `events.find` (list)
- ✅ `events.findOne` (read)
- ✅ `faqs.find` (list)
- ✅ `faqs.findOne` (read)
- ✅ `reviews.find` (list)
- ✅ `reviews.create` (submit reviews)
- ✅ `bookings.create` (submit bookings)
- ✅ `newsletter.create` (subscribe)
- ✅ `submissions.create` (submit forms)

### Permissions NOT Included:
- ❌ `*.update` (Cannot modify existing data)
- ❌ `*.delete` (Cannot delete data)
- ❌ User management
- ❌ Settings access

---

## 📋 PERMISSION CHECKLIST

### Before Going Live

**Admin Account Setup:**
- [ ] Admin user created with CHATO Admin role
- [ ] Login tested at `/admin`
- [ ] Can create/edit/publish content
- [ ] Can manage API tokens

**API Token Created:**
- [ ] Token name: `vercel-frontend`
- [ ] Permissions set to full access
- [ ] Token copied & saved securely
- [ ] Frontend environment variable set

**Public Access Verified:**
- [ ] Public role exists
- [ ] Public can READ published content
- [ ] Public CANNOT modify content
- [ ] Forms (reviews, bookings) submit correctly

**Editor Role (If Needed):**
- [ ] CHATO Editor role exists
- [ ] Cannot publish (requires admin)
- [ ] Can create/edit drafts
- [ ] Cannot delete content

---

## 🔄 CONTENT APPROVAL WORKFLOW

### Recommended Process:

```
1. Editor creates content
   ↓
2. Content saved as DRAFT
   ↓
3. Admin reviews in Content Manager
   ↓
4. Admin publishes if approved
   ↓
5. Public sees published version
```

### Roles Involved:
- **Editor:** Steps 1-2 (creates, leaves draft)
- **Admin:** Steps 3-4 (reviews, publishes)
- **Public:** Step 5 (views only)

---

## 📞 TROUBLESHOOTING PERMISSIONS

**Problem:** Editor can see all content but cannot publish
- **Solution:** ✅ This is correct! Editors need admin approval.

**Problem:** Public cannot see content
- **Solution:** Check if content is PUBLISHED (not in draft)

**Problem:** Admin cannot access admin panel
- **Solution:** Verify admin user has CHATO Admin role (not Editor)

**Problem:** Frontend cannot fetch data
- **Solution:** Verify API token has `find` & `findOne` permissions

---

## 📝 NOTES

- **Draft & Publish:** Only Admins can toggle this
- **Timestamps:** Auto-generated on create/update
- **API Tokens:** Can be restricted per collection
- **Roles:** Can be customized further in Strapi settings
- **Permissions:** Take effect immediately after save

---

## ✅ YOUR CURRENT SETUP

| Role | Status | Next Step |
|------|--------|-----------|
| **Public** | ✅ Ready | Monitor access |
| **Authenticated** | ✅ Ready | Not needed yet |
| **CHATO Editor** | ✅ Ready | Invite team later |
| **CHATO Admin** | ✅ Ready | **→ YOU LOG IN HERE** |

---
