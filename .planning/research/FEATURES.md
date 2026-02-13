# Feature Research

**Domain:** Photographer client gallery / photo delivery web app
**Researched:** 2026-02-11 (initial), 2026-02-13 (v2.0 delivery features update)
**Confidence:** HIGH (initial research), MEDIUM (v2.0 delivery-specific research)

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
| Download individual photos | Clients expect to save specific photos to their device | LOW | Direct file download; content-disposition header. **v2.0 FOCUS** |
| Download all as ZIP | Clients don't want to download 200 files one by one; professional standard is "click one button to download everything" | MEDIUM | Server-side ZIP generation; progress feedback. SmugMug, Pixieset, PassGallery all do this. **v2.0 FOCUS** |
| Download block during selection stage | Photographer needs to control when finals are available | LOW | Status gate; no download links rendered until DELIVERED |
| Gallery link sharing (copy link) | Photographer sends link to client — this is the core delivery verb | LOW | Copy-to-clipboard button; share via message |
| Collection status visibility | Photographer needs to know at a glance where each job stands | LOW | Status label or color on collection card |
| Password / access protection | Prevent accidental public exposure of client photos | MEDIUM | Optional password on top of token; Pixieset, ShootProof both offer this |
| Mobile-friendly gallery | Clients browse on phones; desktop-only is unacceptable | MEDIUM | Touch swipe for lightbox; responsive grid |
| Photo upload by photographer | Photographer must get photos into the system | MEDIUM | Multi-file upload; progress indicator; stored in backend/uploads/ |
| Separate delivery link | Industry standard - selection and delivery are distinct phases | LOW | Clients expect proofing link (select) ≠ delivery link (download finals). Platforms like picdrop and Pic-Time separate these workflows. **v2.0 FOCUS** |
| Download status tracking | Photographers need confirmation clients received images | LOW | Track which files downloaded and when. Pixieset shows "who downloaded photos or videos, and which files exactly". Lightfolio "tracks download delivery". Collection transitions to DOWNLOADED status. **v2.0 FOCUS** |

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
| Expiring gallery links | Links auto-expire after a configurable period; protects long-term exposure | MEDIUM | Expiry timestamp on token; cron or check-on-access invalidation. Standard: 3-6 months for weddings, 3-4 weeks for sessions. Email automations send "gallery expiring in 7 days". **v2.0 DEFER to v2.x** |
| Selection submission confirmation | Client explicitly submits their selection rather than it being implicit | LOW | Prevents accidental partial selections; sends a "submitted" signal the photographer can see |
| Integrated selection → delivery flow | Single share link that adapts to collection status vs separate links clients must manage | LOW | Current Photo Hub approach - selection link redirects to delivery page when status = DELIVERED. Simpler for clients than juggling multiple URLs. **v2.0 FOCUS** |
| Automatic delivery link generation on DELIVERED transition | Reduces photographer friction - no manual "send delivery link" step | LOW | Most platforms require photographer to manually send separate delivery link. Auto-generation would streamline workflow. **v2.0 FOCUS** |
| Progressive UI disclosure (hide upload after first photo) | Cleaner interface once photos exist - reduces visual clutter | LOW | Uncommon pattern but high UX value. Upload dropzone becomes visual noise once collection has content. Show "Add more photos" button instead. **v2.0 FOCUS** |
| Optimistic download tracking | Instant UI feedback vs polling for status | MEDIUM | Photo Hub already uses optimistic updates for selections - apply same pattern to downloads. Competitors typically poll or require page refresh. **v2.0 FOCUS** |
| Selective finals upload | Photographer uploads only client-selected photos as finals (not all photos) | LOW | Natural fit with selection workflow - only edited versions of selected photos need delivery. Most platforms deliver all or nothing. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time updates (WebSocket / SSE) | "Notify me instantly when client selects photos" or "Notify instantly when client downloads" | Significant infrastructure overhead; overkill for async photography workflow where hours pass between actions. Adds WebSocket/polling complexity for minimal value. | Manual refresh or simple polling on the selections view is sufficient. Async download tracking viewable in dashboard. Email digest summarizing downloads daily/weekly. |
| Client accounts and login | "I want to track multiple clients" | Adds onboarding friction for clients who are one-time users; shifts UX burden to them | Token-per-collection gives the same isolation without accounts |
| In-app messaging / chat | "I want to communicate with clients in the platform" | Turns a gallery tool into a CRM; scope creep; clients already have email | Use email outside the app; keep the platform focused on photo delivery |
| Automatic cloud storage sync (S3 / R2) | "Photos should be backed up automatically" | Cloud storage integration adds cost, latency, and significant dev complexity | Plan the migration as a future milestone; local storage works for current scale |
| Print store / e-commerce | "Clients can buy prints" | Payment processing, print fulfillment, and tax handling are entirely separate product domains | Explicitly out of scope; Pixieset and Pic-Time took years to build this well |
| Lightroom / Capture One plugin | "Export directly from Lightroom" | Desktop plugin development is a separate engineering track entirely | Straightforward multi-file upload from file system is sufficient; photographers can export first |
| Watermarking previews | "Protect images during selection phase" | Server-side watermarking is CPU-intensive per request; client-side CSS overlays are bypassable | The access token and download block during SELECTING stage is sufficient protection for the target market |
| Social sharing of individual photos | "Let clients share to Instagram" | Creates uncontrolled distribution of photos before the photographer approves | Photographer controls distribution via delivery link only |
| Unlimited gallery storage | Clients want permanent access "just in case" | Creates indefinite hosting costs and platform dependency. Clients stop downloading their own copies. Gallery becomes backup service. | 3-6 month expiration with clear communication. Encourage clients to download and store locally. Offer paid extension for emergencies. **v2.0 NOTE** |
| Unlimited ZIP size | Clients want single download for 500+ photos | Server memory/timeout issues. Large ZIPs fail on slow connections. | Split into multiple ZIPs (e.g., 100 photos per archive) like SmugMug. Provide individual download option. **v2.0 NOTE** |
| Watermark removal on download | Photographers want automatic watermark stripping when client downloads | Complex image processing. Edited finals shouldn't have watermarks if intended for client delivery. | Upload clean finals without watermarks for DELIVERED collections. Watermarks are for preview galleries only. **v2.0 NOTE** |
| Per-photo download tracking UI | Show download icon on each photo in grid | Visual clutter, limited value. Photographers care about "did client get their photos?" not "did they download IMG_1234 vs IMG_1235?" | Collection-level DOWNLOADED status when client has downloaded ZIP or significant portion of individual photos. Detailed tracking in analytics (v3+). **v2.0 NOTE** |
| Client download limits | Photographers want to restrict how many times client can download | Creates support burden when clients legitimately lose files. Penalizes clients for photographer's bandwidth concerns. | Unlimited downloads within expiration window. If bandwidth is concern, address via hosting/CDN upgrade. **v2.0 NOTE** |

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
    └──extends to──> [DOWNLOADED status] **v2.0 FOCUS**

