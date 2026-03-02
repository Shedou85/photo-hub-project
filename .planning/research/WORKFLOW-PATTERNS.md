# Workflow Patterns Research

**Domain:** Photographer workspace workflow and state-based UI patterns
**Researched:** 2026-02-14 (initial), 2026-03-02 (status update)
**Confidence:** HIGH

> **STATUS (2026-03-02):** All identified workflow issues have been FIXED in v3.0:
> - Phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase) handle state-based UI
> - Upload zone adapts (large when empty, compact when photos exist)
> - Conditional button display based on collection status and photo count
> - Auto-navigation after collection create
> - Status badges with workflow guidance
>
> This research remains valuable as reference for future workflow enhancements.

## Research Context

This research analyzed how top photographer platforms (PhotoShelter, Pic-Time, ShootProof, Pixieset) organize their photographer workspace. All identified issues were resolved during v3.0 implementation.

## Key Findings: Workflow Patterns

### Pattern 1: State-Based Progressive Disclosure

**What:** UI elements appear/disappear based on collection state and photo count.

**Industry Standard:**
- **Empty collection (0 photos):** Large upload dropzone is primary UI. No workflow actions available. Message: "Upload photos to get started."
- **Collection with photos (1+ photos):** Upload zone collapses to small "Add more photos" button. Workflow actions become visible.
- **After client selection submitted:** Selection-phase actions disabled. Review/editing actions become primary.
- **After finals uploaded:** Delivery actions enabled. Upload/selection actions de-emphasized.

**Pixieset implementation (observed):**
- Dashboard shows "+ Add Files" button or drag-and-drop zone
- After upload starts, can "keep working in the dashboard without interruption"
- Upload zone adapts from full-screen to toolbar button after first photo

**Pic-Time implementation (observed):**
- "Workflow tab" in gallery shows contextual actions based on current state
- Selection requests only available when gallery has photos
- Client selection interface adapts based on photographer's specified selection count

**ShootProof implementation (observed):**
- Gallery settings available immediately, but "Client can favorite" toggle requires photos
- Proofing features activate only after photos exist
- Download permissions are state-dependent (photographer controls when enabled)

**Complexity:** LOW
**Dependencies:**
- Requires `collection.photoCount` check
- Requires `collection.status` enum

---

### Pattern 2: Auto-Navigation After Actions

**What:** Automatically redirect user to relevant view after completing an action.

**Industry Standard:**
- **After creating collection:** Navigate to collection details page (NOT back to list)
- **After upload completes:** Stay on collection details (show success message)
- **After client submits selection:** Photographer dashboard redirects to review view
- **After generating delivery link:** Navigate to delivery link preview page

