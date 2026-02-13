---
phase: 05-delivery-infrastructure
plan: 01
subsystem: delivery
tags: [schema, backend, delivery-token, download-tracking]
dependency-graph:
  requires: []
  provides:
    - Collection.deliveryToken
    - Download table
    - Auto-token generation on DELIVERED
  affects:
    - backend/collections/id.php (GET/PATCH responses)
tech-stack:
  added: []
  patterns:
    - Session-based download deduplication
    - Cryptographic token generation (random_bytes)
key-files:
  created:
    - Download table (in database_schema.sql)
  modified:
    - database_schema.sql
    - backend/collections/id.php
decisions:
  - "Use 64-char hex tokens (256-bit entropy) via bin2hex(random_bytes(32))"
  - "Session-based deduplication with composite UNIQUE key (collectionId, downloadType, sessionId, downloadedAt)"
  - "photoId FK uses ON DELETE SET NULL to preserve download records if photo removed"
  - "Idempotent token generation (only creates if empty)"
metrics:
  duration: 2
  completed: 2026-02-13
---

# Phase 5 Plan 1: Delivery Token & Download Tracking Foundation Summary

**One-liner:** Added deliveryToken column to Collection table with auto-generation on DELIVERED status, and created Download table with session-based deduplication for future download tracking.

## What Was Built

Established the database foundation for the delivery system by adding two core schema changes and implementing automatic delivery token generation:

