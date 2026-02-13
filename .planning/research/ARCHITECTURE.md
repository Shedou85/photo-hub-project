# Architecture Research: Delivery Links, ZIP Downloads, and Download Tracking

**Domain:** Photo Delivery and Download Management (v2.0 Integration)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

This research focuses on **NEW architecture** for v2.0: How delivery links, ZIP downloads, and download tracking integrate with Photo Hub's existing v1.0 architecture. The v1.0 system already has token-based sharing (shareId), photo upload, client selection, and status lifecycle. v2.0 adds a separate delivery token system, on-demand ZIP generation, download tracking, and UI polish.

**Key Architectural Decisions:**
1. **Separate delivery token** from selection shareId (different access scope + expiration)
2. **On-demand ZIP generation** using PHP ZipArchive with streaming (no pre-generation)
3. **Download tracking table** for analytics (timestamp, type, optional IP/user agent)
4. **DELIVERED status auto-set** when delivery token is generated (atomic operation)

---

## Standard Architecture

### System Overview

Photo delivery systems separate **selection links** (client chooses photos) from **delivery links** (client downloads final photos). This two-token architecture provides:
- Independent expiration control (selection expires early, delivery later)
- Different access levels (view vs download)
- Separate security scopes (selection requires state changes, delivery is read-only)
- Clear status lifecycle boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Layer (React)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │ Collections  │  │ Share Page    │  │ Delivery Page (NEW)  │ │
│  │ List Page    │  │ (shareId)     │  │ (deliveryToken)      │ │
│  └──────┬───────┘  └───────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │              │
├─────────┴──────────────────┴──────────────────────┴──────────────┤
│                      Backend API Layer (PHP)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Route: /collections/{id}/delivery (generate token) NEW   │  │
│  │  Route: /delivery/{token} (public endpoint) NEW           │  │
│  │  Route: /delivery/{token}/download (individual) NEW       │  │
│  │  Route: /delivery/{token}/zip (generate + stream) NEW     │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer (PHP)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Token Generator  │  │ ZIP Builder      │  │ Download     │  │
│  │ (deliveryToken)  │  │ (ZipArchive)     │  │ Tracker      │  │
│  │ NEW              │  │ NEW              │  │ NEW          │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer (MySQL)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Collection   │  │ EditedPhoto  │  │ Download (NEW)       │  │
│  │ +deliveryTkn │  │              │  │ +id, +collectionId   │  │
│  │ +deliveredAt │  │              │  │ +downloadType, +ts   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Token Generator** | Create unique delivery tokens when status → DELIVERED | Generate UUID v4, store in Collection.deliveryToken column, set deliveredAt timestamp |
| **Delivery Page (Public)** | Display final photos to client without auth | React page fetches /delivery/{token} endpoint, shows edited photos grid with download buttons |
| **ZIP Builder** | Generate ZIP archive on-demand from EditedPhoto records | PHP ZipArchive with addFile() per photo, stream response with Content-Disposition header |
| **Download Tracker** | Log all download events (ZIP + individual) | Insert row to Download table with timestamp, type (ZIP/PHOTO), optional IP/user-agent |
| **Collection Status Manager** | Transition REVIEWING → DELIVERED on token generation | PATCH /collections/{id} sets status=DELIVERED, generates deliveryToken, sets deliveredAt timestamp |

---

## Integration Points with Existing Architecture

### New Database Columns

**Collection table modifications:**
```sql
ALTER TABLE `Collection` ADD COLUMN `deliveryToken` VARCHAR(191) NULL;
ALTER TABLE `Collection` ADD COLUMN `deliveredAt` DATETIME(3) NULL;
ALTER TABLE `Collection` ADD INDEX `Collection_deliveryToken_idx` (`deliveryToken`);
```

**New Download tracking table:**
```sql
CREATE TABLE `Download` (
  `id` VARCHAR(191) NOT NULL,
  `collectionId` VARCHAR(191) NOT NULL,
  `downloadType` ENUM('ZIP', 'PHOTO') NOT NULL,
  `photoId` VARCHAR(191) NULL,
  `downloadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` VARCHAR(512) NULL,
  PRIMARY KEY (`id`),
  KEY `Download_collectionId_idx` (`collectionId`),
  CONSTRAINT `Download_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### New Backend Routes

