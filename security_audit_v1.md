# Security Audit Report: IDONEO.AI (V1.0)

**Date:** 2026-02-18
**Auditor:** Senior AppSec Engineer
**Status:** 🔴 **NO-GO (RELEASE BLOCKED)**

---

## 1. Threat Model

| Attacker Profile | Goal | Access Level | Surface |
| :--- | :--- | :--- | :--- |
| **Malicious User** | Deface Blog, Steal Emails | Authenticated | Supabase Client (Browser Console) |
| **Competitor** | Mass scrape PII / Database | Authenticated | Supabase Client / Scripting |
| **Compromised Account** | Unauthorized Admin Access | Authenticated | Hardcoded Bypass / Privilege Escalation |

**Assets to Protect:**
- **PII:** User emails in `profiles` table.
- **Content Integrity:** Blog posts, Quiz questions, Categories.
- **Identity:** Admin privileges and user sessions.

---

## 2. Findings & Evidence

### [VULN-001] CRITICAL: Unauthorized CMS Mutation
**Severity:** 9.8 (CRITICAL) - [CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H]
- **Description:** RLS policies for `blog_posts`, `blog_categories`, and `blog_tags` allow `ALL` operations (Insert, Update, Delete) for any authenticated user.
- **Evidence:** `supabase/migrations/20241209_blog_schema.sql` (Line 124-134).
- **Impact:** Any user can delete the entire blog or publish fake news.

### [VULN-002] HIGH: Self-Privilege Escalation
**Severity:** 8.8 (HIGH) - [CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H]
- **Description:** Users can update their own `role` column in the `profiles` table to `'admin'`.
- **Evidence:** `profiles` table update policy allows updates where `id = auth.uid()` without restricting columns.
- **Impact:** Full takeover of administrative panels.

### [VULN-003] HIGH: Hardcoded Administrative Backdoor
**Severity:** 7.5 (HIGH) - [CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N]
- **Description:** `AdminGuard.tsx` contains a hardcoded email bypass for `alessandro.valenza22@gmail.com`.
- **Evidence:** `src/components/auth/AdminGuard.tsx` (Line 29).
- **Impact:** Permanent backdoor that bypasses database-level role checks.

### [VULN-004] MEDIUM: Mass PII/Email Exposure
**Severity:** 5.3 (MEDIUM) - [CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N]
- **Description:** User emails are stored in the public `profiles` table which has a `SELECT true` policy for all authenticated users.
- **Evidence:** `supabase/migrations/fixes/definitive_fix.sql` (Line 35).
- **Impact:** Email scraping of the entire user base.

---

## 3. Concrete Fixes

### Fix for VULN-001 & VULN-002 (SQL Patch)
Run this in the Supabase SQL Editor to secure the database.

```sql
-- 1. Secure Profiles (Role column protection)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile (restricted)" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    ); -- Prevents changing your own role

-- 2. Secure Blog (Restricted to Admins)
DROP POLICY IF EXISTS "Authenticated can insert posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can delete posts" ON blog_posts;

CREATE POLICY "Admins can manage posts" ON blog_posts
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 3. Mask Emails from Public Read
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Authenticated users see public profile info" ON public.profiles
FOR SELECT TO authenticated
USING (true); -- Note: Consider removing 'email' from the SELECT if possible in RPC
```

### Fix for VULN-003 (Code Diff)
```diff
--- a/src/components/auth/AdminGuard.tsx
+++ b/src/components/auth/AdminGuard.tsx
-        const isSuperUser = user.email === 'alessandro.valenza22@gmail.com';
-        if (profile?.role !== 'admin' && !isSuperUser) {
+        if (profile?.role !== 'admin') {
```

---

## 4. Hardening Checklist
- [ ] Move `email` to a private `user_metadata` or a separate `private_profiles` table.
- [ ] Implement `service_role` Edge Functions for sensitive status changes.
- [ ] Enable `Supabase Vault` for sensitive API secrets.
- [ ] Disable `ALL` policies; use granular `INSERT`, `UPDATE` with specific `WITH CHECK` clauses.

---

## 5. Security Test Plan
1. **SCA:** `npm audit` should be part of the CI/CD pipeline.
2. **SAST:** Use `eslint-plugin-security` to find hardcoded secrets.
3. **DAST:** Run `ZAP` or `Burp Suite` scanner against the staging URL.
4. **Manual:** Attempt to update another user's profile via `supabase.from('profiles').update(...)` in the console.

---

## 6. Final Decision

### 🔴 NO-GO
**Reasoning:**
The application suffers from **uncontrolled data modification (Blog deletions)** and **privilege escalation** at the database layer. These are considered "Day Zero" blockers. The hardcoded backdoor also presents a long-term maintenance and rotation risk.

**GO Criteria:**
- Apply the SQL Patch for RLS policies (Section 3).
- Remove the hardcoded email bypass.
- Verify that a standard 'user' account cannot modify blog posts via browser console.
