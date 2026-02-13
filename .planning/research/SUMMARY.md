# Project Research Summary

**Project:** Photo Hub v2.0 Delivery System
**Domain:** Photo delivery and download management for professional photographers
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

This research focuses on extending Photo Hub's existing v1.0 selection workflow with delivery and download features. The v1.0 system already handles photo upload, token-based client galleries, photo selection, and status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED). Version 2.0 adds a separate delivery token system, server-side ZIP generation for bulk downloads, individual photo downloads, download tracking analytics, and UI polish to complete the photographer-to-client workflow.

The recommended approach uses **separate tokens** for selection (shareId) and delivery (deliveryToken) to maintain security boundaries. ZIP generation should use **streaming architecture** (maennchen/zipstream-php) instead of native ZipArchive to avoid Hostinger's memory and timeout limits. Download tracking requires a **dedicated table** with deduplication to prevent double-counting from browser resume requests. The existing Collection.status lifecycle extends with automatic DELIVERED status when delivery tokens are generated.

Key risks center on integration complexity—reusing shareId for delivery creates security holes; naive ZIP generation hits resource limits on collections with 50+ photos; poor download tracking inflates metrics by 10x. All risks are mitigated through architectural decisions in Phase 1 (separate tokens) and Phase 2 (streaming ZIP generation).

## Key Findings

### Recommended Stack

**v2.0 additions to existing PHP/MySQL/React stack:**

**Core technologies:**
- **maennchen/zipstream-php 3.2**: Server-side streaming ZIP generation — Prevents memory exhaustion and timeout issues on Hostinger by streaming files one-by-one to client without buffering entire archive. Handles 100+ photo collections that would crash native ZipArchive.
- **random_bytes() + bin2hex()**: Delivery token generation — PHP's cryptographically secure CSPRNG produces 64-character hex tokens with 256 bits entropy. No dependencies, faster than UUID libraries, meets security requirements for unguessable access tokens.
- **file-saver 2.0.5**: Client-side individual photo downloads — Handles cross-browser quirks (Safari, Firefox filename handling). Mature library (feature-complete since 2019), 1.5KB gzipped, simple API for Blob downloads.

**Database schema changes:**
- `Collection.deliveryToken` (VARCHAR 64, UNIQUE): Separate token from shareId, generated only on DELIVERED transition
- `Collection.deliveredAt` (DATETIME): Timestamp for delivery tracking and expiration calculation
- `Download` table: Tracks ZIP and individual photo downloads with deduplication (sessionId + date uniqueness)

**What NOT to add:** Cloud storage SDK (defer to v3.0), queue system (unnecessary at current scale <100 collections/day), JWT library (overkill for simple token validation), email library (not in v2.0 scope).

### Expected Features

**Must have (table stakes):**
- Separate delivery link — Industry standard; clients expect proofing link ≠ download link
- ZIP download all finals — "Download all" button is expected; clients won't download 200 files individually
- Individual photo download — Flexibility for clients who want specific images without extracting full ZIP
- Download tracking — Photographers need confirmation delivery was received

**Should have (competitive):**
- Share link redirect logic — Selection link redirects to delivery page when DELIVERED (integrated flow)
- Hide upload dropzone after first photo — Reduces clutter; uncommon pattern but high UX value
- Reorganize collection buttons — Group by workflow phase for clarity
- Progressive UI disclosure — Cleaner interface once content exists

**Defer (v2+):**
- Gallery expiration dates — Requires email infrastructure for automated reminders
- Download analytics dashboard — Track data but don't surface analytics until v2.x
- Password-protected delivery — Security feature deferred until client requests
- CDN integration — Performance optimization unnecessary at current scale

### Architecture Approach

Photo delivery systems separate selection links (client chooses photos) from delivery links (client downloads finals) using a two-token architecture. This provides independent expiration control, different access levels (view vs download), and clear status lifecycle boundaries. The v2.0 delivery system integrates with existing v1.0 infrastructure through new database columns (deliveryToken, deliveredAt), new public endpoints (/delivery/{token}), and extensions to the status lifecycle (DELIVERED auto-set on token generation).

**Major components:**
1. **Token Generator** — Creates deliveryToken (64-char hex) when photographer transitions collection to DELIVERED. Stores in Collection.deliveryToken, sets deliveredAt timestamp.
2. **ZIP Builder** — On-demand streaming ZIP generation using ZipStream-PHP. Fetches EditedPhoto records, streams files to client without disk writes, tracks download on completion.
3. **Download Tracker** — Logs download events (type, timestamp, collectionId) with session-based deduplication to prevent double-counting from browser resume requests.
4. **Delivery Page (Public)** — Token-authenticated React page (no session required) displaying edited photos grid with download buttons. Validates deliveryToken, checks DELIVERED status.

### Critical Pitfalls

1. **Token Confusion Between Sharing and Delivery** — Reusing shareId for delivery creates security holes (clients can modify selections post-delivery). Create separate deliveryToken column, generate only on DELIVERED transition, validate token type in endpoints.