Add to `backend/index.php` router switch statement:

```php
// Generate delivery token (authenticated endpoint)
case '/collections/{id}/delivery':
    if ($requestMethod == 'POST') {
        require_once __DIR__ . '/collections/delivery.php';
    }
    break;

// Public delivery endpoints (no auth required)
if (strpos($requestUri, '/delivery/') === 0) {
    $uriParts = explode('/', ltrim($requestUri, '/'));
    // uriParts: ['delivery', token, ?action]
    $action = $uriParts[2] ?? '';

    switch ($action) {
        case '':
            // GET /delivery/{token} - fetch collection + edited photos
            require_once __DIR__ . '/delivery/index.php';
            break;
        case 'zip':
            // GET /delivery/{token}/zip - generate and stream ZIP
            require_once __DIR__ . '/delivery/zip.php';
            break;
        case 'download':
            // GET /delivery/{token}/download/{photoId} - download single photo
            require_once __DIR__ . '/delivery/download.php';
            break;
    }
    break;
}
```

### New Handler Files

**Location:** `backend/delivery/` directory (new)

| File | Purpose | Auth Required | HTTP Method |
|------|---------|---------------|-------------|
| `backend/collections/delivery.php` | Generate deliveryToken, transition to DELIVERED | Yes (photographer) | POST |
| `backend/delivery/index.php` | Fetch collection + edited photos by deliveryToken | No (public) | GET |
| `backend/delivery/zip.php` | Generate ZIP on-demand, stream to browser | No (public) | GET |
| `backend/delivery/download.php` | Download individual edited photo | No (public) | GET |

### New React Components

**Location:** `frontend/src/pages/` and `frontend/src/components/`

| Component | Purpose | Route |
|-----------|---------|-------|
| `DeliveryPage.jsx` | Public page showing edited photos with download buttons | `/delivery/:token` |
| `DeliveryLink.jsx` (or inline in CollectionDetailsPage) | Component to generate/copy delivery link | N/A (embedded) |

### Modified Components

**CollectionDetailsPage.jsx:**
- Add "Generate Delivery Link" button (visible when status = REVIEWING)
- Button triggers POST to `/collections/{id}/delivery`
- Display delivery link with copy button once generated
- Show deliveredAt timestamp

**CollectionsListPage.jsx:**
- Add deliveredAt display in collection cards
- Update status badge colors (DELIVERED = purple/indigo)

**backend/collections/id.php:**
- Return `deliveryToken` and `deliveredAt` in GET response (add to SELECT query)

---

## Architectural Patterns

### Pattern 1: Separate Token Scopes (Selection vs Delivery)

**What:** Use two independent tokens — `shareId` for client selection phase (SELECTING/REVIEWING), `deliveryToken` for final download phase (DELIVERED).

**When to use:** When access needs differ between phases:
- Selection: Mutable state (add/remove selections), limited time window
- Delivery: Read-only access, longer expiration, download tracking

**Trade-offs:**
- PRO: Clear separation of concerns, independent expiration
- PRO: Prevents clients from downloading unfinished work via share link
- CON: Two tokens to manage, two pages to build
- CON: Client must receive second link after photographer approves

**Implementation:**
```php
// Generation (authenticated photographer endpoint)
// backend/collections/delivery.php
require_once __DIR__ . '/../db.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';
$userId = $_SESSION['user_id'];

$pdo = getDbConnection();

// Verify ownership and status
$stmt = $pdo->prepare("SELECT status FROM `Collection` WHERE id = ? AND userId = ?");
$stmt->execute([$collectionId, $userId]);
$collection = $stmt->fetch();

if (!$collection || $collection['status'] !== 'REVIEWING') {
    http_response_code(400);
    echo json_encode(['error' => 'Collection must be in REVIEWING status']);
    exit;
}

// Generate unique token
$deliveryToken = bin2hex(random_bytes(16)); // 32 char hex string
$deliveredAt = date('Y-m-d H:i:s.v');

// Update collection atomically
$stmt = $pdo->prepare("
    UPDATE `Collection`
    SET deliveryToken = ?, deliveredAt = ?, status = 'DELIVERED', updatedAt = ?
    WHERE id = ? AND userId = ?
");
$stmt->execute([$deliveryToken, $deliveredAt, $deliveredAt, $collectionId, $userId]);

echo json_encode(['status' => 'OK', 'deliveryToken' => $deliveryToken, 'deliveredAt' => $deliveredAt]);
```

