# Feature Research

**Domain:** Photographer client gallery / photo delivery web app
**Researched:** 2026-02-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive photo grid view | Every gallery app has grid browsing; clients expect it on mobile | MEDIUM | Masonry or uniform grid; must handle portrait/landscape mix |
| Fullscreen / lightbox viewer | Clicking a photo to view it large is instinctive user behavior | MEDIUM | Arrow navigation, keyboard support, close on ESC |
| Client access via link (no account) | Clients are not photographers; forcing account creation causes abandonment | LOW | Token in URL is the standard pattern (Pixieset, ShootProof, Pic-Time all do this) |
| Photo selection / favorites | Core proofing workflow — client marks which photos go to editing | MEDIUM | Toggle per photo; running count shown; confirmation before submit |
| Selection count feedback | Client needs to know how many they've selected vs the allowed quota | LOW | "12 of 20 selected" indicator; real-time |
| Photographer view of client selections | Photographer must see what the client picked before editing | LOW | Filter: All / Selected / Not Selected |
| Download individual photos | Clients expect to save specific photos to their device | LOW | Direct file download; content-disposition header |
| Download all as ZIP | Clients don't want to download 200 files one by one | MEDIUM | Server-side ZIP generation; progress feedback |
| Download block during selection stage | Photographer needs to control when finals are available | LOW | Status gate; no download links rendered until DELIVERED |
| Gallery link sharing (copy link) | Photographer sends link to client — this is the core delivery verb | LOW | Copy-to-clipboard button; share via message |
| Collection status visibility | Photographer needs to know at a glance where each job stands | LOW | Status label or color on collection card |
| Password / access protection | Prevent accidental public exposure of client photos | MEDIUM | Optional password on top of token; Pixieset, ShootProof both offer this |
| Mobile-friendly gallery | Clients browse on phones; desktop-only is unacceptable | MEDIUM | Touch swipe for lightbox; responsive grid |
| Photo upload by photographer | Photographer must get photos into the system | MEDIUM | Multi-file upload; progress indicator; stored in backend/uploads/ |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Selection quota enforcement | Photographer sets a maximum number of selectable photos (e.g. "pick 30 of 120") | LOW | Prevents scope creep on editing; few competitors enforce this server-side |
| Two-stage delivery (selection then finals) | Clear separation of proofing vs. delivery reduces confusion and re-edit requests | LOW | The SELECTING → REVIEWING → DELIVERED lifecycle is a strong UX model |
| Edited finals linked to originals | Photographer uploads edited version tied to the original — client sees the evolution | MEDIUM | EditedPhoto table already in schema; display side-by-side or replace-in-place |
| No client account required | Lowest friction for clients; photographers appreciate this when recommending the tool | LOW | Already planned; token-only access is a genuine differentiator at lower price points |
| Collection status color coding | Instant visual job status on the collections list without opening each one | LOW | SELECTING = blue, REVIEWING = green, DELIVERED = purple; already in requirements |
| Per-photo client notes / comments | Client can annotate a specific photo with editing instructions | HIGH | Depends on Selection table having a notes column; high value for retouching workflows |
| Expiring gallery links | Links auto-expire after a configurable period; protects long-term exposure | MEDIUM | Expiry timestamp on token; cron or check-on-access invalidation |
| Selection submission confirmation | Client explicitly submits their selection rather than it being implicit | LOW | Prevents accidental partial selections; sends a "submitted" signal the photographer can see |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time updates (WebSocket / SSE) | "Notify me instantly when client selects photos" | Significant infrastructure overhead; overkill for async photography workflow where hours pass between actions | Manual refresh or simple polling on the selections view is sufficient |
| Client accounts and login | "I want to track multiple clients" | Adds onboarding friction for clients who are one-time users; shifts UX burden to them | Token-per-collection gives the same isolation without accounts |
| In-app messaging / chat | "I want to communicate with clients in the platform" | Turns a gallery tool into a CRM; scope creep; clients already have email | Use email outside the app; keep the platform focused on photo delivery |
| Automatic cloud storage sync (S3 / R2) | "Photos should be backed up automatically" | Cloud storage integration adds cost, latency, and significant dev complexity | Plan the migration as a future milestone; local storage works for current scale |
| Print store / e-commerce | "Clients can buy prints" | Payment processing, print fulfillment, and tax handling are entirely separate product domains | Explicitly out of scope; Pixieset and Pic-Time took years to build this well |
| Lightroom / Capture One plugin | "Export directly from Lightroom" | Desktop plugin development is a separate engineering track entirely | Straightforward multi-file upload from file system is sufficient; photographers can export first |
| Watermarking previews | "Protect images during selection phase" | Server-side watermarking is CPU-intensive per request; client-side CSS overlays are bypassable | The access token and download block during SELECTING stage is sufficient protection for the target market |
| Social sharing of individual photos | "Let clients share to Instagram" | Creates uncontrolled distribution of photos before the photographer approves | Photographer controls distribution via delivery link only |