2. **ZIP Generation Exceeding Hostinger Limits** — Native ZipArchive hits 180s max_execution_time and memory_limit on 50+ photo collections. Use ZipStream-PHP for streaming, validate collection size before generation, test with 50+ files at 10MB each.

3. **Download Tracking Double-Counting** — Every browser preflight/resume increments counter (one download appears as 5-10). Use Download table with UNIQUE constraint on (collectionId, sessionId, downloadedAt), INSERT IGNORE pattern prevents duplicates.

4. **ZIP Path Traversal Vulnerability (Zip Slip)** — Malicious filenames like `../../passwd` allow directory traversal. Sanitize with basename() before ZIP entry, use sequential names (edited_001.jpg), validate filenames on upload.

5. **Temporary ZIP Files Exhausting Disk Space** — Generated ZIPs never cleaned up, server runs out of space after 100 deliveries. Use streaming approach (no temp files) OR implement cron cleanup for pre-generated ZIPs (processedZipPath).

## Implications for Roadmap

Based on research, suggested phase structure follows dependency order from database schema → backend generation → frontend UI. Each phase addresses specific architectural components while avoiding identified pitfalls.

### Phase 1: Database Schema & Token Generation
**Rationale:** Foundation must exist before any delivery features work. Token separation is critical architectural decision preventing security holes.
**Delivers:** Collection.deliveryToken column, deliveredAt timestamp, Download tracking table, backend endpoint to generate tokens
**Addresses:** Separate delivery link (table stakes), Download tracking infrastructure
**Avoids:** Pitfall #1 (token confusion), Pitfall #3 (double-counting via schema design)
**Research flag:** Standard database migration pattern — no additional research needed

### Phase 2: Server-Side ZIP Generation
**Rationale:** Most complex component; requires ZipStream library integration and Hostinger constraint handling. Must be correct before exposing to clients.
**Delivers:** /delivery/{token}/zip endpoint, streaming ZIP generation, memory-efficient file handling
**Uses:** maennchen/zipstream-php 3.2, PHP readfile() with chunking
**Implements:** ZIP Builder component
**Avoids:** Pitfall #2 (timeout/memory limits), Pitfall #4 (Zip Slip), Pitfall #5 (disk exhaustion)
**Research flag:** May need ZipStream API research if issues arise during implementation

### Phase 3: Individual Photo Downloads & Tracking
**Rationale:** Simpler than ZIP generation; builds on same authentication pattern. Download tracking completes analytics foundation.
**Delivers:** /delivery/{token}/download/{photoId} endpoint, Download table logging, session-based deduplication
**Addresses:** Individual photo download (table stakes), Download tracking (table stakes)
**Avoids:** Pitfall #3 (double-counting via implementation), Pitfall #7 (race conditions on tracking)
**Research flag:** Standard file streaming — no additional research needed

### Phase 4: Public Delivery Page (Client UI)
**Rationale:** Client-facing interface depends on backend endpoints being complete. Can iterate on UX after core functionality works.
**Delivers:** DeliveryPage.jsx component, photo grid display, download buttons (ZIP + individual)
**Uses:** file-saver for individual downloads, native Fetch + Blob for ZIP
**Implements:** Delivery Page (Public) component
**Avoids:** Standard React patterns — no novel pitfalls
**Research flag:** No research needed — standard UI implementation

### Phase 5: Photographer Delivery Management (Dashboard Integration)
**Rationale:** Photographer-facing features integrate with existing CollectionDetailsPage. Lower priority than client delivery experience.
**Delivers:** "Generate Delivery Link" button, copy-to-clipboard, delivery analytics display, deliveredAt timestamps in collection cards
**Addresses:** Download tracking visibility, Share link redirect logic
**Avoids:** Standard UI integration
**Research flag:** No research needed — extends existing patterns

### Phase 6: UI Polish & Refinement
**Rationale:** Non-blocking improvements; can ship incrementally after core workflow validated.
**Delivers:** Hide upload dropzone after first photo, reorganize action buttons, status badge colors, loading states, error handling
**Addresses:** Progressive UI disclosure (competitive), Reorganize buttons (competitive)
**Avoids:** Standard UX improvements — no architectural risk
**Research flag:** No research needed — polish work

### Phase Ordering Rationale

- **Database first:** All features depend on deliveryToken column and Download table existing
- **ZIP before individual downloads:** ZIP is more complex; solving memory/timeout issues informs simpler individual download implementation
- **Backend before frontend:** Client UI can't function without working API endpoints
- **Photographer UI after client UI:** Delivery to clients is higher priority than dashboard polish
- **Polish last:** Non-blocking improvements should not delay core functionality shipping

This structure allows testing each phase independently:
- Phase 1: Verify token generation via database queries
- Phase 2: Test ZIP download with curl before building UI
- Phase 3: Test individual downloads independently
- Phase 4: Test delivery page with mock backend before integration
- Phases 5-6: Iterative UI improvements

### Research Flags

