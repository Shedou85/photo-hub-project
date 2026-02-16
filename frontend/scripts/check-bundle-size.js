#!/usr/bin/env node

/**
 * Bundle Size Checker
 *
 * Analyzes dist/assets/ directory and reports bundle sizes (raw and gzipped).
 * Enforces QUALITY-01: CSS gzipped total must be under 50KB.
 *
 * Usage: node scripts/check-bundle-size.js
 * Exit codes: 0 (pass), 1 (CSS budget exceeded)
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_ASSETS = path.resolve(__dirname, '../dist/assets');
const CSS_BUDGET_KB = 50;

/**
 * Get gzipped size of a file
 */
function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  return gzipped.length;
}

/**
 * Format bytes to KB with 2 decimals
 */
function toKB(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Analyze all files in dist/assets
 */
function analyzeBundles() {
  if (!fs.existsSync(DIST_ASSETS)) {
    console.error('❌ Error: dist/assets/ not found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_ASSETS);
  const cssFiles = [];
  const jsFiles = [];

  // Categorize files
  for (const file of files) {
    const filePath = path.join(DIST_ASSETS, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;

    const ext = path.extname(file);
    if (ext === '.css') {
      cssFiles.push(file);
    } else if (ext === '.js') {
      jsFiles.push(file);
    }
  }

  // Calculate sizes
  const results = [];
  let cssGzippedTotal = 0;
  let jsGzippedTotal = 0;

  // Process CSS files
  for (const file of cssFiles) {
    const filePath = path.join(DIST_ASSETS, file);
    const rawSize = fs.statSync(filePath).size;
    const gzipSize = getGzipSize(filePath);
    cssGzippedTotal += gzipSize;

    results.push({
      file,
      type: 'CSS',
      rawKB: toKB(rawSize),
      gzipKB: toKB(gzipSize),
    });
  }

  // Process JS files
  for (const file of jsFiles) {
    const filePath = path.join(DIST_ASSETS, file);
    const rawSize = fs.statSync(filePath).size;
    const gzipSize = getGzipSize(filePath);
    jsGzippedTotal += gzipSize;

    results.push({
      file,
      type: 'JS',
      rawKB: toKB(rawSize),
      gzipKB: toKB(gzipSize),
    });
  }

  return {
    results,
    cssGzippedTotal,
    jsGzippedTotal,
  };
}

/**
 * Print results table
 */
function printResults(data) {
  console.log('\n📦 Bundle Size Analysis\n');
  console.log('─'.repeat(80));
  console.log(
    'File'.padEnd(40) +
    'Type'.padEnd(8) +
    'Raw (KB)'.padEnd(12) +
    'Gzipped (KB)'
  );
  console.log('─'.repeat(80));

  for (const item of data.results) {
    console.log(
      item.file.padEnd(40) +
      item.type.padEnd(8) +
      item.rawKB.padStart(8).padEnd(12) +
      item.gzipKB.padStart(12)
    );
  }

  console.log('─'.repeat(80));
  console.log(
    'TOTAL CSS (gzipped)'.padEnd(48) +
    `${toKB(data.cssGzippedTotal)} KB`.padStart(12)
  );
  console.log(
    'TOTAL JS (gzipped)'.padEnd(48) +
    `${toKB(data.jsGzippedTotal)} KB`.padStart(12)
  );
  console.log('─'.repeat(80));
}

/**
 * Check CSS budget
 */
function checkBudget(cssGzippedTotal) {
  const cssKB = cssGzippedTotal / 1024;

  console.log('\n🎯 Budget Check (QUALITY-01)\n');
  console.log(`CSS gzipped: ${toKB(cssGzippedTotal)} KB`);
  console.log(`Budget limit: ${CSS_BUDGET_KB} KB`);

  if (cssKB > CSS_BUDGET_KB) {
    const excess = cssKB - CSS_BUDGET_KB;
    console.log(`\n❌ FAIL: CSS exceeds budget by ${excess.toFixed(2)} KB\n`);
    return false;
  } else {
    const remaining = CSS_BUDGET_KB - cssKB;
    console.log(`\n✅ PASS: ${remaining.toFixed(2)} KB remaining\n`);
    return true;
  }
}

// Main execution
try {
  const data = analyzeBundles();
  printResults(data);
  const passed = checkBudget(data.cssGzippedTotal);
  process.exit(passed ? 0 : 1);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