---

### Pattern 2: On-Demand ZIP Generation with Streaming

**What:** Generate ZIP archives when requested (not pre-generated) and stream directly to browser without storing on disk permanently.

**When to use:**
- Small to medium collections (< 100 photos, < 500MB total)
- EditedPhoto files already exist on disk
- Want to avoid disk space for cached ZIPs

**Trade-offs:**
- PRO: No storage overhead, always fresh
- PRO: Simple implementation with PHP ZipArchive
- CON: Slower first-byte time (generation before streaming)
- CON: CPU/memory spike during generation
- CON: Concurrent requests can overload server

**Implementation:**
```php
// backend/delivery/zip.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

$parts = parseRouteParts();
$deliveryToken = $parts[1] ?? '';

if (empty($deliveryToken) || !isValidId($deliveryToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid delivery token']);
    exit;
}

$pdo = getDbConnection();

// Fetch collection by deliveryToken
$stmt = $pdo->prepare("SELECT id, name, status FROM `Collection` WHERE deliveryToken = ? LIMIT 1");
$stmt->execute([$deliveryToken]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collection) {
    http_response_code(404);
    echo json_encode(['error' => 'Collection not found']);
    exit;
}

// Verify status
if ($collection['status'] !== 'DELIVERED') {
    http_response_code(403);
    echo json_encode(['error' => 'Downloads not available']);
    exit;
}

// Fetch edited photos
$stmt = $pdo->prepare("SELECT id, filename, storagePath FROM `EditedPhoto` WHERE collectionId = ?");
$stmt->execute([$collection['id']]);
$photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($photos)) {
    http_response_code(404);
    echo json_encode(['error' => 'No photos found']);
    exit;
}

// Create temporary ZIP
$tempZip = tempnam(sys_get_temp_dir(), 'collection_') . '.zip';
$zip = new ZipArchive();

if ($zip->open($tempZip, ZipArchive::CREATE) !== true) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create ZIP']);
    exit;
}

// Add files (use addFile for memory efficiency)
foreach ($photos as $photo) {
    $filePath = __DIR__ . '/../' . $photo['storagePath'];
    if (file_exists($filePath)) {
        $zip->addFile($filePath, $photo['filename']);
    }
}

$zip->close();

// Track download
trackDownload($pdo, $collection['id'], 'ZIP');

// Stream to browser
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $collection['name'] . '.zip"');
header('Content-Length: ' . filesize($tempZip));

readfile($tempZip);
unlink($tempZip); // Clean up temp file
exit;
```

**Optimization for large collections (100+ photos):**
- Use chunked streaming without temp file via `ZipStream-PHP` library (Composer: `maennchen/zipstream-php`)
- This reduces memory footprint by streaming ZIP contents as they're added
- Alternative: Pre-generate ZIP and store in `Collection.processedZipPath` (already exists in schema)

---

### Pattern 3: Download Tracking with Minimal Data

**What:** Log download events (timestamp, type, optional metadata) without storing sensitive client data.