**Phases needing deeper research during planning:**
- Phase 2 (ZIP Generation): If ZipStream API issues arise, may need research-phase for large file handling patterns
- None others — all phases use well-documented patterns

**Phases with standard patterns (skip research-phase):**
- Phase 1: Standard database migration + token generation (existing patterns from shareId)
- Phase 3: Standard file download endpoint (existing upload patterns reversed)
- Phase 4: Standard React page with API integration (existing CollectionDetailsPage pattern)
- Phases 5-6: UI enhancement work (no research needed)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | maennchen/zipstream-php extensively documented, Composer package confirmed available, file-saver is mature stable library. All technologies have production track records. |
| Features | HIGH | Industry research from Pixieset, ShootProof, Pic-Time confirms table stakes expectations. Competitor feature analysis provides clear benchmarks. UX patterns validated across multiple platforms. |
| Architecture | HIGH | Two-token pattern is standard for selection/delivery separation. On-demand ZIP generation with streaming is proven approach for resource-constrained hosting. Download tracking schema follows established analytics patterns. |
| Pitfalls | HIGH | Zip Slip vulnerability documented in CVE databases, ZipStream memory issues confirmed in GitHub discussions, Hostinger limits verified in official docs. Double-counting patterns observed in GA4 analytics research. |

**Overall confidence:** HIGH

All research based on official documentation (PHP manual, ZipStream GitHub, MDN), verified Hostinger constraints (memory_limit, max_execution_time), and competitor feature analysis from production photo delivery platforms. No speculative or unverified sources.

### Gaps to Address

**Hostinger-specific ZIP limits:** Research shows 180s max_execution_time limit via .htaccess, but actual per-plan memory_limit values not confirmed. Should verify during Phase 2 implementation:
- Test ZIP generation with 50 photos (10MB each = 500MB total)
- Monitor memory usage and execution time in production
- If limits hit, fall back to pre-generation + processedZipPath approach

**Email token security (deferred to v2.1):** Pitfall #8 identifies risk of deliveryToken exposure in email logs, but two-step token system adds complexity. Decision: Accept risk for v2.0 (manual link sharing), implement email tokens only if email notifications added in v2.1.

**Download expiration policy:** Research suggests 30-90 day expiration windows based on photographer plan tier, but no firm requirements exist. Decision: Implement expiration infrastructure (deliveredAt + duration check) in Phase 1, configure actual durations during Phase 5 based on user feedback.

**Range request implementation complexity:** Pitfall #6 recommends HTTP 206 Partial Content support for resumable downloads, but adds ~50 lines of code. Decision: Implement for ZIP downloads (large files) in Phase 2, defer for individual photos unless mobile testing shows issues.

## Sources

### Primary (HIGH confidence)
- [maennchen/ZipStream-PHP GitHub](https://github.com/maennchen/ZipStream-PHP) — Library documentation, memory issues discussion (#185), performance comparison (#40)
- [PHP ZipArchive Manual](https://www.php.net/manual/en/class.ziparchive.php) — Native alternative documentation
- [PHP random_bytes Manual](https://www.php.net/manual/en/function.random-bytes.php) — Token generation
- [HTTP Range Requests (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) — 206 Partial Content specification
- [Hostinger PHP Memory Limits](https://www.hostinger.com/support/1583711-what-is-php-memory-limit-at-hostinger/) — Hosting constraints
- [Hostinger max_execution_time](https://www.hostinger.com/tutorials/how-to-fix-maximum-execution-time-exceeded-error-wordpress) — 180s maximum
- [file-saver npm](https://www.npmjs.com/package/file-saver) — Frontend library version 2.0.5 confirmed

### Secondary (MEDIUM confidence)
- [Pixieset Client Gallery](https://pixieset.com/client-gallery/) — Industry feature standards
- [ShootProof Features](https://www.shootproof.com/features/) — Competitor analysis
- [Best Photo Gallery for Photographers 2026](https://blog.pixieset.com/blog/best-photo-gallery/) — Best practices
- [Zip Slip Vulnerability (Snyk)](https://security.snyk.io/research/zip-slip-vulnerability) — Security patterns
- [Token Best Practices (Auth0)](https://auth0.com/docs/secure/tokens/token-best-practices) — Token security
- [GA4 Download Tracking Duplicate Events](https://www.analyticsmania.com/post/duplicate-events-in-google-analytics-4-and-how-to-fix-them/) — Double-counting prevention
- [Database Race Conditions Catalog](https://www.ketanbhatt.com/p/db-concurrency-defects) — Concurrency patterns
- [Gallery Expiration Best Practices](https://www.bp4ublog.com/photo-tips/how-long-do-i-leave-private-online-galleries-open/) — Timeline expectations

### Tertiary (LOW confidence)
- [Client Photo Delivery Guide](https://www.sendphoto.io/blog/client-photo-delivery-guide-professional-photographers) — UX patterns (marketing content, not technical)
- [Photography Workflow Tips 2026](https://aftershoot.com/blog/photography-workflow-tips/) — General workflow advice (not delivery-specific)

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