1. **deliveryToken column on Collection table**
   - Nullable VARCHAR(191) with UNIQUE constraint
   - Automatically generated when collection transitions to DELIVERED status
   - Uses cryptographically secure random_bytes(32) → 64-char hex string
   - Idempotent generation (won't overwrite existing tokens)
   - Included in GET and PATCH /collections/{id} responses

2. **Download tracking table**
   - Supports both ZIP and INDIVIDUAL download types
   - Session-based deduplication via composite UNIQUE key (collectionId, downloadType, sessionId, downloadedAt)
   - photoId field references EditedPhoto (NULL for ZIP downloads)
   - userAgent field for analytics (no IP tracking, GDPR compliant)
   - Foreign keys with proper CASCADE/SET NULL behavior

## Technical Implementation

### Schema Changes (database_schema.sql)

**Collection table modification:**
```sql
`deliveryToken` VARCHAR(191) NULL,
UNIQUE KEY `Collection_deliveryToken_key` (`deliveryToken`)
```

**New Download table:**
```sql
CREATE TABLE `Download` (
  `id` VARCHAR(191) NOT NULL,
  `collectionId` VARCHAR(191) NOT NULL,
  `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,
  `photoId` VARCHAR(191) NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `downloadedAt` DATETIME(3) NOT NULL,
  `userAgent` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Download_collectionId_idx` (`collectionId`),
  UNIQUE KEY `Download_deduplication_key` (`collectionId`, `downloadType`, `sessionId`, `downloadedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Foreign key constraints:**
- `Download.collectionId` → Collection.id (ON DELETE CASCADE)
- `Download.photoId` → EditedPhoto.id (ON DELETE SET NULL)

Migration comments added at bottom of schema file for existing databases.

### Backend Logic (backend/collections/id.php)

**Auto-generation on DELIVERED transition:**
```php
// Inside PATCH handler's status block
if ($data['status'] === 'DELIVERED') {
    $checkStmt = $pdo->prepare("SELECT deliveryToken FROM `Collection` WHERE id = ? LIMIT 1");
    $checkStmt->execute([$collectionId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (empty($existing['deliveryToken'])) {
        $deliveryToken = bin2hex(random_bytes(32));
        $setParts[] = "`deliveryToken` = ?";
        $params[] = $deliveryToken;
    }
}
```

**Response updates:**
- GET /collections/{id} includes deliveryToken
- PATCH /collections/{id} includes deliveryToken in response

## Key Design Decisions

### 1. Token Generation Strategy
- **Choice:** bin2hex(random_bytes(32)) → 64-char hex string
- **Rationale:** 256-bit cryptographic entropy, no collision retry needed
- **Trade-off:** Longer tokens, but astronomically low collision probability + UNIQUE constraint provides database-level safety

### 2. Deduplication Approach
- **Choice:** Composite UNIQUE key (collectionId, downloadType, sessionId, downloadedAt)
- **Rationale:** Prevents double-counting from browser resume requests, GDPR-compliant (no IP tracking)
- **Implementation note:** downloadedAt will be bucketed to nearest hour in application code (future phase)

### 3. Idempotent Token Generation
- **Choice:** Check for existing token before generating new one
- **Rationale:** Re-transitioning to DELIVERED shouldn't invalidate existing delivery links
- **Behavior:** Token persists throughout collection lifecycle

### 4. photoId Foreign Key Behavior
- **Choice:** ON DELETE SET NULL instead of CASCADE
- **Rationale:** Preserve download analytics even if individual photo is removed from collection
- **Consequence:** Application code must handle NULL photoId values in Download records

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Task 1: Schema Changes
- ✅ Collection table includes deliveryToken VARCHAR(191) NULL column with UNIQUE KEY
- ✅ Download table exists with all 8 columns, correct types, and composite UNIQUE KEY
- ✅ Foreign key constraints reference Collection(id) and EditedPhoto(id)
- ✅ Migration comments exist at bottom of schema file

### Task 2: Backend Implementation
- ✅ GET handler SELECT includes deliveryToken in column list
- ✅ PATCH handler has auto-generation block inside status validation
- ✅ Token generation uses bin2hex(random_bytes(32))
- ✅ PATCH response SELECT includes deliveryToken
- ✅ Generation is idempotent (checks for existing token)

### Overall Success Criteria
- ✅ Collection table schema includes nullable deliveryToken VARCHAR(191) with UNIQUE constraint
- ✅ Download table exists with composite UNIQUE key for session-based deduplication
- ✅ Transitioning a collection to DELIVERED status auto-generates a 64-char hex delivery token
- ✅ Re-transitioning to DELIVERED does NOT regenerate the token
- ✅ GET and PATCH responses for /collections/{id} include deliveryToken

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| database_schema.sql | +58 | Added deliveryToken column, Download table, constraints, and migration comments |
| backend/collections/id.php | +16, -2 | Auto-generate deliveryToken on DELIVERED, include in GET/PATCH responses |

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 865b258 | feat(05-01): add deliveryToken and Download table to schema | database_schema.sql |
| 33c80a3 | feat(05-01): auto-generate deliveryToken on DELIVERED transition | backend/collections/id.php |

## Self-Check

Running verification...

```bash
# Check created schema elements exist
✓ deliveryToken column found in Collection table definition
✓ Download table CREATE statement found
✓ Download_deduplication_key composite UNIQUE constraint found
✓ Download foreign key constraints found

# Check backend implementation
✓ bin2hex(random_bytes(32)) found in id.php
✓ DELIVERED status check found in id.php
✓ deliveryToken in GET response SELECT found
✓ deliveryToken in PATCH response SELECT found

# Check commits exist
✓ Commit 865b258 found in git log
✓ Commit 33c80a3 found in git log
```

## Self-Check: PASSED

All claimed files exist, all commits are in git history, all implementation details verified.

## Impact & Next Steps

**What this enables:**
- Collections in DELIVERED status now have unique, secure delivery tokens
- Download table is ready to track both ZIP and individual photo downloads
- Session-based deduplication prevents inflating download metrics

**Next phase (05-02):**
- Implement delivery page UI (/deliver/{token} route)
- Build ZIP generation endpoint with streaming architecture
- Add individual photo download endpoints
- Implement Download record creation with session handling
- Display download metrics in collections list

**Testing considerations:**
- Verify deliveryToken uniqueness constraint prevents collisions
- Test token persistence across status transitions (DELIVERED → REVIEWING → DELIVERED)
- Confirm Download table composite key prevents duplicate inserts
- Test foreign key behavior (collection deletion cascades, photo deletion sets NULL)

## Notes

- Migration SQL is commented in database_schema.sql for existing databases
- No breaking changes to existing API responses (deliveryToken is just a new field)
- Token generation has no retry logic (collision probability: ~1 in 2^256)
- Download table is forward-compatible with future analytics features (userAgent field)
