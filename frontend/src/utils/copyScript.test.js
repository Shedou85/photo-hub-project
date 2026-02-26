import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCopyScript } from './copyScript';

/**
 * Helper to read Blob content as text
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('generateCopyScript', () => {
  let originalUserAgent;
  let mockLink;
  let createElementSpy;
  let appendChildSpy;
  let removeChildSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let clickSpy;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;

    clickSpy = vi.fn();
    mockLink = {
      href: '',
      download: '',
      style: {},
      click: clickSpy,
    };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  function setUserAgent(ua) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      configurable: true,
    });
  }

  describe('Windows (.bat) script', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    });

    it('generates a .bat filename', () => {
      generateCopyScript('D:\\Photos\\Wedding', [], 'Wedding 2024');
      expect(mockLink.download).toBe('Wedding_2024_selected.bat');
    });

    it('includes all selected filenames in the script content', async () => {
      const photos = [
        { filename: 'IMG_001.jpg' },
        { filename: 'IMG_002.jpg' },
      ];
      generateCopyScript('D:\\Photos', photos, 'Test');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('IMG_001.jpg');
      expect(content).toContain('IMG_002.jpg');
    });

    it('includes source folder path in the script', async () => {
      generateCopyScript('D:\\Photos\\Wedding', [], 'Wedding');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('D:\\Photos\\Wedding');
    });

    it('includes @echo off header', async () => {
      generateCopyScript('D:\\Photos', [], 'Test');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('@echo off');
    });

    it('sanitizes collection name for filename', () => {
      generateCopyScript('D:\\Photos', [], 'My Wedding: 2024!');
      expect(mockLink.download).toBe('My_Wedding__2024__selected.bat');
    });
  });

  describe('Mac/Linux (.command) script', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    });

    it('generates a .command filename', () => {
      generateCopyScript('/Users/photos/Wedding', [], 'Wedding 2024');
      expect(mockLink.download).toBe('Wedding_2024_selected.command');
    });

    it('includes all selected filenames in the script content', async () => {
      const photos = [
        { filename: 'IMG_001.jpg' },
        { filename: 'IMG_002.jpg' },
      ];
      generateCopyScript('/Users/photos', photos, 'Test');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('IMG_001.jpg');
      expect(content).toContain('IMG_002.jpg');
    });

    it('includes source folder path in the script', async () => {
      generateCopyScript('/Users/photos/Wedding', [], 'Wedding');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('/Users/photos/Wedding');
    });

    it('includes bash shebang header', async () => {
      generateCopyScript('/Users/photos', [], 'Test');

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      const content = await readBlob(blobArg);
      expect(content).toContain('#!/bin/bash');
    });
  });

  describe('download link mechanics', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('creates an anchor element', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('sets link href to the blob URL', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(mockLink.href).toBe('blob:fake-url');
    });

    it('sets display:none on the link', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(mockLink.style.display).toBe('none');
    });

    it('appends link to document body', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('clicks the link to trigger download', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('removes the link from document body after click', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('revokes the blob URL after download', () => {
      generateCopyScript('D:\\Photos', [], 'Test');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
    });
  });
});
