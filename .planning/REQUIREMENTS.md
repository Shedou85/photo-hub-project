# Requirements: Photo Hub (PixelForge)

**Defined:** 2026-02-11
**Core Value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Upload

- [ ] **UPLOAD-01**: Photographer can upload multiple photos to a collection
- [ ] **UPLOAD-02**: Collection cover is automatically set to the first uploaded photo
- [ ] **UPLOAD-03**: Photographer can manually override the collection cover photo

### Client Gallery

- [ ] **GALLERY-01**: Client can browse collection photos in a responsive grid
- [ ] **GALLERY-02**: Client can view a photo fullscreen with prev/next navigation (lightbox)
- [ ] **GALLERY-03**: Client cannot download photos when collection status is SELECTING

### Sharing

- [ ] **SHARE-01**: Photographer can generate a token-based share URL for a collection
- [ ] **SHARE-02**: Client can access the collection via share link without creating an account
- [ ] **SHARE-03**: Collection card displays status color (blue = SELECTING, green = REVIEWING)

### Selection

- [ ] **SELEC-01**: Client can mark/unmark individual photos for editing
- [ ] **SELEC-02**: Client can see a running count of their selected photos

### Photographer Review

- [ ] **REVIEW-01**: Photographer can see which photos the client selected
- [ ] **REVIEW-02**: Photographer can filter photos by All / Selected / Not Selected
- [ ] **REVIEW-03**: Collection card turns green when client has completed selections (REVIEWING status)

### Delivery

- [ ] **DELIV-01**: Photographer can upload edited final photos to the collection

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Upload

- **UPLOAD-04**: Upload progress indicator per file during upload

### Delivery

- **DELIV-02**: Photographer can generate a separate delivery link for the client
- **DELIV-03**: Client can download individual photos in the DELIVERED stage
- **DELIV-04**: Client can download all delivered photos as a ZIP archive (server-side streaming)

### Gallery

- **GALLERY-04**: Thumbnail generation at upload time (PHP GD) for faster grid load
- **GALLERY-05**: Collection card displays status color for DELIVERED stage (purple)

### Sharing

- **SHARE-04**: Share links have an expiry date
- **SHARE-05**: Gallery links can be password-protected

### Selection

- **SELEC-03**: Photographer sets a maximum selection count; client cannot exceed it
- **SELEC-04**: Client submits selections with an explicit confirm button (triggers REVIEWING transition)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud storage (S3/R2) | Deferred — using backend/uploads/ now; migration planned for future milestone |
| Client accounts | By design — client access is link-only; no account friction |
| Email notifications | Requires email infrastructure (SendGrid/SES); out of scope |
| Real-time updates (WebSockets) | Not needed; manual refresh sufficient for this workflow |
| Per-photo client notes | High value but requires schema change and complex UI — v2+ |
| Gallery analytics | Not needed for core workflow — v2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPLOAD-01 | — | Pending |
| UPLOAD-02 | — | Pending |
| UPLOAD-03 | — | Pending |
| GALLERY-01 | — | Pending |
| GALLERY-02 | — | Pending |
| GALLERY-03 | — | Pending |
| SHARE-01 | — | Pending |
| SHARE-02 | — | Pending |
| SHARE-03 | — | Pending |
| SELEC-01 | — | Pending |
| SELEC-02 | — | Pending |
| REVIEW-01 | — | Pending |
| REVIEW-02 | — | Pending |
| REVIEW-03 | — | Pending |
| DELIV-01 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️ (populated by roadmapper)

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
