# Threat Model & Security Architecture Review: IDONEO.AI (V1.1)

**Framework:** STRIDE + Attack Trees  
**Scope:** Frontend (React/Capacitor), Backend (Supabase), Content (Quizzes/Blog)  
**Status:** Post-Audit Hardening Applied

---

## 1. Trust Boundaries & Data Flow

### Trust Boundaries:
1.  **B1 (Client/Internet):** Untrusted boundary. Includes browser, mobile app, and public internet.
2.  **B2 (Supabase API Gateway):** Authentication and Authorization enforcement point (JWT/RLS).
3.  **B3 (Internal Admin Zone):** Routes and logic restricted to `role = 'admin'`.

### Entry Points:
-   **E1:** Auth endpoints (Magic Link, Recovery).
-   **E2:** Client-side DB queries (Supabase JS Client).
-   **E3:** Admin CSV Importer (File Upload).
-   **E4:** Spotlight/Search (Query inputs).

---

## 2. Critical Assets

1.  **PII (High):** User emails, nicknames, activity logs.
2.  **Content IP (High):** Database of thousands of quiz questions/explanations.
3.  **Gamification Integrity (Medium):** XP, Streaks, Leaderboard ranking (User retention driver).
4.  **Availability (Medium):** Site uptime during peak concorso periods.

---

## 3. Attacker Profiles

-   **Script Kiddie:** Automated XSS/SQLi scans, brute-force on auth.
-   **Insider (Cheater):** Authenticated user attempting to manipulate quiz scores or XP to top the leaderboard.
-   **Competitor:** Targeted scraping of questions and commercial blog content.
-   **APT/Targeted:** Social engineering against `alessandro.valenza22@gmail.com` to gain root access to Supabase.

---

## 4. Top 20 Attack Scenarios (STRIDE)

| ID | STRIDE | Scenario | Likelihood | Impact | Mitigations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Spoofing** | User logs in as another using a leaked Recovery Link. | Med | High | Token expiration (Supabase Default), Email-only Auth. |
| **02** | **Tampering** | User bypasses client JS to submit a 100% score for a quiz. | High | Med | **Edge Function Verification** (Requirement). |
| **03** | **Repudiation** | Admin deletes a blog post and denies the action. | Low | Low | Supabase Audit Logs (Database Webhooks). |
| **04** | **Info Disc.** | Authenticated user scrapes all user emails via `select`. | High | High | **RLS Column-level restriction** (HARDENING applied). |
| **05** | **DoS** | Attacker spams the Magic Link endpoint to exhaust mail quota. | Med | Med | Rate Limiting (Supabase Auth Settings). |
| **06** | **EoP** | User updates their own `role` to `'admin'` via console. | High | Critical | **RLS WITH CHECK restriction** (HARDENING applied). |
| **07** | **Tampering** | User modifies XP values directly during a session. | High | Med | Atomic DB increments (`increment` function). |
| **08** | **Spoofing** | Session hijacking via unsecure Cookie/Localstorage. | Low | High | HttpOnly Cookies (Supabase Default), SSL/TLS. |
| **09** | **Tampering** | Injection of malicious JS via Admin CSV import. | Med | Med | DOMPurify on display (Applied), Content Security Policy. |
| **10** | **Info Disc.** | Access to draft blog posts before publication date. | Med | Low | RLS filtering on `published_at` (Applied). |
| **11** | **DoS** | Gigantic search query to block DB threads. | Low | Med | Indexing and timeouts. |
| **12** | **Tampering** | Cheat: Pausing the client-side timer to finish quiz early. | High | Low | Server-side `start_at` / `end_at` drift check. |
| **13** | **Info Disc.** | Questions/Answers scraping via dev tools. | High | High | Data obfuscation / Limit results per page. |
| **14** | **Spoofing** | Phishing page mimicking Idoneo login. | Med | High | Brand awareness, SPF/DKIM/DMARC. |
| **15** | **EoP** | Hardcoded email accounts bypass AuthGuard. | Med | Critical | **DELETED** (BACKDOOR REMOVED). |
| **16** | **Tampering** | XSS in the Profile Nickname field. | Med | Med | Input validation + DOMPurify. |
| **17** | **Info Disc.** | Storage bucket leakage (Private Avatars). | Low | Med | RLS on Storage objects. |
| **18** | **Repudiation** | Modification of Quiz Rules for fraudulent exams. | Low | High | Immutable Quiz Metadata. |
| **19** | **DoS** | Botting the "Streak" endpoint to generate XP. | High | Med | Daily window logic (At most once per day). |
| **20** | **EoP** | Misconfigured 'service_role' key in frontend. | Low | Total | Secret scanning (CI/CD check). |

---

## 5. Attack Trees

### Goal: Deface Homepage Blog
1.  **Access Admin Panel**
    *   Find hardcoded backdoor (FIXED)
    *   Escalate Role via RLS (FIXED)
    *   Phish real admin credentials
2.  **Bypass RLS on Mutation**
    *   Find tables with `ALL` policy for authenticated (FIXED)
3.  **Perform XSS via Blog Content**
    *   Inject script into `ContentRenderer` via Admin Editor

---

## 6. Security Requirements List (Go-Live Mandatory)

1.  **[DB] Zero-Trust RLS:** Every single table (`profiles`, `quizzes`, `attempts`, `blog_*`) must have explicit `SELECT`/`INSERT`/`UPDATE` policies. No `ALL` policies allowed.
2.  **[DB] Column-Level Protection:** The `profiles(role)` column must never be writeable by the `authenticated` role unless the user is already an admin.
3.  **[CODE] No Backdoors:** Zero hardcoded emails or debug flags enabled in production builds.
4.  **[API] Rate Limiting:** Supabase Auth and Edge Functions must have rate limits to prevent Brute-force and Resource Exhaustion.
5.  **[WEB] CSP Header:** Implement a restricted Content Security Policy to prevent XSS.
6.  **[PROC] Secrets Management:** `VITE_SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be committed to the repo or used in client-side code.

---

## 7. Final Verification
- **Current Hardening:** Applied (V1.1 fixes the most critical entry points found).
- **Residual Risk:** Low, pending automated DAST/SAST.