## Feature Dependencies

```
[Photo Upload by Photographer]
    └──required by──> [Client Gallery View]
                          └──required by──> [Photo Selection by Client]
                                                └──required by──> [Photographer Selection Review]
                                                                      └──required by──> [Edited Finals Upload]
                                                                                            └──required by──> [Delivery Link + Download]

[Token-Based Access]
    └──required by──> [Client Gallery View]
    └──required by──> [Photo Selection by Client]
    └──required by──> [Delivery Link + Download]

[Collection Status (SELECTING → REVIEWING → DELIVERED)]
    └──gates──> [Download Block during SELECTING]
    └──gates──> [Download enabled at DELIVERED]

[Selection Quota Enforcement]
    └──enhances──> [Photo Selection by Client]

[Selection Submission Confirmation]
    └──enhances──> [Photo Selection by Client]
    └──triggers──> [Status transition: SELECTING → REVIEWING]

[ZIP Download]
    └──requires──> [Delivery Link + Download]
    └──requires──> [Server-side ZIP generation (PHP)]
```

### Dependency Notes

- **Photo Upload requires nothing upstream:** It is the entry point of the entire workflow; nothing else can be built or tested without it.
- **Token-Based Access is a cross-cutting dependency:** Every client-facing feature (gallery view, selection, download) requires a valid token to be resolved server-side.
- **Collection Status gates download availability:** The download UI must check collection status before rendering any download link or ZIP button; rendering them conditionally is simpler than a separate permissions model.
- **Selection Submission Confirmation triggers status transition:** When client confirms their selection, the collection moves from SELECTING to REVIEWING automatically — this is the handoff signal to the photographer.
- **ZIP Download requires server-side PHP:** Large photo sets make client-side ZIP generation impractical; PHP ZipArchive streaming is the correct implementation for the current stack.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Multi-photo upload by photographer to a collection — required to populate galleries
- [ ] Responsive client gallery grid view (token-authenticated, no client account) — core client experience
- [ ] Fullscreen / lightbox viewer with navigation — expected behavior; gallery without it feels broken
- [ ] Photo selection by client (toggle favorites, running count) — the proofing workflow
- [ ] Download block during SELECTING stage — protects finals from premature access
- [ ] Photographer view of client selections with All/Selected/Not-Selected filter — required to start editing
- [ ] Edited finals upload by photographer — the delivery half of the workflow
- [ ] Individual photo download by client (DELIVERED stage only) — minimum viable delivery
- [ ] ZIP archive download of all finals (DELIVERED stage only) — needed for large galleries; impractical to download one by one
- [ ] Collection status color coding on cards (SELECTING = blue, REVIEWING = green, DELIVERED = purple) — visual workflow management

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Selection quota enforcement (photographer sets max selectable count) — add when photographers report scope creep issues
- [ ] Selection submission confirmation (explicit "submit my selection" button) — add when photographers report receiving incomplete selections
- [ ] Expiring gallery links — add when photographers ask about link security after delivery
- [ ] Password protection as second factor on top of token — add if photographers serving high-profile clients request it

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Per-photo client notes / editing instructions — high value but high complexity; defer until base workflow is validated
- [ ] Email notifications (selection submitted, delivery ready) — requires email infrastructure; out of scope for this milestone
- [ ] Cloud storage migration (S3 / Cloudflare R2) — planned but not needed until storage limits are hit
- [ ] Gallery analytics / download tracking — nice-to-have; Pixieset offers this but it is not critical for core workflow

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Photo upload (multi-file) | HIGH | MEDIUM | P1 |
| Client gallery grid view (token) | HIGH | MEDIUM | P1 |
| Fullscreen lightbox viewer | HIGH | MEDIUM | P1 |
| Photo selection (toggle + count) | HIGH | LOW | P1 |
| Download block during SELECTING | HIGH | LOW | P1 |
| Photographer selection review + filter | HIGH | LOW | P1 |
| Edited finals upload | HIGH | MEDIUM | P1 |
| Individual photo download (DELIVERED) | HIGH | LOW | P1 |
| ZIP download (DELIVERED) | HIGH | MEDIUM | P1 |
| Collection status color coding | MEDIUM | LOW | P1 |
| Selection quota enforcement | MEDIUM | LOW | P2 |
| Selection submission confirmation | MEDIUM | LOW | P2 |
| Expiring gallery links | MEDIUM | MEDIUM | P2 |
| Password protection (second factor) | MEDIUM | MEDIUM | P2 |
| Per-photo client notes | HIGH | HIGH | P3 |
| Email notifications | MEDIUM | HIGH | P3 |
| Gallery analytics / download tracking | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Pixieset | ShootProof | Pic-Time / CloudSpot | Our Approach |
|---------|----------|------------|----------------------|--------------|
| Client access model | Token link + optional password | Token link + PIN + email-gated | Token link + optional password | Token-only; no client account required |
| Photo selection / proofing | Favorites + notes + activity tracking | Favorites + album labels | Favorites + comments | Toggle selection; count display; submit confirmation |
| Download control | Photographer sets download permissions per gallery | Per-contact download permissions (resolution + quantity) | Photographer enables/disables downloads | Status-gated: no downloads during SELECTING, full access at DELIVERED |
| ZIP delivery | Yes (whole gallery or selection) | Yes (zip emailed or direct) | Yes | Server-side PHP ZipArchive streaming |
| Edited finals linking | Not exposed as a concept (same gallery updated) | Not explicitly separated | Not explicitly separated | EditedPhoto table; finals replace or accompany originals in DELIVERED view |
| Collection status workflow | Implicit (photographer manually manages) | Implicit | Implicit | Explicit lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED |
| Client account requirement | No (link-based) | No (link-based, optional email) | No (link-based) | No — deliberate design decision |
| Print store / e-commerce | Yes (core feature) | Yes (core feature) | Yes (core feature) | Explicitly out of scope |
| Lightroom plugin | Yes (free) | Yes | Yes (Pic-Time) | Out of scope; file system upload sufficient |
| Mobile app for clients | Yes (mobile-responsive + app) | Yes (unlimited mobile apps) | Yes | Mobile-responsive web; no native app |

