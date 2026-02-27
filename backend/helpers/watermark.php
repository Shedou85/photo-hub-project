<?php

declare(strict_types=1);

// backend/helpers/watermark.php
//
// GD-based watermark utilities.
// Provides functions for stamping a diagonal "PREVIEW" text watermark on
// GD image resources and for batch-processing collection thumbnails stored
// in Cloudflare R2.

require_once __DIR__ . '/r2.php';

/**
 * Applies a diagonal centered text watermark with drop-shadow to an image.
 *
 * The watermark is drawn at -30 degrees across the center of the canvas.
 * Font size is proportional to the image diagonal so it scales naturally
 * across thumbnails of any aspect ratio.
 *
 * Alpha values use GD's 0-127 scale where 0 = fully opaque and
 * 127 = fully transparent.
 *
 * @param GdImage $image  The GD image resource to draw on (mutated in-place).
 * @param int     $width  Canvas width in pixels.
 * @param int     $height Canvas height in pixels.
 * @param string  $text   Watermark label; defaults to 'PREVIEW'.
 * @return void
 */
function applyWatermark(GdImage $image, int $width, int $height, string $text = 'PREVIEW'): void
{
    $fontPath = __DIR__ . '/../assets/fonts/inter-bold.ttf';

    // Font size ~5% of the image diagonal for consistent visual weight.
    $diagonal = sqrt(($width ** 2) + ($height ** 2));
    $fontSize  = (float) ($diagonal * 0.05);

    $angle = -30.0;

    // --- Colours (GD alpha: 0 = opaque, 127 = transparent) ----------------

    // White at ~35% opacity  → alpha ≈ 80
    $colorText = imagecolorallocatealpha($image, 255, 255, 255, 80);

    // Black at ~22% opacity  → alpha ≈ 100
    $colorShadow = imagecolorallocatealpha($image, 0, 0, 0, 100);

    // Enable alpha blending so semi-transparent colours composite correctly.
    imagealphablending($image, true);

    // --- Compute centered position -----------------------------------------

    // imagettfbbox() returns 8 ints: [x0,y0, x1,y1, x2,y2, x3,y3]
    // (lower-left, lower-right, upper-right, upper-left corners of the bbox).
    $bbox = imagettfbbox($fontSize, $angle, $fontPath, $text);

    if ($bbox === false) {
        // GD could not measure the text (e.g. font file missing). Bail out
        // silently so the thumbnail pipeline degrades gracefully.
        error_log('[applyWatermark] imagettfbbox() returned false — check font path: ' . $fontPath);
        return;
    }

    // Bounding-box width and height (accounting for rotation).
    $textWidth  = abs($bbox[4] - $bbox[0]);
    $textHeight = abs($bbox[5] - $bbox[1]);

    // Position where imagettftext() should start (baseline of first character).
    $x = (int) (($width  - $textWidth)  / 2);
    $y = (int) (($height + $textHeight) / 2);

    // --- Draw shadow first, then text on top --------------------------------

    imagettftext($image, $fontSize, $angle, $x + 2, $y + 2, $colorShadow, $fontPath, $text);
    imagettftext($image, $fontSize, $angle, $x,     $y,     $colorText,   $fontPath, $text);
}

/**
 * Batch-generates watermarked thumbnails for every photo in a collection.
 *
 * For each photo row that has a thumbnailPath the function:
 *  1. Fetches the existing thumbnail from R2.
 *  2. Loads it into GD via imagecreatefromstring().
 *  3. Stamps the watermark with applyWatermark().
 *  4. Encodes to JPEG (quality 85) and uploads to R2 at
 *     collections/{collectionId}/watermarked/{photoId}_wm.jpg
 *
 * Individual failures are caught and logged; the batch continues processing
 * the remaining photos.
 *
 * @param PDO    $pdo           Active database connection.
 * @param string $collectionId  CUID of the collection to process.
 * @return int                  Count of thumbnails successfully watermarked.
 */
function generateWatermarkedThumbnails(PDO $pdo, string $collectionId): int
{
    $stmt = $pdo->prepare(
        'SELECT id, thumbnailPath FROM Photo WHERE collectionId = ? AND thumbnailPath IS NOT NULL'
    );
    $stmt->execute([$collectionId]);

    /** @var array<array{id: string, thumbnailPath: string}> $photos */
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $successCount = 0;

    foreach ($photos as $photo) {
        $photoId       = $photo['id'];
        $thumbnailPath = $photo['thumbnailPath'];

        try {
            // 1. Fetch the existing thumbnail from R2 as a PSR-7 stream.
            $stream = r2GetStream($thumbnailPath);

            // 2. Load the raw bytes into a GD image resource.
            $imageData = (string) $stream;
            $image = imagecreatefromstring($imageData);

            if ($image === false) {
                error_log(
                    '[generateWatermarkedThumbnails] imagecreatefromstring() failed '
                    . 'for photo "' . $photoId . '" (key: ' . $thumbnailPath . ')'
                );
                continue;
            }

            // 3. Retrieve dimensions and apply the watermark.
            $width  = imagesx($image);
            $height = imagesy($image);

            applyWatermark($image, $width, $height);

            // 4. Write watermarked JPEG to a temp file.
            $tmpPath = sys_get_temp_dir() . '/wm_' . uniqid('', true) . '.jpg';
            $saved   = @imagejpeg($image, $tmpPath, 85);

            imagedestroy($image);

            if (!$saved) {
                error_log(
                    '[generateWatermarkedThumbnails] imagejpeg() failed '
                    . 'for photo "' . $photoId . '"'
                );
                @unlink($tmpPath);
                continue;
            }

            // 5. Upload to R2.
            $key = 'collections/' . $collectionId . '/watermarked/' . $photoId . '_wm.jpg';
            r2Upload($tmpPath, $key, 'image/jpeg');

            // 6. Clean up local temp file.
            @unlink($tmpPath);

            $successCount++;
        } catch (\Throwable $e) {
            error_log(
                '[generateWatermarkedThumbnails] Error processing photo "' . $photoId . '": '
                . $e->getMessage()
            );

            // Ensure temp file is removed even on unexpected failure.
            if (isset($tmpPath) && file_exists($tmpPath)) {
                @unlink($tmpPath);
            }
        }
    }

    return $successCount;
}
