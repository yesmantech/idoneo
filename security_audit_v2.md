# Security Code Review (OWASP Top 10 + CWE Top 25)
**Date:** 2026-02-18  
**Scope:** `src/**/*`, `supabase/functions/**/*`  
**Reviewer:** Antigravity (Agentic AI)

---

## 🛑 Critical Findings

### 1. Insecure Design: Client-Side Gamification Trust
**CWE-602:** Client-Side Enforcement of Server-Side Security  
**Location:** `src/lib/xpService.ts` (Lines 85-162)

**Description:**
The `awardXpForAttempt` function runs entirely in the client browser. It fetches the quiz attempt, calculates the score locally (or trusts the cached `correct` count), and then calls the `increment_profile_xp` RPC.
An attacker can:
1.  Intercept the network response for `quiz_attempts`.
2.  Modify the `correct` count to `100`.
3.  The client logic will then instruct the server to award 100 XP.
4.  Alternatively, an attacker can simply call the `increment_profile_xp` RPC directly via the Supabase JS client console if they know the function signature, as the RPC likely only checks "is authenticated" and not "did they actually earn this?".

**Impact:** Complete compromise of Leaderboard integrity.
**Severity:** **High** (Business Logic)

**Recommendation:**
Move XP awarding to a **Database Trigger**.
```sql
-- Example Trigger Logic (Postgres)
CREATE OR REPLACE FUNCTION award_xp_on_attempt() RETURNS TRIGGER AS $$
BEGIN
  -- Calculate score server-side based on answers
  -- Increment profile XP securely
  PERFORM increment_profile_xp(NEW.user_id, NEW.correct);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_award_xp
AFTER UPDATE OF status ON quiz_attempts
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION award_xp_on_attempt();
```

---

## ⚠️ Medium Findings

### 2. CSV Injection (Formula Injection)
**CWE-1236:** Improper Neutralization of Formula Elements in a CSV File  
**Location:** `src/app/admin/upload-csv/page.tsx`

**Description:**
The admin import feature allows importing questions via CSV. If an admin uploads a CSV where a field (e.g., `explanation`) starts with `=`, `@`, `+`, or `-`, and this data is later *exported* and opened in Excel by another admin, it could execute arbitrary code (DDE injection) on the admin's machine.
While this is an *import* feature, the lack of sanitization means bad data entering the system could harm administrators later.

**POC:**
```csv
question_text,option_a,...
"=cmd|' /C calc'!A0", "A", ...
```

**Severity:** **Medium** (Admin-to-Admin risk)

**Fix:**
Sanitize fields during import. Prepend a single quote `'` to any field starting with dangerous characters.

---

## ℹ️ Low / Informational Findings

### 3. Ineffective File Type Validation
**CWE-434:** Unrestricted Upload of File with Dangerous Type  
**Location:** `src/app/admin/upload-csv/page.tsx` (Lines 204-229)

**Description:**
The bulk image uploader relies on the file extension and browser MIME type. It passes the file directly to `supabase.storage.from(BUCKET).upload()`.
While Supabase Storage likely renders images safely (preventing HTML execution via Content-Type), a malicious user could upload non-image files if the bucket policies aren't strictly set to `image/*`.

**Fix:**
Ensure Supabase Storage Bucket `question-images` has `allowed_mime_types` set to `['image/jpeg', 'image/png', 'image/webp']`.

### 4. Future SSRF Risk
**OWASP A10:2021:** Server-Side Request Forgery  
**Location:** `supabase/functions/import-bandi/index.ts`

**Description:**
The code contains comments indicating future plans to "fetch RSS feed or scrape InPA page".
If implemented using user-supplied URLs without validation, this will become a full SSRF vulnerability, allowing attackers to scan the internal network of the Edge Function container.

**Mitigation:**
When implementing, strictly allowlist the domains (e.g., `inpa.gov.it` ONLY).

---

## ✅ Positive Security Notables
-   **XSS:** No `dangerouslySetInnerHTML` found. React default escaping + DOMPurify (Nicknames) handles standard XSS effective.
-   **CSP:** Baseline Content Security Policy implemented in `index.html`.
-   **Auth:** No hardcoded secrets found in frontend source (checked `config` files). Backdoors removed.

---

## 🏁 Conclusion
The security posture is **Strong** on the frontend/infrastructure layer (Auth, RLS, XSS), but **Weak** on the **Gamification Business Logic** layer. The trust placed in the client for XP calculations is the primary remaining risk for a "Fair Play" certification.
