# Requirements: Photo Hub

**Defined:** 2026-02-13
**Core Value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## v2.0 Requirements

Requirements for v2.0 Delivery & Polish release. Each maps to roadmap phases.

### Delivery System

- [ ] **DELIV-01**: Photographer can generate a separate delivery link for a collection
- [ ] **DELIV-02**: Delivery link uses a unique token (separate from shareId for security)
- [ ] **DELIV-03**: Delivery token is automatically generated when collection transitions to DELIVERED status
- [ ] **DELIV-04**: Selection link redirects to delivery page after collection reaches DELIVERED status
- [ ] **DELIV-05**: Client can access delivery page with token (no login required)
- [ ] **DELIV-06**: Delivery page displays only edited/final photos (clean gallery, no proofs)

### Downloads

- [ ] **DWNLD-01**: Client can download all edited photos as a single ZIP file
- [ ] **DWNLD-02**: ZIP generation uses streaming architecture to avoid server timeout/memory limits
- [ ] **DWNLD-03**: Client can download individual edited photos from grid view
- [ ] **DWNLD-04**: Client can download individual edited photos from lightbox view
- [ ] **DWNLD-05**: Individual downloads use file-saver library for cross-browser compatibility

### Download Tracking

- [ ] **TRACK-01**: System tracks ZIP download events in Download table
- [ ] **TRACK-02**: System tracks individual photo download events in Download table
- [ ] **TRACK-03**: Download tracking uses session-based deduplication to prevent double-counting
- [ ] **TRACK-04**: Collection transitions to DOWNLOADED status after first download (ZIP or individual)
- [ ] **TRACK-05**: Photographer can see download confirmation in collection details

### UI/UX Polish

- [ ] **UIPOL-01**: Upload dropzone hides after first photo is uploaded to a collection
- [ ] **UIPOL-02**: "Add More Photos" button appears after upload dropzone is hidden
- [ ] **UIPOL-03**: Collection details page has reorganized button layout (grouped by workflow phase)
- [ ] **UIPOL-04**: Share page has improved client action button placement
- [ ] **UIPOL-05**: Status badges and colors reflect new DOWNLOADED status in lifecycle

## v3.0+ Requirements (Future)

Deferred to future releases. Tracked but not in current roadmap.

### Cloud Storage

- **CLOUD-01**: Migrate from backend/uploads/ to S3/Cloudflare R2 cloud storage
- **CLOUD-02**: CDN integration for faster photo delivery

### Notifications

- **NOTIF-01**: Email notifications when finals are ready for download
- **NOTIF-02**: Email reminders for gallery expiration (30-90 days)

### Analytics & Management

- **ANALY-01**: Download analytics dashboard for photographers
- **ANALY-02**: Track which specific photos were downloaded individually
- **ANALY-03**: Display download timestamps and client session info

### Advanced Delivery

- **ADVDL-01**: Password-protected delivery links
- **ADVDL-02**: Gallery expiration dates with automated cleanup
- **ADVDL-03**: Multiple ZIP resolution options (web, print, original)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Client accounts / authentication | Deliberate design decision; zero-friction workflow requires link-only access |
| Real-time notifications (WebSockets) | Async workflow doesn't need instant updates; manual refresh sufficient |
| Pre-generated ZIPs (processedZipPath) | On-demand streaming simpler; defer pre-generation until analytics show need |
| Download quotas / rate limiting | Not needed at current scale; add if abuse detected |
| Watermark management | Not requested by users; defer until client feedback indicates need |
| ARCHIVED status workflow | Deferred to v3.0; not needed for v2.0 delivery features |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DELIV-01 | TBD | Pending |
| DELIV-02 | TBD | Pending |
| DELIV-03 | TBD | Pending |
| DELIV-04 | TBD | Pending |
| DELIV-05 | TBD | Pending |
| DELIV-06 | TBD | Pending |
| DWNLD-01 | TBD | Pending |
| DWNLD-02 | TBD | Pending |
| DWNLD-03 | TBD | Pending |
| DWNLD-04 | TBD | Pending |
| DWNLD-05 | TBD | Pending |
| TRACK-01 | TBD | Pending |
| TRACK-02 | TBD | Pending |
| TRACK-03 | TBD | Pending |
| TRACK-04 | TBD | Pending |
| TRACK-05 | TBD | Pending |
| UIPOL-01 | TBD | Pending |
| UIPOL-02 | TBD | Pending |
| UIPOL-03 | TBD | Pending |
| UIPOL-04 | TBD | Pending |
| UIPOL-05 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 21 total
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after initial definition*