**Why this pattern:**
- Reduces clicks (user's next action is almost always "configure this collection")
- Provides immediate feedback (user sees the thing they just created)
- Guides workflow (suggests logical next step)

**Pixieset guidance (from research):**
"After registering for an account, you'll be guided through creating your first photo gallery and exploring all its features."

**Pic-Time workflow:**
- After requesting client selection, photographer receives email notification when complete
- Lightroom plugin integration syncs selected photos back, auto-navigating to selection view

**Photo studio workflows (general pattern):**
- Project boards with drag-and-drop between stages (Inquiry → Booking → Session Planning → Gallery Delivery)
- Moving project card between stages auto-navigates to stage detail view

**Complexity:** LOW
**Dependencies:**
- React Router programmatic navigation (`useNavigate()`)
- Action completion callback hooks

**Anti-pattern to avoid:**
- Creating collection → staying on list page → forcing user to find and click new collection
- This creates "where did it go?" confusion and extra clicks

---

### Pattern 3: Contextual Action Hierarchy

**What:** Primary vs secondary button styling based on collection state.

**Industry Standard (2026 UI best practices):**

**Primary button (most important action):**
- Visual prominence (filled background, high contrast)
- One per screen/section
- Changes based on state:
  - DRAFT (0 photos): "Upload Photos"
  - DRAFT (1+ photos): "Share with Client"
  - SELECTING: "View Client Selections"
  - REVIEWING: "Upload Finals"
  - DELIVERED: "Copy Delivery Link"

**Secondary buttons (supporting actions):**
- Less prominent (outline/ghost style)
- Multiple allowed
- Always available but de-emphasized:
  - "Edit Details"
  - "Add More Photos"
  - "Archive Collection"

**Tertiary actions (low priority):**
- Text-only links or icon buttons
- "Delete Collection"
- "Download Originals"

**From UI design research (2026):**
- "Use one primary button per display in a workflow. Primary buttons signify the most important action a user should take."
- "Secondary button executes an action that is less important than the primary button but still relevant to the user's workflow."
- "Visual hierarchy directs the eye to the most important elements of a design."

**Complexity:** LOW
**Dependencies:**
- Tailwind button component variants (already exist in Photo Hub)
- State-based conditional rendering

---

### Pattern 4: Empty State Guidance

**What:** Show helpful messaging and CTAs when collection has no content.

**Industry Best Practices (2026):**

**Elements of good empty state:**
1. **Clear explanation:** "You haven't uploaded any photos yet."
2. **Visual context:** Icon or illustration (camera, upload cloud)
3. **Single clear CTA:** "Upload Photos" button
4. **Optional help text:** "Drag and drop photos here or click to browse."

**Photographer platform patterns:**
- Empty collection shows large upload dropzone with guidance
- Empty selection state (client view): "Your photographer hasn't shared any photos yet."
- Empty finals state: "Waiting for photographer to upload edited photos."

**From empty state UX research:**
- "Each design typically follows a relevant icon, a short message, and a single call-to-action."
- "Use empty states to provide help cues by telling users what could be displayed and how to populate the area with content."
- "Clear explanation and purpose are essential — for example, in a task management tool you might say 'You haven't added any tasks yet. Get started by clicking the + New Task button.'"

**Photo Hub application:**
- Collection details (0 photos): Show large upload zone + "Upload photos to start your collection"
- Selection view (client, 0 selections): "You haven't selected any photos yet. Click hearts to mark your favorites."
- Delivery view (0 finals): "Your photographer is preparing your final photos. Check back soon!"

**Complexity:** LOW
**Dependencies:** Photo count check, status check

---

### Pattern 5: Workflow Phase Visualization

**What:** Make current workflow stage visually obvious.

**Industry Patterns:**

**Progress indicators:**
- Linear steps (1. Upload → 2. Share → 3. Review → 4. Deliver)
- Current step highlighted
- Completed steps checked
- Future steps grayed out

**Status badges:**
- Color-coded collection states (already in Photo Hub)
- DRAFT = gray/neutral
- SELECTING = blue
- REVIEWING = yellow/orange
- DELIVERED = green
- DOWNLOADED = purple

**Project board approach:**
- Kanban-style columns for each workflow stage
- Collections as cards dragged between columns
- Visual count of collections in each stage

**Pic-Time approach:**
- "Workflow tab" in each gallery
- Shows available actions for current stage
- Completed stages collapsed, current stage expanded

**From research:**
- "By redesigning workflows to surface 'next best actions,' simplifying data-heavy screens, and using adaptive UI logic, significant improvements in task completion were achieved."
- "Contextual help is implemented through various UX patterns such as tooltips, inline help, guided tours, interactive walkthroughs."

**Photo Hub recommendation:**
- Keep existing status badges (already good)
- Add "Next step" guidance text in collection details header
  - DRAFT (0 photos): "Upload photos to get started"
  - DRAFT (1+ photos): "Share link with client to start selection"
  - SELECTING: "Waiting for client selections"
  - REVIEWING: "Upload edited finals to complete delivery"
  - DELIVERED: "Share delivery link with client"
  - DOWNLOADED: "Collection complete!"

**Complexity:** LOW
**Dependencies:** Status enum, conditional text rendering

---

### Pattern 6: Conditional Button Enablement

**What:** Disable/hide buttons until prerequisites are met.

**Industry Standard:**

**Disable vs Hide:**
- **Disable (grayed out):** When action will be available later (e.g., "Start Selection" disabled until photos exist)
- **Hide completely:** When action is not relevant to current state (e.g., "Upload Finals" hidden during DRAFT)

**Photo Hub specific cases:**

| Button | State | Condition | Pattern |
|--------|-------|-----------|---------|
| "Start Client Selection" | DRAFT | `photoCount === 0` | **HIDE** (not relevant yet) |
| "Start Client Selection" | DRAFT | `photoCount > 0` | **SHOW** (prerequisite met) |
| "Copy Selection Link" | SELECTING | Always | **SHOW** (active workflow) |
| "View Selections" | SELECTING | `selectionCount === 0` | **DISABLE** (nothing to view yet) |
| "View Selections" | SELECTING | `selectionCount > 0` | **ENABLE** (has content) |
| "Upload Finals" | REVIEWING | Always | **SHOW** (primary action) |
| "Copy Delivery Link" | DELIVERED | Always | **SHOW** (primary action) |
| "Upload Photos" | All states | Always | **SHOW** as secondary (can always add more) |

**From research (anti-patterns to avoid):**
- Showing "Start client selection" with 0 photos creates confusion ("Why can't I click this?")
- Better to hide entirely until photos exist
- Alternative: Show with tooltip explaining prerequisite

**Complexity:** LOW
**Dependencies:** State checks, photo count checks

---

### Pattern 7: Upload Zone Adaptation

**What:** Upload interface changes based on collection photo count.

**Pixieset pattern (observed):**
- New collection: Full-screen drag-and-drop zone with large icon and text
- After upload: Compact "+ Add Files" button in toolbar
- Drag-and-drop still works in photo grid area
- "Redesigned uploader you can keep working in the dashboard without interruption"

**General SaaS pattern:**
- Empty state: Large, prominent upload CTA (primary action)
- With content: Compact "Add more" button (secondary action)
- Maintains drag-and-drop on grid for convenience

**Photo Hub implementation:**
```javascript
// Simplified logic
if (collection.photoCount === 0) {
  return <LargeUploadDropzone />
} else {
  return (
    <>
      <PhotoGrid enableDragDrop={true} />
      <CompactAddMoreButton />
    </>
  )
}
```

**Benefits:**
- Reduces visual clutter once photos exist
- Keeps upload accessible but not dominating
- Grid becomes primary focus (the content)

**Complexity:** LOW
**Dependencies:** Photo count check, conditional component rendering

---

### Pattern 8: Next-Step Guidance

**What:** Explicitly tell user what to do next.

**From UX research:**
- "Guided tour is an interactive onboarding flow that walks users through an app step by step, providing clear instructions, highlighting key actions, and minimizing friction."
- "By redesigning workflows to surface 'next best actions,' simplifying data-heavy screens, and using adaptive UI logic, significant improvements in task completion were achieved."

**Photographer platform examples:**

**Pic-Time:**
- "Workflow tab" shows current stage actions
- Email notifications guide photographer to next step
- "After requesting client selection, photographer receives email notification when complete"

**Pixieset:**
- "After registering for an account, you'll be guided through creating your first photo gallery and exploring all its features."
- Dashboard surfaces next actions contextually

**Implementation patterns:**

**1. Inline guidance text:**
```
DRAFT (0 photos): "Upload photos to create your collection"
DRAFT (1+ photos): "Ready to share! Copy the link below to send to your client"
SELECTING: "Your client is selecting photos. You'll be notified when complete."
REVIEWING: "Client selected X photos. Upload edited finals to complete delivery."
DELIVERED: "Finals ready! Share the delivery link below with your client."
```

**2. Action prompts:**
- Highlight primary button with pulsing outline or badge
- Show "1 action required" indicator on collection cards
- Dashboard filter: "Collections needing action"

**3. Contextual help:**
- Tooltip on hover: explains what button does
- Help icon (?) next to unfamiliar actions
- Inline expandable help text

**Complexity:** LOW (text), MEDIUM (interactive prompts)
**Dependencies:** Status checks, i18n for text

---

## Table Stakes vs Differentiators

### Table Stakes (Photographer Workspace)

Features users expect. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Collection list view | Standard dashboard pattern | LOW | Already exists in Photo Hub |
| Status-based filtering | Photographers manage 20-50 collections; must filter | LOW | Extend existing status badges |
| Auto-navigate after create | Standard UX; reduces clicks | LOW | React Router programmatic navigation |
| Upload zone adaptation | Industry standard (Pixieset, others do this) | LOW | Conditional rendering based on photo count |
| Primary action prominence | UI best practice 2026 | LOW | Button hierarchy via Tailwind variants |
| Empty state guidance | UX best practice 2026 | LOW | Conditional text + icon |
| Conditional button display | Prevents confusion (e.g., "Start selection" with 0 photos) | LOW | Hide/show based on prerequisites |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explicit status lifecycle visualization | Photo Hub's DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED is clearer than competitors' implicit states | LOW | Already implemented; just needs UI polish |
| Integrated selection → delivery flow | Single link adapts vs competitors requiring separate links | LOW | Already planned in v2.0 |
| Next-step guidance text | Few competitors explicitly tell photographer "what to do next" | LOW | Simple conditional text rendering |
| Progressive button disclosure | Most platforms show all buttons always; adaptive UX reduces cognitive load | LOW | State-based conditional rendering |
| One-click collection archiving | Many platforms require multi-step archive workflow | MEDIUM | Future enhancement |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Kanban board for collections | "I want to drag collections between workflow stages" | Adds complexity for marginal value; filtering by status achieves same goal | Status-based filtering + visual badges |
| Real-time workflow notifications | "Notify me instantly when client submits selections" | WebSocket overhead; photographer workflow is async (hours between checks) | Email digest; manual dashboard refresh |
| Workflow templates / presets | "I want to save collection settings as templates" | Premature optimization; defer until photographers request it | Start with sane defaults; add templates in v3+ |
| Multi-step wizard for collection creation | "Guide photographer through every option" | Friction; experienced users resent forced steps | Simple create → auto-navigate → configure |
| In-app tutorial overlays | "Show tooltips explaining every feature" | Annoying for repeat users; hard to maintain | Contextual help icons; optional guided tour on first login (defer to v3+) |

---

## Workflow State Transitions

### Photo Hub Lifecycle

```
[DRAFT]
  ├─ No photos: Show large upload zone, hide workflow actions
  └─ Has photos: Collapse upload, show "Share with Client" as primary action
       ↓ (photographer shares link)
[SELECTING]
  ├─ Client can select photos
  ├─ Photographer sees "Waiting for selections" message
  └─ Downloads blocked
       ↓ (client submits selections)
[REVIEWING]
  ├─ Photographer can view selected photos
  ├─ "Upload Finals" becomes primary action
  └─ Downloads still blocked
       ↓ (photographer uploads finals, transitions to DELIVERED)
[DELIVERED]
  ├─ Delivery link auto-generated
  ├─ "Copy Delivery Link" becomes primary action
  ├─ Selection link redirects to delivery page
  └─ Downloads enabled
       ↓ (client downloads ZIP or photos)
[DOWNLOADED]
  ├─ Collection marked complete
  ├─ "Download confirmed" badge shown
  └─ All actions available (re-download, archive)
```

### UI Changes at Each Transition

| Transition | UI Change | Primary Action | Secondary Actions |
|------------|-----------|----------------|-------------------|
| Create → DRAFT (0 photos) | Large upload dropzone | "Upload Photos" | "Edit Details", "Delete" |
| Upload → DRAFT (1+ photos) | Collapse upload zone | "Share with Client" | "Add More Photos", "Edit Details" |
| Share → SELECTING | Status badge blue | "Copy Selection Link" | "View Selections" (disabled until client selects) |
| Client selects → REVIEWING | Status badge yellow | "Upload Finals" | "View Selections", "Add More Photos" |
| Upload finals → DELIVERED | Status badge green, delivery link appears | "Copy Delivery Link" | "View Finals", "Download ZIP" |
| Client downloads → DOWNLOADED | Status badge purple | "View Downloads" | "Archive Collection" |

---

## Action Organization Patterns

### Current Photo Hub Issues

**Problem 1: "Start client selection" shows with 0 photos**
- **Fix:** Hide button completely until `photoCount > 0`
- **Alternative:** Disable with tooltip "Upload photos first"
- **Recommendation:** Hide (cleaner UX)

**Problem 2: After creating collection, user stays on list page**
- **Fix:** `navigate(\`/collection/${newCollectionId}\`)` after create success
- **Benefit:** Immediate context + suggests next step (upload photos)

**Problem 3: Upload dropzone doesn't adapt to collection state**
- **Fix:** Conditional rendering:
  ```javascript
  {photoCount === 0 ? <LargeDropzone /> : <CompactAddButton />}
  ```

**Problem 4: Workflow phases not visually clear**
- **Fix:** Add "Next step" guidance text below status badge
- **Example:** REVIEWING: "Upload edited finals to complete delivery"

### Recommended Button Layout (Collection Details)

**DRAFT state (0 photos):**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Draft                       │
│ Next step: Upload photos            │
├─────────────────────────────────────┤
│ [Large Upload Dropzone]             │
│ "Drag photos here or click browse"  │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Edit Details                      │
│ • Delete Collection                 │
└─────────────────────────────────────┘
```

**DRAFT state (1+ photos):**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Draft | 12 photos           │
│ Next step: Share link with client   │
├─────────────────────────────────────┤
│ [PRIMARY: Share with Client] 📋     │
├─────────────────────────────────────┤
│ Photo Grid                          │
│ [+ Add More Photos] (compact)       │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Edit Details                      │
│ • Download Originals                │
│ • Delete Collection                 │
└─────────────────────────────────────┘
```

**SELECTING state:**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Selecting | 12 photos       │
│ Next step: Wait for client          │
├─────────────────────────────────────┤
│ Selection Link (active):            │
│ [Copy Selection Link] 📋            │
├─────────────────────────────────────┤
│ Client Selections: 5 selected       │
│ [View Selections] (enabled)         │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Add More Photos                   │
│ • Edit Details                      │
└─────────────────────────────────────┘
```

**REVIEWING state:**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Reviewing | 5 selected      │
│ Next step: Upload edited finals     │
├─────────────────────────────────────┤
│ [PRIMARY: Upload Finals] 📤         │
├─────────────────────────────────────┤
│ Client Selections:                  │
│ [View Selected Photos] (5 photos)   │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Edit Details                      │
│ • Download Selected Originals       │
└─────────────────────────────────────┘
```

**DELIVERED state:**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Delivered | 5 finals ready  │
│ Next step: Share delivery link      │
├─────────────────────────────────────┤
│ [PRIMARY: Copy Delivery Link] 📋    │
├─────────────────────────────────────┤
│ Finals ready for download           │
│ [View Finals] [Download ZIP]        │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Add More Finals                   │
│ • Edit Details                      │
│ • Archive Collection                │
└─────────────────────────────────────┘
```

**DOWNLOADED state:**
```
┌─────────────────────────────────────┐
│ Collection Details                  │
│ Status: Downloaded ✓ Complete       │
│ Client downloaded on: 2026-02-14    │
├─────────────────────────────────────┤
│ Delivery Link (active):             │
│ [Copy Delivery Link] 📋             │
├─────────────────────────────────────┤
│ [View Download History]             │
│ [Download ZIP Again]                │
├─────────────────────────────────────┤
│ Secondary actions:                  │
│ • Archive Collection                │
│ • Edit Details                      │
└─────────────────────────────────────┘
```

---

## Feature Dependencies

```
[Photo Count Check]
    └──gates──> [Upload Zone Adaptation]
    └──gates──> [Conditional Button Display]
    └──gates──> [Empty State Rendering]

[Collection Status Enum]
    └──gates──> [Primary Action Selection]
    └──gates──> [Next-Step Guidance Text]
    └──gates──> [Button Visibility Rules]

[Auto-Navigation After Create]
    └──requires──> [React Router useNavigate]
    └──enhances──> [Workflow Continuity]

[Status Badge Coloring] (existing)
    └──enhances──> [Workflow Phase Visualization]

[Conditional Rendering]
    └──enables──> [Progressive Disclosure]
    └──enables──> [Upload Zone Adaptation]
    └──enables──> [Button Hierarchy]
```

### Dependency Notes

- **Photo count is cross-cutting:** Used for empty states, upload zone rendering, button enablement
- **Status enum gates most UI decisions:** Primary action, guidance text, button visibility all depend on status
- **Auto-navigation enhances onboarding:** Reduces friction for new users; experienced users learn pattern quickly
- **Progressive disclosure reduces cognitive load:** Hide complexity until relevant; surfacing all actions always creates decision paralysis

---

## Implementation Complexity Assessment

| Pattern | Complexity | Effort | Priority |
|---------|------------|--------|----------|
| Upload zone adaptation | LOW | 1-2 hours | P1 (high value, low cost) |
| Conditional button display | LOW | 2-3 hours | P1 (fixes current bug) |
| Auto-navigate after create | LOW | 1 hour | P1 (standard UX) |
| Empty state guidance | LOW | 1-2 hours | P1 (UX best practice) |
| Primary action hierarchy | LOW | 2-3 hours | P1 (visual clarity) |
| Next-step guidance text | LOW | 2-4 hours | P2 (nice polish) |
| Status-based filtering (dashboard) | LOW | 3-4 hours | P2 (scaling feature) |
| Workflow phase visualization | MEDIUM | 4-6 hours | P3 (future enhancement) |

**Priority key:**
- P1: Must have (fixes current issues + industry standard patterns)
- P2: Should have (improves UX, moderate value)
- P3: Nice to have (future enhancement, lower ROI)

**Total P1 effort estimate:** 8-12 hours (can ship in single phase)

---

## Competitor Workflow Comparison

| Pattern | Pixieset | Pic-Time | ShootProof | Photo Hub (Current) | Photo Hub (Recommended) |
|---------|----------|----------|------------|---------------------|-------------------------|
| Upload zone adaptation | YES (compact after upload) | Not observed | Not observed | NO (always large) | **FIX: YES** |
| Auto-navigate after create | YES (guided workflow) | YES (workflow tab) | Not observed | NO (stays on list) | **FIX: YES** |
| Conditional button display | YES (state-aware) | YES (workflow tab) | YES (state-aware) | PARTIAL (status badge only) | **FIX: YES** |
| Empty state guidance | YES (clear messaging) | YES (workflow prompts) | YES (setup guidance) | NO (blank dropzone) | **FIX: YES** |
| Status visualization | IMPLICIT (no labels) | EXPLICIT (workflow stages) | IMPLICIT | EXPLICIT (color badges) | **ENHANCE** |
| Next-step guidance | SUBTLE (tooltips) | EXPLICIT (workflow tab) | SUBTLE | NO | **ADD** |
| Primary action hierarchy | YES (visual prominence) | YES (workflow focus) | YES | PARTIAL | **ENHANCE** |

**Conclusion:** Photo Hub has good status visualization (better than Pixieset/ShootProof) but lacks state-based UI adaptation. Implementing P1 patterns brings it to industry standard with explicit status as differentiator.

---

## Sources

### Photographer Platform Workflows

- [PhotoShelter for Photographers Software Reviews 2026](https://www.softwareadvice.com/photography-studio/photoshelter-for-photographers-profile/) — Workspace and collaboration features
- [PhotoShelter FileFlow Mobile Delivery Workflow](https://go.photoshelter.com/photographers/blog/revolutionize-your-mobile-delivery-workflow-fileflow/) — Upload and mobile workflow
- [PhotoShelter File Delivery](https://support.photoshelter.com/hc/en-us/articles/360034474913-FileFlow-for-PhotoShelter-for-Photographers) — Client proofing workflow
- [Pic-Time Client Selection (Desktop)](https://help.pic-time.com/en/articles/7831155-how-does-a-client-select-photos-via-the-selection-request-tool-desktop) — Selection workflow
- [Pic-Time: How to Request Client Selection](https://help.pic-time.com/en/articles/7831183-how-do-i-request-a-client-selection) — Workflow steps
- [Pic-Time vs Pixieset Review 2026](https://greenhousecreativestudios.com/pic-time-review/) — Workflow comparison
- [Photography Client Galleries - 7 Best Options 2026](https://www.fast.io/resources/photography-client-gallery/) — Platform feature comparison
- [One Workflow From Edit to Delivery: Imagen + Pic-Time](https://imagen-ai.com/post/seamless-workflow-for-photographers-from-editing-to-delivery/) — Integrated workflow patterns
- [ShootProof: Ultimate Gallery Delivery Solution](https://www.shootproof.com/blog/shootproof-the-photographers-ultimate-gallery-delivery-solution/) — Workflow overview
- [10 Best Online Proofing Galleries 2026](https://imagen-ai.com/valuable-tips/best-online-proofing-galleries-for-photographers/) — Workflow comparison
- [ShootProof Client Proofing](https://www.shootproof.com/features/proofing/) — Proofing workflow
- [Pixieset and Proofing](https://help.pixieset.com/hc/en-us/articles/115003797011-Pixieset-and-Proofing) — Proofing setup workflow
- [Pixieset: How Proofing with Favorites Works](https://help.pixieset.com/hc/en-us/articles/115003733131-How-does-proofing-with-Favorites-work) — Selection workflow
- [8 Tips to Help Clients Choose Favorites Faster](https://blog.pixieset.com/blog/favorite-photos-online-proofing/) — UX workflow tips
- [Best Photo Gallery for Photographers 2026](https://blog.pixieset.com/blog/best-photo-gallery/) — Industry standards
- [What is Pixieset, How Does It Work](https://blog.pixieset.com/blog/what-is-pixieset/) — Platform workflow overview
- [12 Pixieset Workflows to Streamline Photography Business](https://blog.pixieset.com/blog/photography-workflows/) — Workflow automation patterns
- [How to Get Started with Online Photo Proofing](https://blog.pixieset.com/blog/online-photo-proofing/) — Proofing workflow guide

### Photography Workflow Best Practices

- [3 Photography Workflow Tips 2026](https://aftershoot.com/blog/photography-workflow-tips/) — Workflow optimization
- [Best Ways to Share Photos with Clients 2026](https://lovely-imgs.com/blogs/how-to-share-photos-with-clients) — Delivery best practices
- [Photography Workflow: Ultimate Action Plan](https://www.imagely.com/photography-workflow/) — End-to-end workflow
- [Optimizing Photography Workflow](https://picflow.com/blog/photography-workflow) — Workflow efficiency
- [Understanding Proofs in Photography](https://www.imaginated.com/photography/business/client-management/photo-proofs/) — Proofing anti-patterns
- [Better Client Proofing Gallery](https://reviewstudio.com/blog/how-a-better-client-proofing-gallery-delivers-faster-approvals-and-happier-clients/) — Approval workflow optimization
- [Why Online Proofing Gallery is Essential](https://reviewstudio.com/blog/why-an-online-proofing-gallery-for-photographers-is-essential-for-streamlining-client-reviews/) — Workflow streamlining
- [Beginner's Guide to Online Proofing](https://picu.io/blog/a-beginners-guide-to-online-proofing-for-photographers/) — Workflow fundamentals
- [How to Streamline Photography Delivery Workflow](https://zenfolio.com/blog/streamline-photography-delivery-process-guide/) — Delivery workflow patterns

### Pixieset Upload & Collection Management

- [Uploading to Client Gallery](https://help.pixieset.com/hc/en-us/articles/115003740132-Uploading-to-Client-Gallery) — Upload interface patterns
- [Creating Collections & Sets](https://help.pixieset.com/hc/en-us/articles/115003792812-Creating-Collections-Sets) — Collection organization
- [New Client Gallery Dashboard](https://blog.pixieset.com/blog/client-gallery-dashboard/) — Dashboard workflow
- [Bulk Creating Collections](https://help.pixieset.com/hc/en-us/articles/41219071036685-Bulk-creating-collections-in-Client-Gallery) — Batch workflow
- [15+ Features You Didn't Know About](https://blog.pixieset.com/blog/pixiset-client-gallery-features/) — Hidden workflow features
- [Pixieset November 2024 Updates](https://blog.pixieset.com/blog/pixieset-november-2024-updates/) — Recent workflow improvements
- [Pixieset 2025 Year in Review](https://blog.pixieset.com/blog/2025-review/) — Platform evolution

### UI/UX Design Patterns (2026)

- [Progressive Disclosure Examples for SaaS](https://userpilot.com/blog/progressive-disclosure-examples/) — Progressive disclosure patterns
- [Simplify SaaS with Progressive Disclosure](https://www.launchnotes.com/blog/simplify-your-saas-product-with-progressive-disclosure-examples-and-best-practices) — Best practices
- [B2B SaaS UX Design 2026](https://www.onething.design/post/b2b-saas-ux-design) — Workflow wizard patterns
- [SaaS UI/UX Best Practices 2025](https://sapient.pro/blog/designing-for-saas-best-practices) — Design principles
- [SaaS UI/UX Best Practices 2026](https://www.krishaweb.com/blog/saas-ui-ux-best-practices-high-volume-conversions/) — Conversion optimization
- [7 SaaS UX Design Best Practices](https://mouseflow.com/blog/saas-ux-design-best-practices/) — User guidance patterns
- [Progressive Disclosure in SaaS UX](https://medium.com/@liana.ghazaryan1995/progressive-disclosure-in-saas-ux-designing-for-clarity-and-control-672643fccfbd) — Conditional UI patterns
- [Power of Progressive Disclosure](https://lollypop.design/blog/2025/may/progressive-disclosure/) — Implementation strategies
- [What is Progressive Disclosure?](https://www.interaction-design.org/literature/topics/progressive-disclosure) — Core concept

### Empty State Design

- [Empty State UX Examples](https://www.eleken.co/blog-posts/empty-state-ux) — Design patterns
- [Empty State UX Best Practices](https://www.pencilandpaper.io/articles/empty-states) — Implementation guidance
- [Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/) — NN/G guidelines
- [Empty State UI Pattern](https://mobbin.com/glossary/empty-state) — Mobile examples
- [90 SaaS Empty State UI Examples 2026](https://www.saasframe.io/categories/empty-state) — Design inspiration
- [Designing Overlooked Empty States](https://www.uxpin.com/studio/blog/ux-best-practices-designing-the-overlooked-empty-states/) — UX best practices
- [Empty States - Most Overlooked Aspect of UX](https://www.toptal.com/designers/ux/empty-state-ux-design) — Strategy guidance
- [Blank Slate UI Design - 20 Best Examples](https://userpilot.com/blog/blank-slate-ui-design-examples/) — Design patterns

### Button Hierarchy & Visual Design

- [Ultimate Guide to UI Design 2026](https://webdesignerdepot.com/the-ultimate-guide-to-ui-design-in-2026/) — Current trends
- [Primary vs Secondary CTA Buttons](https://designcourse.com/blog/post/primary-vs-secondary-cta-buttons-in-ui-design) — Button hierarchy
- [Types of Buttons in UI Design](https://blog.logrocket.com/ux-design/types-of-buttons-in-ui-design/) — Best practices
- [17 Button Design Best Practices](https://balsamiq.com/learn/articles/button-design-best-practices/) — Implementation guide
- [7 Fundamental UX Design Principles 2026](https://www.uxdesigninstitute.com/blog/ux-design-principles-2026/) — Visual hierarchy
- [Mastering Visual Hierarchy](https://medium.com/@oaampaben/mastering-visual-hierarchy-the-core-principle-every-ui-ux-designer-must-know-e0e99a369a8b) — Design fundamentals

### Gallery UI Patterns

- [Gallery UI Design Best Practices](https://mobbin.com/glossary/gallery) — Navigation patterns
- [Photo Upload Tool UX Patterns](https://medium.com/tripaneer-techblog/a-photo-upload-tool-invent-the-ux-patterns-dont-follow-them-fd0f51188f62) — Upload interface design
- [Image Gallery Pattern](https://uxpatterns.dev/patterns/media/image-gallery) — Core patterns
- [Image Upload Pattern](https://uxpatterns.dev/patterns/media/image-upload) — Upload UX

### Contextual Help & Workflow Guidance

- [How to Provide Contextual Help](https://userpilot.com/blog/contextual-help/) — UX patterns
- [Top 8 UX Patterns for Contextual Help](https://www.chameleon.io/blog/contextual-help-ux) — Implementation strategies
- [Highlight Elements in Your App](https://www.chameleon.io/blog/new-design-patterns-highlighting-elements) — Visual guidance

---

*Workflow patterns research for: Photo Hub photographer workspace redesign*
*Researched: 2026-02-14*
*Confidence: MEDIUM (based on WebSearch + industry pattern synthesis)*
