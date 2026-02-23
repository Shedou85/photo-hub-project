/**
 * Generates a script that copies selected photos into a _Selected subfolder
 * and opens the folder in the system file explorer.
 *
 * @param {string} sourceFolder - Local folder path (e.g. "D:\Photos\Wedding2024")
 * @param {Array<{filename: string}>} selectedPhotos - Photos selected by the client
 * @param {string} collectionName - Collection name for the script filename
 */
export function generateLightroomScript(sourceFolder, selectedPhotos, collectionName) {
  const isWindows = navigator.userAgent.includes('Windows');
  const safeName = collectionName.replace(/[^a-zA-Z0-9_-]/g, '_');

  let content;
  let filename;

  if (isWindows) {
    const folder = sourceFolder.replace(/\//g, '\\').replace(/\\$/, '');
    const selectedFolder = `${folder}\\_Selected`;

    const lines = [
      '@echo off',
      'chcp 65001 >nul',
      'echo ==========================================',
      'echo   PixelForge - Open Selected Photos',
      'echo ==========================================',
      'echo.',
      `echo Source folder: ${folder}`,
      `echo Selected photos: ${selectedPhotos.length}`,
      'echo.',
      '',
      `if not exist "${folder}" (`,
      `    echo ERROR: Source folder not found: ${folder}`,
      '    echo Please check the source folder path in your collection settings.',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      `if not exist "${selectedFolder}" mkdir "${selectedFolder}"`,
      '',
    ];

    for (const photo of selectedPhotos) {
      const src = `${folder}\\${photo.filename}`;
      const dst = `${selectedFolder}\\`;
      lines.push(`if exist "${src}" (`);
      lines.push(`    copy /Y "${src}" "${dst}"`);
      lines.push(') else (');
      lines.push(`    echo WARNING: File not found - ${photo.filename}`);
      lines.push(')');
    }

    lines.push('');
    lines.push('echo.');
    lines.push(`echo Done! ${selectedPhotos.length} photos copied to _Selected folder.`);
    lines.push('echo Opening folder...');
    lines.push(`start "" "${selectedFolder}"`);
    lines.push('pause');

    content = lines.join('\r\n');
    filename = `${safeName}_selected.bat`;
  } else {
    const folder = sourceFolder.replace(/\/$/g, '');
    const selectedFolder = `${folder}/_Selected`;

    const lines = [
      '#!/bin/bash',
      '',
      'echo "=========================================="',
      'echo "  PixelForge - Open Selected Photos"',
      'echo "=========================================="',
      'echo ""',
      `echo "Source folder: ${folder}"`,
      `echo "Selected photos: ${selectedPhotos.length}"`,
      'echo ""',
      '',
      `if [ ! -d "${folder}" ]; then`,
      `    echo "ERROR: Source folder not found: ${folder}"`,
      '    echo "Please check the source folder path in your collection settings."',
      '    read -p "Press Enter to close..."',
      '    exit 1',
      'fi',
      '',
      `mkdir -p "${selectedFolder}"`,
      '',
    ];

    for (const photo of selectedPhotos) {
      const src = `${folder}/${photo.filename}`;
      const dst = `${selectedFolder}/`;
      lines.push(`if [ -f "${src}" ]; then`);
      lines.push(`    cp "${src}" "${dst}"`);
      lines.push('else');
      lines.push(`    echo "WARNING: File not found - ${photo.filename}"`);
      lines.push('fi');
    }

    lines.push('');
    lines.push('echo ""');
    lines.push(`echo "Done! ${selectedPhotos.length} photos copied to _Selected folder."`);
    lines.push('echo "Opening folder..."');
    lines.push(`open "${selectedFolder}" 2>/dev/null || xdg-open "${selectedFolder}" 2>/dev/null`);
    lines.push('read -p "Press Enter to close..."');

    content = lines.join('\n');
    filename = `${safeName}_selected.command`;
  }

  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
