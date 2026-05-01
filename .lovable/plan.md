

# Execution Plan: 29 Fixes in 5 Phases with QA Gates

Each phase is a **separate prompt**. After each implementation prompt, a dedicated **QA Gate prompt** runs automated checks. No phase starts until its predecessor's gate passes.

---

## Prompt Sequence

```text
Prompt 1  → Phase 1 Implementation (Security)
Prompt 2  → QA Gate 1 (7 automated checks)
Prompt 3  → Phase 2 Implementation (Pipeline)
Prompt 4  → QA Gate 2 (8 automated checks)
Prompt 5  → Phase 3 Implementation (Checkout)
Prompt 6  → QA Gate 3 (5 automated checks)
Prompt 7  → Phase 4 Implementation (Data/Index)
Prompt 8  → QA Gate 4 (4 automated checks)
Prompt 9  → Phase 5 Implementation (UX/Cleanup)
Prompt 10 → QA Gate 5 (3 automated checks)
Prompt 11 → FINAL E2E REVIEW (5 scenarios)
```

---

## Phase 1 — Critical Security (7 items)

**Migration:**
- DROP 5 conflicting `order-evidence` storage policies (`Anyone can view evidence files`, `Admins can delete evidence` on public role, `Authenticated can read evidence`, `Admins can manage evidence files`, `Admins can delete evidence files`)
- CREATE 4 clean policies: admin ALL (`has_role`), volunteer INSERT (join to orders for assigned_volunteer), volunteer SELECT own, authenticated SELECT approved-only (join to order_evidence)
- Fix guest order RLS: tighten `Guests can view own guest order` on orders, `Guests can view guest order items` on order_items — require join condition that client always passes matching guest_token
- Remove `orders` and `visit_bookings` from `supabase_realtime` publication
- Restrict `seva_images` INSERT/UPDATE/DELETE to `has_role(auth.uid(), 'admin')`

**Edge functions:**
- Replace broken `corsHeaders` import in `evidence-process`, `evidence-url`, `evidence-cleanup` with inline definition

**Auth config:**
- Enable leaked password protection

---

## QA Gate 1 — Security Verification

Run these checks (using `supabase--read_query`, `security--run_security_scan`, `supabase--curl_edge_functions`):

| # | Check | Tool | Pass |
|---|-------|------|------|
| 1 | No public SELECT on `order-evidence` storage | `read_query` pg_policies | 0 rows with `{public}` SELECT |
| 2 | No `{public}` role DELETE on `order-evidence` | `read_query` pg_policies | 0 rows |
| 3 | `seva_images` write policies use `has_role` | `read_query` pg_policies | All write policies reference `has_role` |
| 4 | `orders` not in realtime publication | `read_query` pg_publication_tables | Not present |
| 5 | `visit_bookings` not in realtime publication | `read_query` pg_publication_tables | Not present |
| 6 | Evidence edge functions respond (no CORS crash) | `curl_edge_functions` all 3 | Status != 500 |
| 7 | Security scan: 0 critical (error) findings | `run_security_scan` | 0 errors |

**Gate rule:** ALL 7 pass → proceed to Phase 2. Any fail → fix and re-check.

---

## Phase 2 — Pipeline Integrity (5 items)

**Code changes:**
- `src/lib/evidenceQueue.ts`: After successful insert in `processQueue()`, call `supabase.functions.invoke("evidence-process", { body: { evidence_id, order_id } })`
- `supabase/functions/evidence-process/index.ts`: Add JWT verification — caller must be `uploaded_by` or admin
- `supabase/functions/evidence-url/index.ts`: Add guest path — accept `guest_token` + `order_id` in body when no Authorization header; verify token matches order via service role
- Remove `getPublicUrl("order-evidence")` fallbacks in: `useSignedEvidenceUrls.ts`, `Proof.tsx` (3 occurrences), `AdminEvidence.tsx`, `OrderDetailDrawer.tsx`, `AdminOrders.tsx` — replace with signed URL hook or empty string on failure
- `AdminEvidence.tsx`: On approve, invoke `gift-whatsapp-notify` with the order_id

---

## QA Gate 2 — Pipeline Verification

| # | Check | Tool | Pass |
|---|-------|------|------|
| 1 | 0 `getPublicUrl` refs for `order-evidence` | `search_files` | 0 matches |
| 2 | `evidence-process` rejects unauthenticated call | `curl_edge_functions` POST without auth | 401 |
| 3 | `evidence-url` accepts guest_token path | `curl_edge_functions` POST with guest_token body | 200 or 404 (not 401/500) |
| 4 | `evidence-process` returns valid response with auth | `curl_edge_functions` POST with body | Not 500 |
| 5 | `processQueue` code calls `evidence-process` | `search_files` for invoke pattern | Match found in evidenceQueue.ts |
| 6 | `AdminEvidence` calls notification on approve | `search_files` for whatsapp-notify | Match in AdminEvidence.tsx |
| 7 | Existing tests pass | Run vitest | 0 failures |
| 8 | Build succeeds | TypeScript check | Clean |

