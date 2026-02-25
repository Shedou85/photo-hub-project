/**
 * Generates a script that copies selected photos into a _Selected subfolder
 * and opens them in Adobe Lightroom Classic (auto-import).
 * Falls back to opening the folder in file explorer if Lightroom is not found.
 *
 * @param {string} sourceFolder - Local folder path (e.g. "D:\Photos\Wedding2024")
 * @param {Array<{filename: string}>} selectedPhotos - Photos selected by the client
 * @param {string} collectionName - Collection name for the script filename
 * @param {string} [lightroomPath] - Optional custom Lightroom.exe path
 */
export function generateLightroomScript(sourceFolder, selectedPhotos, collectionName, lightroomPath) {
  const isWindows = navigator.userAgent.includes('Windows');
  const safeName = collectionName.replace(/[^a-zA-Z0-9_-]/g, '_');

  let content;
  let filename;

  if (isWindows) {
    const folder = sourceFolder.replace(/\//g, '\\').replace(/\\$/, '');
    const selectedFolder = `${folder}\\_Selected`;
    const customLrPath = lightroomPath ? lightroomPath.replace(/\//g, '\\').replace(/\\$/, '') : '';

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
    lines.push('echo.');

    // Find Lightroom Classic executable
    lines.push('set "LR_EXE="');

    // 1. Use custom path if configured
    if (customLrPath) {
      lines.push(`if exist "${customLrPath}" set "LR_EXE=${customLrPath}"`);
      lines.push('');
    }

    // 2. Search common Program Files paths
    lines.push('if not defined LR_EXE (');
    lines.push('    for /d %%D in ("%ProgramFiles%\\Adobe\\Adobe Lightroom Classic*") do (');
    lines.push('        if exist "%%D\\Lightroom.exe" set "LR_EXE=%%D\\Lightroom.exe"');
    lines.push('    )');
    lines.push(')');
    lines.push('if not defined LR_EXE (');
    lines.push('    for /d %%D in ("%ProgramFiles(x86)%\\Adobe\\Adobe Lightroom Classic*") do (');
    lines.push('        if exist "%%D\\Lightroom.exe" set "LR_EXE=%%D\\Lightroom.exe"');
    lines.push('    )');
    lines.push(')');

    // 3. Try Windows Registry
    lines.push('if not defined LR_EXE (');
    lines.push('    for /f "tokens=2*" %%A in (\'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\lightroom.exe" /ve 2^>nul\') do set "LR_EXE=%%B"');
    lines.push(')');

    lines.push('');
    lines.push('if defined LR_EXE (');
    lines.push('    echo Opening Lightroom Classic...');
    lines.push(`    start "" "%LR_EXE%" "${selectedFolder}"`);
    lines.push(') else (');
    lines.push('    echo Lightroom Classic not found. Opening folder instead...');
    lines.push(`    start "" "${selectedFolder}"`);
    lines.push(')');
    lines.push('pause');

    content = lines.join('\r\n');
    filename = `${safeName}_selected.bat`;
  } else {
    const folder = sourceFolder.replace(/\/$/g, '');
    const selectedFolder = `${folder}/_Selected`;
    const customLrPath = lightroomPath || '';

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
    lines.push('echo ""');

    // Find Lightroom Classic on macOS
    lines.push('LR_APP=""');

    // 1. Use custom path if configured
    if (customLrPath) {
      lines.push(`if [ -d "${customLrPath}" ] || [ -f "${customLrPath}" ]; then`);
      lines.push(`    LR_APP="${customLrPath}"`);
      lines.push('fi');
      lines.push('');
    }

    // 2. Search /Applications
    lines.push('if [ -z "$LR_APP" ]; then');
    lines.push('    for d in "/Applications/Adobe Lightroom Classic"*; do');
    lines.push('        if [ -d "$d" ]; then');
    lines.push('            LR_APP="$d"');
    lines.push('        fi');
    lines.push('    done');
    lines.push('fi');

    lines.push('');
    lines.push('if [ -n "$LR_APP" ]; then');
    lines.push('    echo "Opening Lightroom Classic..."');
    lines.push(`    open -a "$LR_APP" "${selectedFolder}"`);
    lines.push('else');
    lines.push('    echo "Lightroom Classic not found. Opening folder instead..."');
    lines.push(`    open "${selectedFolder}" 2>/dev/null || xdg-open "${selectedFolder}" 2>/dev/null`);
    lines.push('fi');
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
