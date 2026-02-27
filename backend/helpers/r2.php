<?php

declare(strict_types=1);

// backend/helpers/r2.php
//
// Cloudflare R2 (S3-compatible) helper functions.
// Requires aws/aws-sdk-php ^3.0 via Composer.

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use GuzzleHttp\Psr7\StreamInterface;

/**
 * Returns the cached R2 config array (bucket, public_url, etc.).
 */
function getR2Config(): array
{
    static $r2Config = null;

    if ($r2Config === null) {
        $config   = require __DIR__ . '/../config.php';
        $r2Config = $config['r2'];
    }

    return $r2Config;
}

/**
 * Returns a singleton S3Client configured for Cloudflare R2.
 */
function getR2Client(): S3Client
{
    static $client = null;

    if ($client !== null) {
        return $client;
    }

    $r2Config = getR2Config();

    $client = new S3Client([
        'version'                 => '2006-03-01',
        'region'                  => 'auto',
        'endpoint'                => $r2Config['endpoint'],
        'use_path_style_endpoint' => true,
        'credentials'             => [
            'key'    => $r2Config['key'],
            'secret' => $r2Config['secret'],
        ],
    ]);

    return $client;
}

/**
 * Uploads a local file to R2.
 *
 * @param  string $localFilePath  Absolute path to the file on disk.
 * @param  string $objectKey      Destination key inside the bucket.
 * @param  string $contentType    MIME type (e.g. 'image/jpeg').
 * @return string                 The object key on success.
 * @throws \RuntimeException      On upload failure.
 */
function r2Upload(string $localFilePath, string $objectKey, string $contentType): string
{
    $bucket = getR2Config()['bucket'];

    try {
        $client = getR2Client();

        $client->putObject([
            'Bucket'      => $bucket,
            'Key'         => $objectKey,
            'SourceFile'  => $localFilePath,
            'ContentType' => $contentType,
        ]);

        return $objectKey;
    } catch (AwsException $e) {
        error_log('[r2Upload] AwsException for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 upload failed: ' . $e->getMessage(), 0, $e);
    } catch (\Throwable $e) {
        error_log('[r2Upload] Unexpected error for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 upload failed: ' . $e->getMessage(), 0, $e);
    }
}

/**
 * Deletes an object from R2.
 *
 * @param  string $objectKey  Key of the object to delete.
 * @return bool               True on success, false on failure.
 */
function r2Delete(string $objectKey): bool
{
    $bucket = getR2Config()['bucket'];

    try {
        $client = getR2Client();

        $client->deleteObject([
            'Bucket' => $bucket,
            'Key'    => $objectKey,
        ]);

        return true;
    } catch (AwsException $e) {
        error_log('[r2Delete] AwsException for key "' . $objectKey . '": ' . $e->getMessage());
        return false;
    } catch (\Throwable $e) {
        error_log('[r2Delete] Unexpected error for key "' . $objectKey . '": ' . $e->getMessage());
        return false;
    }
}

/**
 * Streams an object from R2 by returning the PSR-7 response body.
 *
 * The caller is responsible for reading/piping the returned stream.
 *
 * @param  string          $objectKey  Key of the object to fetch.
 * @return StreamInterface             PSR-7 stream of the object body.
 * @throws \RuntimeException           On fetch failure.
 */
function r2GetStream(string $objectKey): StreamInterface
{
    $bucket = getR2Config()['bucket'];

    try {
        $client = getR2Client();

        $result = $client->getObject([
            'Bucket' => $bucket,
            'Key'    => $objectKey,
        ]);

        /** @var StreamInterface $body */
        $body = $result['Body'];

        return $body;
    } catch (AwsException $e) {
        error_log('[r2GetStream] AwsException for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 stream fetch failed: ' . $e->getMessage(), 0, $e);
    } catch (\Throwable $e) {
        error_log('[r2GetStream] Unexpected error for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 stream fetch failed: ' . $e->getMessage(), 0, $e);
    }
}

/**
 * Returns the public URL for an R2 object.
 *
 * @param  string $objectKey  Key of the object.
 * @return string             Full public URL.
 */
function r2GetUrl(string $objectKey): string
{
    $publicUrl = getR2Config()['public_url'];

    return rtrim($publicUrl, '/') . '/' . ltrim($objectKey, '/');
}

/**
 * Returns the size in bytes of an R2 object via a HEAD request.
 *
 * @param  string $objectKey  Key of the object.
 * @return int                Size in bytes.
 * @throws \RuntimeException  On failure.
 */
function r2GetSize(string $objectKey): int
{
    $bucket = getR2Config()['bucket'];

    try {
        $client = getR2Client();

        $result = $client->headObject([
            'Bucket' => $bucket,
            'Key'    => $objectKey,
        ]);

        return (int) $result['ContentLength'];
    } catch (AwsException $e) {
        error_log('[r2GetSize] AwsException for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 head request failed: ' . $e->getMessage(), 0, $e);
    } catch (\Throwable $e) {
        error_log('[r2GetSize] Unexpected error for key "' . $objectKey . '": ' . $e->getMessage());
        throw new \RuntimeException('R2 head request failed: ' . $e->getMessage(), 0, $e);
    }
}