---

## Phase 3 — Checkout Hardening (3 items)

**Code changes in `src/pages/Checkout.tsx`:**
- Add email regex validation before order creation
- Add 10-digit Indian phone validation (`/^[6-9]\d{9}$/`)
- Verify submit button has `disabled={submitting}` to prevent double-tap

---

## QA Gate 3 — Checkout Verification

| # | Check | Tool | Pass |
|---|-------|------|------|
| 1 | Email regex present in Checkout.tsx | `search_files` | Pattern found |
| 2 | Phone regex present in Checkout.tsx | `search_files` | Pattern found |
| 3 | Button disabled during submit | `search_files` for `disabled.*submitting` | Found |
| 4 | Existing Checkout tests pass | Run vitest | 0 failures |
| 5 | Build succeeds | TypeScript check | Clean |

---

## Phase 4 — Data Seeding & Indexing (2 items)

**Migration:**
- Add `file_hash` index: `CREATE INDEX idx_order_evidence_file_hash ON order_evidence(file_hash) WHERE file_hash IS NOT NULL`
- Insert `evidence_requirements` JSON into `seva_categories` for cow, dog, monkey, cat

---

## QA Gate 4 — Data Verification

| # | Check | Tool | Pass |
|---|-------|------|------|
| 1 | `file_hash` index exists | `read_query` on pg_indexes | Found |
| 2 | All seva_categories have evidence_requirements | `read_query` | No NULLs |
| 3 | EXPLAIN on hash lookup uses index | `read_query` EXPLAIN | Index scan |
| 4 | Build succeeds | TypeScript check | Clean |

---

## Phase 5 — UX Polish & Cleanup (3 items)

**Code changes:**
- Verify admin evidence UI shows duplicate badge with linked order ref
- Verify volunteer TaskDetail shows rejection reason inline
- Remove highest-risk `as any` casts in evidence and order query code

---

## QA Gate 5 — UX Verification

| # | Check | Tool | Pass |
|---|-------|------|------|
| 1 | Duplicate badge rendering code exists | `search_files` for duplicate status | Found in AdminEvidence |
| 2 | Rejection reason displayed | `search_files` for rejection_reason | Found in TaskDetail |
| 3 | Build succeeds with fewer `as any` | TypeScript check | Clean, count reduced |

---

## Prompt 11 — FINAL E2E REVIEW

Runs after all 5 gates pass. Combines:

**A. Security sweep:** `run_security_scan` + `linter` — 0 critical findings

**B. Pipeline integrity:**
- `curl_edge_functions` evidence-process with test payload
- `curl_edge_functions` evidence-url with auth and guest paths
- `curl_edge_functions` evidence-cleanup
- Verify all return non-500

**C. Code integrity:**
- `search_files` for `getPublicUrl.*order-evidence` → 0 matches
- `search_files` for broken `corsHeaders` import → 0 matches
- Full vitest run → 0 failures
- Build → clean

**D. Database state:**
- Storage policies: only role-scoped, no public access
- Realtime: only `notifications` and `alerts` in publication
- RLS on all evidence tables: donors see approved only
- `file_hash` index exists

**E. Stress test reasoning (27 tests total):**
- 100 uploads/day: async pipeline, indexed hash lookup → handled
- 20% duplicates: SHA-256 dedup within 30 days → blocked
- 10% invalid: size + format validation → rejected with reason
- Donors notified only after approval → RLS + notification trigger confirm

**Final gate:** ALL sections A-E pass → APPROVED. Any failure → fix, re-run failed section only.

---

## Summary

| Prompt | Content | Checks |
|--------|---------|--------|
| 1 | Phase 1: Security fixes | — |
| 2 | QA Gate 1 | 7 checks |
| 3 | Phase 2: Pipeline fixes | — |
| 4 | QA Gate 2 | 8 checks |
| 5 | Phase 3: Checkout hardening | — |
| 6 | QA Gate 3 | 5 checks |
| 7 | Phase 4: Data + indexing | — |
| 8 | QA Gate 4 | 4 checks |
| 9 | Phase 5: UX + cleanup | — |
| 10 | QA Gate 5 | 3 checks |
| 11 | Final E2E Review | 5 scenarios |

**Total: 11 prompts, 27 gate checks, 5 final scenarios.**