## Sources

- [Pixieset Client Gallery](https://pixieset.com/client-gallery/) — feature set and positioning
- [Pixieset Blog: 15+ Features You Didn't Know About](https://blog.pixieset.com/blog/pixieset-client-gallery-features/) — detailed feature breakdown
- [ShootProof Features](https://www.shootproof.com/features/) — download controls, PIN protection, label-based selection
- [ShootProof FAQs](https://help.shootproof.com/hc/en-us/articles/360062280593-ShootProof-FAQs) — delivery mechanics
- [Pixieset vs ShootProof Comparison](https://colesclassroom.com/comparing-client-photo-galleries-pixieset-vs-shootproof/) — feature parity analysis
- [CloudSpot vs Pic-Time](https://laurenoliviacreations.com/tips-and-tricks/cloudspot-versus-pic-time-which-is-better/) — CRM and gallery feature comparison
- [Top 10 Client Gallery Services 2025](https://picflow.com/blog/top-client-gallery-services) — market landscape
- [Pixieset Blog: Helping Clients Choose Favorites Faster](https://blog.pixieset.com/blog/favorite-photos-online-proofing/) — UX best practices for selection workflow
- [PicDrop: Client Gallery Best Practices](https://www.picdrop.com/web/articles/client-photo-gallery-best-practices) — organization and feedback patterns
- [Zenfolio: Watermark and Security Features](https://zenfolio.com/features/security/) — protection mechanisms
- [Lightfolio: Client Photo Gallery](https://www.lightfolio.com/) — alternative minimalist approach

---
*Feature research for: photographer client gallery / photo delivery web app (pixelforge.pro)*
*Researched: 2026-02-11*