[Selection Quota Enforcement]
    └──enhances──> [Photo Selection by Client]

[Selection Submission Confirmation]
    └──enhances──> [Photo Selection by Client]
    └──triggers──> [Status transition: SELECTING → REVIEWING]

[ZIP Download]
    └──requires──> [Delivery Link + Download]
    └──requires──> [Server-side ZIP generation (PHP)]

[DELIVERED status] (existing)
    └──enables──> [Separate delivery link] **v2.0 FOCUS**
                       ├──enables──> [ZIP download all finals] **v2.0 FOCUS**
                       ├──enables──> [Individual photo download] **v2.0 FOCUS**
                       └──enables──> [DOWNLOADED status tracking] **v2.0 FOCUS**

[EditedPhoto table] (existing)
    └──required by──> [ZIP download all finals] **v2.0 FOCUS**
    └──required by──> [Individual photo download] **v2.0 FOCUS**

[Share page redirect logic] (new)
    └──requires──> [DELIVERED status detection] **v2.0 FOCUS**
    └──requires──> [Separate delivery link generation] **v2.0 FOCUS**

[Hide upload dropzone] (UI polish)
    └──requires──> [Photo count check] **v2.0 FOCUS**
    └──independent of delivery features
```

### Dependency Notes

- **Photo Upload requires nothing upstream:** It is the entry point of the entire workflow; nothing else can be built or tested without it.
- **Token-Based Access is a cross-cutting dependency:** Every client-facing feature (gallery view, selection, download) requires a valid token to be resolved server-side.
- **Collection Status gates download availability:** The download UI must check collection status before rendering any download link or ZIP button; rendering them conditionally is simpler than a separate permissions model.
- **Selection Submission Confirmation triggers status transition:** When client confirms their selection, the collection moves from SELECTING to REVIEWING automatically — this is the handoff signal to the photographer.
- **ZIP Download requires server-side PHP:** Large photo sets make client-side ZIP generation impractical; PHP ZipArchive streaming is the correct implementation for the current stack.
- **Separate delivery link requires DELIVERED status:** Cannot generate delivery link until collection has EditedPhotos and status = DELIVERED. Builds on existing status transition system. **v2.0 FOCUS**
- **ZIP download requires EditedPhoto table:** ZIP archives final edited versions only (not original selection photos). Database already has EditedPhoto table from v1.0. **v2.0 FOCUS**
- **Individual download enhances ZIP download:** Clients get flexibility - bulk download for all, individual for specific images. Both use same EditedPhoto source. **v2.0 FOCUS**
- **DOWNLOADED status enhances DELIVERED:** Extends lifecycle tracking. Triggered when client downloads ZIP or majority of individual photos. Independent tracking table recommended. **v2.0 FOCUS**
- **Share page redirect requires delivery link:** When client visits selection share link after DELIVERED status, redirect to delivery page. Selection link becomes legacy after editing complete. **v2.0 FOCUS**
- **Hide upload dropzone independent of delivery:** UI polish feature - no dependencies on download system. Can ship in same milestone but separate implementation. **v2.0 FOCUS**

## MVP Definition

### Launch With (v1) — SHIPPED 2026-02-13

Minimum viable product — what's needed to validate the concept.

- [x] Multi-photo upload by photographer to a collection — required to populate galleries
- [x] Responsive client gallery grid view (token-authenticated, no client account) — core client experience
- [x] Fullscreen / lightbox viewer with navigation — expected behavior; gallery without it feels broken
- [x] Photo selection by client (toggle favorites, running count) — the proofing workflow
- [x] Download block during SELECTING stage — protects finals from premature access
- [x] Photographer view of client selections with All/Selected/Not-Selected filter — required to start editing
- [x] Edited finals upload by photographer — the delivery half of the workflow
- [x] Collection status color coding on cards (SELECTING = blue, REVIEWING = green, DELIVERED = purple) — visual workflow management

### Launch With (v2.0) — CURRENT MILESTONE

Delivery and download features — completes the photographer-to-client workflow.

- [ ] **Separate delivery link** — Table stakes. Industry expects selection and delivery to be separate experiences.
- [ ] **ZIP download all finals** — Table stakes. Clients expect "download all" button. Server-side PHP ZIP generation.
- [ ] **Individual photo download** — Table stakes. Flexibility for clients who want specific images only. Download button in lightbox + grid view.
- [ ] **DOWNLOADED status tracking** — Table stakes. Photographers need confirmation delivery was received. Collection transitions to DOWNLOADED status.
- [ ] **Share link redirect logic** — Enhances integrated flow. Selection link redirects to delivery page when status = DELIVERED.
- [ ] **Hide upload dropzone after first photo** — UI polish. Reduces clutter once collection has content. Show "Add more photos" button instead.
- [ ] **Reorganize collection details buttons** — UI polish. Improve action flow clarity for photographer.
- [ ] **Reorganize share page layout** — UI polish. Improve client action clarity on delivery page.

### Add After Validation (v2.x)

Features to add once core delivery workflow is working.

- [ ] **Gallery expiration dates** — Implement 3-6 month expiration windows with email reminders. Standard: 3-6 months for weddings, 3-4 weeks for sessions. Wait for email infrastructure setup before implementing automated reminders.
- [ ] Selection quota enforcement (photographer sets max selectable count) — add when photographers report scope creep issues
- [ ] Selection submission confirmation (explicit "submit my selection" button) — add when photographers report receiving incomplete selections
- [ ] Password protection as second factor on top of token — add if photographers serving high-profile clients request it
- [ ] **Download analytics** — Track which specific photos clients download. Surface in photographer dashboard. Defer until photographers request it.
- [ ] **Multiple ZIP size options** — Let clients choose resolution (full/web). Requires EditedPhoto variants. Defer until bandwidth concerns arise.
- [ ] **Delivery page customization** — Photographer branding (logo, colors) on delivery page. Differentiator but not needed for core workflow.

### Future Consideration (v3+)

Features to defer until product-market fit is established.

- [ ] Per-photo client notes / editing instructions — high value but high complexity; defer until base workflow is validated
- [ ] Email notifications (selection submitted, delivery ready) — requires email infrastructure; out of scope for this milestone
- [ ] Cloud storage migration (S3 / Cloudflare R2) — planned but not needed until storage limits are hit
- [ ] Gallery analytics / download tracking (advanced) — nice-to-have; Pixieset offers this but it is not critical for core workflow
- [ ] **Password-protected delivery links** — Security feature. Defer until client requests or compliance requirements emerge.
- [ ] **CDN integration for downloads** — Performance optimization. Defer until download volume justifies CDN costs.
- [ ] **Client download history** — Track all downloads across all collections for a client email. Requires client identity system. Conflicts with "no client accounts" philosophy.
- [ ] **ZIP resume support** — Handle failed large downloads. Complex implementation, edge case for typical collection sizes.
- [ ] **Preview before download** — Client previews edited photos before downloading. Useful but adds UI complexity - lightbox already serves this for individual downloads.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Photo upload (multi-file) | HIGH | MEDIUM | P1 (v1.0 SHIPPED) |
| Client gallery grid view (token) | HIGH | MEDIUM | P1 (v1.0 SHIPPED) |
| Fullscreen lightbox viewer | HIGH | MEDIUM | P1 (v1.0 SHIPPED) |
| Photo selection (toggle + count) | HIGH | LOW | P1 (v1.0 SHIPPED) |
| Download block during SELECTING | HIGH | LOW | P1 (v1.0 SHIPPED) |
| Photographer selection review + filter | HIGH | LOW | P1 (v1.0 SHIPPED) |
| Edited finals upload | HIGH | MEDIUM | P1 (v1.0 SHIPPED) |
| Collection status color coding | MEDIUM | LOW | P1 (v1.0 SHIPPED) |
| **Separate delivery link** | **HIGH** | **LOW** | **P1 (v2.0 TARGET)** |
| **ZIP download all finals** | **HIGH** | **MEDIUM** | **P1 (v2.0 TARGET)** |
| **Individual photo download** | **HIGH** | **LOW** | **P1 (v2.0 TARGET)** |
| **DOWNLOADED status tracking** | **HIGH** | **LOW** | **P1 (v2.0 TARGET)** |
| **Share link redirect logic** | **MEDIUM** | **LOW** | **P1 (v2.0 TARGET)** |
| **Hide upload dropzone** | **MEDIUM** | **LOW** | **P1 (v2.0 TARGET)** |
| **Reorganize buttons (details)** | **MEDIUM** | **LOW** | **P1 (v2.0 TARGET)** |
| **Reorganize buttons (share)** | **MEDIUM** | **LOW** | **P1 (v2.0 TARGET)** |
| Gallery expiration dates | HIGH | MEDIUM | P2 (v2.x) |
| Selection quota enforcement | MEDIUM | LOW | P2 |
| Selection submission confirmation | MEDIUM | LOW | P2 |
| Password protection (second factor) | MEDIUM | MEDIUM | P2 |
| Download analytics | MEDIUM | MEDIUM | P2 (v2.x) |
| Multiple ZIP resolutions | LOW | HIGH | P3 |
| Delivery page branding | MEDIUM | MEDIUM | P3 |
| Per-photo client notes | HIGH | HIGH | P3 |
| Email notifications | MEDIUM | HIGH | P3 |
| Password-protected delivery | MEDIUM | MEDIUM | P3 |
| CDN integration | LOW | HIGH | P3 |

**Priority key:**
- P1 (v1.0 SHIPPED): Must have for launch — basic workflow validated
- P1 (v2.0 TARGET): Must have for v2.0 — completes delivery workflow
- P2: Should have, add when possible (v2.x+)
- P3: Nice to have, future consideration (v3+)

## Competitor Feature Analysis

| Feature | Pixieset | ShootProof | Pic-Time / CloudSpot | Our Approach |
|---------|----------|------------|----------------------|--------------|
| Client access model | Token link + optional password | Token link + PIN + email-gated | Token link + optional password | Token-only; no client account required |
| Photo selection / proofing | Favorites + notes + activity tracking | Favorites + album labels | Favorites + comments | Toggle selection; count display; submit confirmation |
| Download control | Photographer sets download permissions per gallery | Per-contact download permissions (resolution + quantity) | Photographer enables/disables downloads | Status-gated: no downloads during SELECTING, full access at DELIVERED |
| ZIP delivery | Yes (whole gallery or selection) | Yes (zip emailed or direct) | Yes | Server-side PHP ZipArchive streaming. **v2.0 FOCUS** |
| Individual download | Yes - download button per photo | Yes - download individual or selected subset | Yes - per-photo download | Yes - download button in lightbox + grid view. **v2.0 FOCUS** |
| Download tracking | Yes - shows who downloaded, which files, when | Yes - analytics dashboard | Yes - download history per client | Yes - collection transitions to DOWNLOADED status, track download events. **v2.0 FOCUS** |
| Separate delivery link | Yes - proofing vs delivery galleries separate | Yes - different gallery types | Yes - explicit workflow separation | Yes - selection link redirects to delivery page when DELIVERED. **v2.0 FOCUS** |
| Gallery expiration | Yes - automated reminders, configurable timeframes | Yes - manual or scheduled expiration | Yes - expiration with extension option | Defer to v2.x - requires email infrastructure |
| Multiple ZIPs | No - single ZIP | Yes - 100-200 photos per ZIP | No - single ZIP | Start with single ZIP, split if collection sizes grow |
| Analytics | Yes - detailed view/download analytics | Yes - comprehensive analytics suite | Yes - engagement metrics | Defer to v2.x - track data but don't surface analytics yet |
| Edited finals linking | Not exposed as a concept (same gallery updated) | Not explicitly separated | Not explicitly separated | EditedPhoto table; finals replace or accompany originals in DELIVERED view |
| Collection status workflow | Implicit (photographer manually manages) | Implicit | Implicit | Explicit lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED **v2.0 EXTENSION** |
| Client account requirement | No (link-based) | No (link-based, optional email) | No (link-based) | No — deliberate design decision |
| Print store / e-commerce | Yes (core feature) | Yes (core feature) | Yes (core feature) | Explicitly out of scope |
| Lightroom plugin | Yes (free) | Yes | Yes (Pic-Time) | Out of scope; file system upload sufficient |
| Mobile app for clients | Yes (mobile-responsive + app) | Yes (unlimited mobile apps) | Yes | Mobile-responsive web; no native app |

## Behavior Expectations Research (v2.0 Addition)

### Client Download Patterns

**Expected timeline:** Clients download within 2 weeks to 1 month of delivery notification. Weddings: 1-3 months. Engagement sessions: 3 weeks standard.

**Download preferences:** Majority use "download all" ZIP for convenience. Individual downloads used for specific photos to share on social media quickly without extracting full ZIP.

**Platform expectations:** Clients expect gallery to work like Dropbox/Google Drive - click button, file downloads. No complex workflows. Password protection common for weddings (sensitive personal photos), less so for professional headshots or product shoots.

### Photographer Workflow Patterns

**Delivery notification:** Photographers manually share delivery link with client (email, text, etc.) when finals are ready. Automated email notifications deferred until email infrastructure exists.

**Status tracking:** Photographers check dashboard to confirm client downloaded photos. Color-coded collection cards for at-a-glance status. Don't need individual photo granularity - "did client get their photos?" is sufficient.

**Gallery management:** Photographers expect to manage 20-50 active collections simultaneously. At-a-glance status is critical. Bulk actions for archiving old collections.

**Expiration enforcement:** Strict expiration dates (with reminders) prevent clients from using gallery as permanent backup. Photographers want to avoid indefinite hosting costs and platform dependency. Fee for gallery re-opening or extension discourages delayed downloads.

## Sources

**Initial Research (2026-02-11):**
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

**v2.0 Delivery Features Research (2026-02-13):**

**Industry Standards & Best Practices:**
- [Best Ways to Share Photos with Clients in 2026](https://lovely-imgs.com/blogs/how-to-share-photos-with-clients)
- [2026 Ins & Outs for Professional Photographers](https://www.blog.bayphoto.com/post/2026-ins-outs-for-professional-photographers)
- [Best Photo Gallery for Photographers in 2026](https://blog.pixieset.com/blog/best-photo-gallery/)
- [Finding the Best Client Gallery for Photographers in 2026](https://imagen-ai.com/valuable-tips/best-client-gallery-for-photographers/)
- [How to Deliver Photos to Clients Like a Professional Photographer](https://zenfolio.com/blog/best-client-gallery-delivery-workflow/)

**Download Features & Tracking:**
- [Download Several Images in a Gallery - SmugMug Support](https://www.smugmughelp.com/hc/en-us/articles/18212879427348-Download-several-images-in-a-gallery)
- [Your Client's Download Experience - Pixieset Help Center](https://help.pixieset.com/hc/en-us/articles/115003594212-Client-Download-Experience)
- [Lightfolio: Client Photo Gallery for Photographers](https://www.lightfolio.com/)
- [How to Track Your WordPress Gallery Image Download Analytics](https://enviragallery.com/how-to-track-your-wordpress-gallery-image-download-analytics/)
- [Gallery Status - Picflow Knowledge Base](https://help.picflow.com/en/articles/8676308-gallery-status)

**Workflow & Timeline Expectations:**
- [Streamline Photo Delivery for Client Success](https://www.photoday.com/blog/streamlining-your-photo-delivery-process-for-clients)
- [Complete Guide to Client Photo Delivery for Professional Photographers](https://www.sendphoto.io/blog/client-photo-delivery-guide-professional-photographers)
- [3 Photography Workflow Tips To Speed Up Post Processing in 2026](https://aftershoot.com/blog/photography-workflow-tips/)
- [How to Streamline Your Photography Delivery Workflow](https://zenfolio.com/blog/streamline-photography-delivery-process-guide/)

**Gallery Expiration Best Practices:**
- [How Long Do I Leave Private Online Galleries Open?](https://www.bp4ublog.com/photo-tips/how-long-do-i-leave-private-online-galleries-open/)
- [Setting Boundaries - ShootProof Blog](https://www.shootproof.com/blog/setting-boundaries/)
- [Why Photographers Charge for Gallery Extensions](https://www.hollybirchphotography.com/brand-commercial-photographer/why-photographers-charge-for-gallery-extensions-amp-unarchiving-of-images)
- [The Secret to Getting Clients to Download Their Gallery](https://teresa-williams.com/the-secret-to-getting-clients-to-download-their-gallery/)

**UX Patterns:**
- [Gallery UI Design Best Practices - Mobbin](https://mobbin.com/glossary/gallery)
- [UX Best Practices for Designing a File Uploader](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Yet Another React Lightbox - Modern Lightbox Component](https://yet-another-react-lightbox.com/)

**Platform Comparisons:**
- [Top 10 Client Gallery Services in 2026](https://picflow.com/blog/top-client-gallery-services)
- [Photography Client Galleries - 7 Best Options in 2026](https://www.fast.io/resources/photography-client-gallery/)
- [Best Client Gallery Platforms for Photographers (2026)](https://turtlepic.com/blog/best-client-gallery-platforms-for-photographers/)
- [Pixieset Alternatives - Top 10 Client Galleries in 2026](https://pixieset-alternatives.com/)

---
*Feature research for: photographer client gallery / photo delivery web app (pixelforge.pro)*
*Initial research: 2026-02-11*
*v2.0 delivery features research: 2026-02-13*
*Confidence: HIGH (initial), MEDIUM (v2.0 delivery-specific based on web search of industry platforms)*