**When to use:**
- Need basic analytics (how many downloads, when)
- Want to avoid GDPR concerns (don't track IPs/user agents unless necessary)
- Simple audit trail for photographers

**Trade-offs:**
- PRO: Simple schema, fast inserts, no PII concerns
- PRO: Enables analytics (download count, last downloaded)
- CON: Can't identify duplicate downloads from same client
- CON: Limited forensic value if abuse occurs

**Implementation:**
```php
// Add to utils.php
function trackDownload($pdo, $collectionId, $type, $photoId = null) {
    $id = generateCuid();

    // Optional: capture IP and user agent (GDPR consideration)
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

    $stmt = $pdo->prepare("
        INSERT INTO `Download` (id, collectionId, downloadType, photoId, ipAddress, userAgent, downloadedAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(3))
    ");
    $stmt->execute([$id, $collectionId, $type, $photoId, $ipAddress, $userAgent]);
}
```

**Display in UI:**
```php
// In backend/collections/id.php or separate stats endpoint
// Add to existing collection response
$stmt = $pdo->prepare("
    SELECT
        COUNT(*) as totalDownloads,
        MAX(downloadedAt) as lastDownload,
        SUM(CASE WHEN downloadType = 'ZIP' THEN 1 ELSE 0 END) as zipDownloads,
        SUM(CASE WHEN downloadType = 'PHOTO' THEN 1 ELSE 0 END) as photoDownloads
    FROM `Download`
    WHERE collectionId = ?
");
$stmt->execute([$collectionId]);
$downloadStats = $stmt->fetch(PDO::FETCH_ASSOC);

// Returns: ['totalDownloads' => 5, 'lastDownload' => '2026-02-13 14:32:15.123', 'zipDownloads' => 2, 'photoDownloads' => 3]
```

---

### Pattern 4: Status Lifecycle with Delivery Trigger

**What:** DELIVERED status is set automatically when delivery token is generated (not manually by photographer).

**When to use:**
- Want clear transition point (token generation = delivered)
- Prevent premature sharing of delivery link
- Ensure deliveredAt timestamp accuracy

**Trade-offs:**
- PRO: Atomic operation (token + status + timestamp)
- PRO: Clear event boundary for analytics
- CON: Photographer can't mark "delivered" without generating token
- CON: Requires client to wait for token generation (network round-trip)

**State Machine:**
```
DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED
                       ↑            ↑
                       |            |
                  shareId      deliveryToken
                  generated     generated
                                (triggers status change)
```

**Implementation (status transition):**
```php
// In backend/collections/delivery.php (shown in Pattern 1)
// Status check prevents premature token generation
if ($collection['status'] !== 'REVIEWING') {
    http_response_code(400);
    echo json_encode(['error' => 'Collection must be in REVIEWING status to generate delivery link']);
    exit;
}

// Atomic update: token + status + timestamp
$stmt = $pdo->prepare("
    UPDATE `Collection`
    SET deliveryToken = ?, deliveredAt = ?, status = 'DELIVERED', updatedAt = ?
    WHERE id = ? AND userId = ? AND status = 'REVIEWING'
");
$stmt->execute([$deliveryToken, $deliveredAt, $deliveredAt, $collectionId, $userId]);

// Verify update succeeded (race condition protection)
if ($stmt->rowCount() === 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Status conflict or collection not found']);
    exit;
}
```

---

## Data Flow

### Delivery Link Generation Flow

```
[Photographer clicks "Generate Delivery Link" in CollectionDetailsPage]
    ↓
[POST /collections/{collectionId}/delivery] (session auth)
    ↓
[Backend: Verify ownership + status = REVIEWING]
    ↓
[Generate deliveryToken (32-char hex)] → [Store in Collection.deliveryToken]
    ↓
[Set status = DELIVERED] → [Set deliveredAt = NOW()]
    ↓
[Return deliveryToken to frontend]
    ↓
[Display: https://pixelforge.pro/delivery/{token}]
    ↓
[Photographer copies link and sends to client]
```

### ZIP Download Flow

```
[Client visits /delivery/{token}]
    ↓
[GET /delivery/{token}] → [Backend: Fetch collection by deliveryToken]
    ↓
[If not found → 404] [If found → Return collection + edited photos list]
    ↓
[Client clicks "Download All (ZIP)"]
    ↓
[GET /delivery/{token}/zip]
    ↓
[Backend: Verify status = DELIVERED]
    ↓
[Query EditedPhoto records for collectionId]
    ↓
[Create ZipArchive in sys_get_temp_dir()]
    ↓
[Loop photos: zip.addFile(storagePath, filename)]
    ↓
[Close ZIP archive]
    ↓
[Set headers: Content-Type: application/zip, Content-Disposition: attachment]
    ↓
[Track download: INSERT INTO Download (type=ZIP, collectionId, timestamp)]
    ↓
[Stream ZIP file with readfile()]
    ↓
[Delete temp ZIP file]
    ↓
[Browser receives ZIP download]
```

### Individual Photo Download Flow

```
[Client clicks "Download" on photo thumbnail in /delivery/{token} page]
    ↓
[GET /delivery/{token}/download/{photoId}]
    ↓
[Backend: Verify deliveryToken exists and status = DELIVERED]
    ↓
[Verify photoId belongs to collection]
    ↓
[Fetch EditedPhoto.storagePath]
    ↓
[Set headers: Content-Type: image/jpeg, Content-Disposition: attachment]
    ↓
[Track download: INSERT INTO Download (type=PHOTO, photoId, collectionId, timestamp)]
    ↓
[Stream file with readfile()]
    ↓
[Browser receives photo download]
```

### Download Analytics Query Flow

```
[Photographer views CollectionDetailsPage]
    ↓
[Frontend requests collection data: GET /collections/{id}]
    ↓
[Backend includes download stats in response]
    ↓
[Query: SELECT COUNT(*), MAX(downloadedAt) FROM Download WHERE collectionId = ?]
    ↓
[Display: "Downloaded 3 times, last on Feb 13, 2026 2:45 PM"]
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-50 collections** | Current approach: On-demand ZIP generation, inline tracking, no caching. Single PHP server handles everything. |
| **50-200 collections** | Add nginx reverse proxy with caching for static delivery page assets. Consider rate limiting on ZIP endpoint (1 req/min per token). Monitor Download table size (archive old rows quarterly). |
| **200-1000 collections** | Move ZIP generation to background jobs (queue system like BullMQ or Laravel Queue). Store pre-generated ZIPs on disk for 30 days, serve directly via nginx. Shard uploads directory by date (uploads/YYYY-MM/collectionId/). |
| **1000+ collections** | Migrate to object storage (S3/Cloudflare R2) for edited photos. Use signed URLs for direct downloads (bypass PHP). Implement CDN for delivery page static assets. Archive Download records to separate analytics database. |

### Scaling Priorities

1. **First bottleneck (at ~100 collections):** ZIP generation CPU spikes on concurrent downloads
   - **Fix:** Rate limit ZIP endpoint (1 request per minute per token), show "Preparing download..." message
   - **Alternative:** Pre-generate ZIP when status → DELIVERED (stored in `Collection.processedZipPath`)

2. **Second bottleneck (at ~500 collections):** Disk I/O for reading photo files during ZIP creation
   - **Fix:** Use SSD storage for uploads directory, optimize file reading with larger buffer sizes
   - **Alternative:** Migrate to object storage with direct download links (S3 presigned URLs)

3. **Third bottleneck (at ~1000 collections):** Download table size and query performance
   - **Fix:** Add indexes on `collectionId + downloadedAt`, partition table by year
   - **Alternative:** Move analytics to separate read-optimized database (Clickhouse or TimescaleDB)

---

## Anti-Patterns

### Anti-Pattern 1: Pre-Generating ZIPs on Status Change

**What people do:** Generate ZIP when photographer clicks "Mark as Delivered", store in `Collection.processedZipPath`.

**Why it's wrong:**
- Wastes disk space (ZIPs may never be downloaded)
- Stale files if photographer re-uploads edited photos
- Requires cleanup cron job to delete old ZIPs
- Increases complexity (when to regenerate? when to invalidate?)

**Do this instead:** Generate ZIP on-demand when client clicks download. Use caching only if download frequency justifies it (track stats first).

**Exception:** For very large collections (500+ photos, 5GB+ total), pre-generation may be necessary to avoid 60+ second wait times. In this case, store ZIP and set TTL of 30 days.

---

### Anti-Pattern 2: Using shareId for Delivery

**What people do:** Allow clients to download edited photos from the same `/share/{shareId}` page used for selection.

**Why it's wrong:**
- No clear lifecycle boundary (when is selection done?)
- Client can download during REVIEWING phase (before photographer approves)
- Can't expire selection access without expiring delivery access
- Confusing UX (same page shows different content based on status)

**Do this instead:** Use separate `deliveryToken` generated only after REVIEWING → DELIVERED transition. This enforces workflow boundaries and allows independent expiration.

---

### Anti-Pattern 3: Storing Full File Paths in Download Table

**What people do:** Store `EditedPhoto.storagePath` directly in `Download` table for auditing.

**Why it's wrong:**
- Path may change if files are moved/reorganized
- Increases storage overhead (VARCHAR(191) per download)
- Couples Download records to filesystem structure
- Makes database backups larger

**Do this instead:** Store only `photoId` foreign key. Join to `EditedPhoto` table when full path is needed. This normalizes data and decouples tracking from storage.

---

### Anti-Pattern 4: Blocking ZIP Generation (Synchronous)

**What people do:** Generate ZIP inline during HTTP request, blocking browser until complete.

**Why it's wrong:**
- Long wait times (30+ seconds for large collections)
- Browser timeout risk (default 60-120 seconds)
- Server thread/process blocked during generation
- Poor UX (no progress indicator possible)

**Do this instead:**
- **For small collections (< 50 photos):** Inline generation is acceptable (< 10 second generation time)
- **For large collections (50+ photos):** Use background job queue. Return 202 Accepted, poll for completion, stream when ready.

**Example (background job approach):**
```php
// Step 1: Client requests ZIP
POST /delivery/{token}/zip/prepare
→ Returns: { "jobId": "abc123", "status": "pending" }

// Step 2: Client polls for status
GET /delivery/{token}/zip/status/{jobId}
→ Returns: { "status": "ready", "downloadUrl": "/delivery/{token}/zip/download/{jobId}" }

// Step 3: Client downloads completed ZIP
GET /delivery/{token}/zip/download/{jobId}
→ Streams pre-generated ZIP file
```

---

## Security Considerations

### Token Entropy

**Delivery tokens must be unguessable:**
- Use `random_bytes(16)` for 128-bit entropy (32-char hex string)
- Avoid timestamp-based or sequential tokens
- Index `deliveryToken` column for O(1) lookups

### Access Control

**Delivery endpoints are public (no session auth):**
- Verify deliveryToken exists in Collection table
- Don't expose userId or other sensitive collection metadata
- Rate limit by token to prevent abuse (10 requests/minute per token)

### File Access

**Prevent path traversal attacks:**
- Use existing `safeDeleteUploadedFile()` pattern from `utils.php`
- Validate photoId belongs to collection before streaming
- Use `realpath()` to resolve symlinks and validate paths are within `uploads/`

**Example:**
```php
function safeStreamFile($storagePath) {
    $uploadsBase = realpath(__DIR__ . '/uploads');
    $filePath = realpath(__DIR__ . '/' . $storagePath);

    if (!$filePath || strpos($filePath, $uploadsBase) !== 0) {
        http_response_code(403);
        exit;
    }

    readfile($filePath);
}
```

### CORS for Delivery Page

**Delivery page is public, no CORS restrictions needed:**
- Add `/delivery/*` to allowed origins in `backend/cors.php`
- Delivery endpoints don't use sessions, so no `credentials: "include"` needed

---

## Existing Architecture Reuse

### Components to Reuse (No Changes)

| Component | Reuse For | Notes |
|-----------|-----------|-------|
| `utils.php::generateCuid()` | Download record IDs | Already available, no changes needed |
| `utils.php::isValidId()` | Validate photoId in download endpoints | Prevents path traversal |
| `utils.php::getUploadsBasePath()` | Resolve file paths for ZIP generation | Consistent path handling |
| `utils.php::parseRouteParts()` | Parse delivery token from URL | Already handles route parsing |
| `backend/db.php::getDbConnection()` | All new delivery endpoints | Existing PDO connection factory |
| `frontend/src/i18n.js` | Translate delivery page UI | Add `delivery` namespace to locale files |
| `frontend/src/components/Accordion.jsx` | Optional: FAQ section on delivery page | Already built, reuse as-is |

### Components to Modify

| Component | Modification | Reason |
|-----------|-------------|--------|
| `backend/index.php` | Add `/collections/{id}/delivery` and `/delivery/*` routes | New endpoints for delivery system |
| `backend/collections/id.php` | Return `deliveryToken` and `deliveredAt` in GET response | Frontend needs to display delivery link |
| `frontend/src/pages/CollectionDetailsPage.jsx` | Add "Generate Delivery Link" button + link display | Main photographer UI for delivery |
| `frontend/src/pages/CollectionsListPage.jsx` | Show deliveredAt timestamp in collection cards | Visual indicator of delivery status |
| `frontend/src/App.jsx` | Add route: `/delivery/:token` → `DeliveryPage` | Public route (no ProtectedRoute wrapper) |
| `frontend/src/locales/*.json` | Add `delivery` namespace with translations | UI strings for delivery page |
| `database_schema.sql` | Add columns + Download table (see above) | Schema changes for delivery system |

---

## Recommended Build Order

Based on dependencies and integration complexity:

### Phase 1: Database Schema (Foundation)
1. Add `deliveryToken` and `deliveredAt` columns to Collection table
2. Create `Download` table with indexes
3. Run migration on development database
4. **Verify:** Query Collection table, insert test Download record

### Phase 2: Backend Delivery Token Generation (Core Logic)
1. Create `backend/collections/delivery.php` handler
   - POST endpoint: generate token, update status
   - Verify ownership + status = REVIEWING
   - Return deliveryToken in response
2. Update `backend/index.php` router to dispatch `/collections/{id}/delivery`
3. Modify `backend/collections/id.php` to return `deliveryToken` and `deliveredAt` in GET response
4. **Verify:** POST to endpoint with authenticated session, check Collection table updated

### Phase 3: Backend Public Delivery Endpoints (Read-Only)
1. Create `backend/delivery/index.php` handler
   - GET endpoint: fetch collection + edited photos by deliveryToken
   - Public (no session auth)
   - Return only safe fields (no userId, no sensitive data)
2. Update `backend/index.php` router to dispatch `/delivery/{token}`
3. **Verify:** GET /delivery/{token} with valid token, check response includes edited photos

### Phase 4: Frontend Delivery Link Generation (Photographer UI)
1. Modify `frontend/src/pages/CollectionDetailsPage.jsx`
   - Add "Generate Delivery Link" button (visible when status = REVIEWING)
   - POST to `/collections/{id}/delivery` on click
   - Display delivery link with copy button once generated
2. Add `delivery` namespace to `frontend/src/locales/*.json` (all 3 languages)
3. Update `frontend/src/pages/CollectionsListPage.jsx` to show deliveredAt timestamp
4. **Verify:** Click button, copy link, check Collection status updated to DELIVERED

### Phase 5: Frontend Public Delivery Page (Client UI)
1. Create `frontend/src/pages/DeliveryPage.jsx`
   - Fetch `/delivery/{token}` on mount
   - Display collection name, client name, edited photos grid
   - Add "Download All (ZIP)" button (stub, no functionality yet)
   - Add individual "Download" button per photo (stub)
2. Add route in `frontend/src/App.jsx`: `/delivery/:token` → `DeliveryPage` (no auth)
3. **Verify:** Visit /delivery/{token} in browser, see photos displayed

### Phase 6: Backend ZIP Download (Complex)
1. Create `backend/delivery/zip.php` handler
   - GET endpoint: generate ZIP on-demand
   - Use ZipArchive with addFile() for memory efficiency
   - Stream with Content-Disposition header
   - Clean up temp file after streaming
2. Add `trackDownload()` function to `utils.php`
3. Call `trackDownload($pdo, $collectionId, 'ZIP')` in zip.php before streaming
4. Update `backend/index.php` router to dispatch `/delivery/{token}/zip`
5. Wire up frontend "Download All" button in DeliveryPage.jsx
6. **Verify:** Click "Download All" button, receive ZIP file with all edited photos

### Phase 7: Backend Individual Photo Download
1. Create `backend/delivery/download.php` handler
   - GET endpoint: stream single edited photo
   - Verify photoId belongs to collection
   - Use `safeStreamFile()` pattern to prevent path traversal
   - Track download: call `trackDownload($pdo, $collectionId, 'PHOTO', $photoId)`
2. Update `backend/index.php` router to dispatch `/delivery/{token}/download/{photoId}`
3. Wire up frontend "Download" buttons in DeliveryPage.jsx
4. **Verify:** Click individual photo download, receive file

### Phase 8: Download Analytics Display (Polish)
1. Modify `backend/collections/id.php` to include download stats in response
   - Query: `SELECT COUNT(*), MAX(downloadedAt) FROM Download WHERE collectionId = ?`
2. Display stats in `CollectionDetailsPage.jsx`
   - Show: "Downloaded X times, last on [date]"
   - Optionally: separate ZIP vs individual photo counts
3. **Verify:** Download files multiple times, refresh collection details, see counts increment

### Phase 9: UI Polish and i18n
1. Add loading states (spinner during ZIP generation)
2. Add error handling (404 for invalid token, 500 for ZIP generation failure)
3. Add success toasts ("Link copied!", "Download started")
4. Translate all new UI strings to LT and RU
5. Add status badge color for DELIVERED status (purple/indigo)
6. **Verify:** Test all languages, test error cases

### Phase 10: Rate Limiting and Security Hardening (Optional, Production-Ready)
1. Add rate limiting to ZIP endpoint (1 request/minute per token)
   - Use PHP session or file-based cache (e.g., APCu, Redis)
   - Return 429 Too Many Requests if exceeded
2. Add IP address and user agent tracking (optional, GDPR consideration)
3. Add indexes on Download table for analytics queries
4. Add CORS headers for `/delivery/*` endpoints
5. **Verify:** Test concurrent downloads, verify rate limits enforced

---

## Download Tracking Schema Rationale

**Why separate table instead of counter in Collection?**
- Granular audit trail (when, what, optional who)
- Enables analytics (download trends, peak times)
- Supports photo-level tracking (which photos downloaded individually)
- Can be archived/partitioned as data grows

**Why track IP and user agent?**
- Abuse detection (excessive downloads from single IP)
- Geographic analytics (where are clients located)
- Forensic evidence if unauthorized sharing suspected

**Privacy consideration:**
- IP addresses are PII under GDPR
- Make these columns nullable, let photographer opt-in via settings
- Document retention policy (delete after 90 days, or on collection archive)

**Alternative (minimal tracking):**
```sql
-- Ultra-minimal: just counters, no table
ALTER TABLE `Collection` ADD COLUMN `zipDownloadCount` INT DEFAULT 0;
ALTER TABLE `Collection` ADD COLUMN `lastDownloadedAt` DATETIME(3) NULL;

-- Update on each download
UPDATE `Collection` SET zipDownloadCount = zipDownloadCount + 1, lastDownloadedAt = NOW(3) WHERE id = ?;
```

**Trade-off:** Simpler schema, but loses granularity (can't see download history or photo-level stats).

---

## Sources

### PHP ZipArchive Performance and Best Practices
- [PHP: ZipArchive - Manual](https://www.php.net/manual/en/class.ziparchive.php) — Official PHP documentation
- [A Guide to the PHP ZipArchive Library for File Compression | Reintech media](https://reintech.io/blog/guide-php-ziparchive-library-file-compression) — Implementation guide
- [Performance Optimization of PHP ZipArchive Extension: How to Improve Processing Speed-PHP Tutorial-php.cn](https://global.php.cn/faq/704495.html) — Performance optimization strategies, block size tuning
- [Creating a zip file with PHP's ZipArchive](https://akrabat.com/creating-a-zip-file-with-phps-ziparchive/) — Practical examples
- [How to Create Zip Files using PHP ZipArchive and Download - Phppot](https://phppot.com/php/php-create-zip-ziparchive-files-download/) — Download implementation

### Photo Delivery Platform Architecture
- [Pixieset Client Gallery | Share, Deliver, Proof & Sell Photos](https://pixieset.com/client-gallery/) — Commercial photo delivery platform (2026 reference)
- [Lightfolio: Client Photo Gallery for Photographers](https://www.lightfolio.com/) — Download tracking and analytics features
- [The best photo gallery for photographers in 2026 - Pixieset Blog](https://blog.pixieset.com/blog/best-photo-gallery/) — Industry best practices

### Token Architecture and Security
- [Microservices Pattern: Pattern: Access token](https://microservices.io/patterns/security/access-token.html) — Token separation patterns
- [Key Approaches to Token Sharing | Curity](https://curity.io/resources/learn/token-sharing/) — Token scope and security
- [Token Best Practices - Auth0 Docs](https://auth0.com/docs/secure/tokens/token-best-practices) — Security recommendations

### Download Tracking and Analytics
- [How to Keep Track of What the Users Do | Vertabelo Database Modeler](https://vertabelo.com/blog/database-design-how-to-keep-track-of-what-the-users-do/) — Database schema patterns for user actions
- [Database schema: API Reference - Matomo Analytics (formerly Piwik Analytics) - Developer Docs - v5](https://developer.matomo.org/guides/database-schema) — Analytics database architecture
- [15 user behavior analytics tools in 2026](https://usermaven.com/blog/user-behavior-analytics-tools) — Modern analytics patterns

---

*Architecture research for: Photo Hub v2.0 Delivery System*
*Researched: 2026-02-13*
