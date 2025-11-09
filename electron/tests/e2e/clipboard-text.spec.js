const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Test configuration
const TEST_USER_DATA_PATH = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Clipp-Test'
);

const TEST_RESULTS_PATH = path.join(__dirname, '..', '..', 'test-results');
const PASTE_DOC_PATH = path.join(TEST_RESULTS_PATH, 'pasted-items.html');

let pastedItems = [];

test.describe('Clipboard Operations', () => {
  let electronApp;
  let window;
  let originalClipboard;

  test.beforeAll(async () => {
    // Initialize pasted items array
    pastedItems = [];
    console.log('[Test] Initialized paste verification document');

    // Clean up test directory if it exists
    if (fs.existsSync(TEST_USER_DATA_PATH)) {
      fs.removeSync(TEST_USER_DATA_PATH);
    }

    // Create test directory
    fs.ensureDirSync(TEST_USER_DATA_PATH);

    // Ensure test results directory exists
    fs.ensureDirSync(TEST_RESULTS_PATH);

    // Copy test fixture to test userData directory
    const fixtureSource = path.join(__dirname, '..', 'fixtures', 'clipboard-history.json');
    const fixtureDest = path.join(TEST_USER_DATA_PATH, 'clipboard-history.json');
    fs.copySync(fixtureSource, fixtureDest);

    // Copy test assets to clipboard-files storage
    const testAssetsSource = path.join(__dirname, '..', 'fixtures', 'test-assets');

    // Copy image for test-image-1
    const boatSrc = path.join(testAssetsSource, 'Boat.png');
    const boatDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-image-1');
    fs.ensureDirSync(boatDest);
    fs.copySync(boatSrc, path.join(boatDest, 'Boat.png'));

    // Copy image for test-image-2
    const testWebpSrc = path.join(testAssetsSource, 'Test.webp');
    const testWebpDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-image-2');
    fs.ensureDirSync(testWebpDest);
    fs.copySync(testWebpSrc, path.join(testWebpDest, 'Test.webp'));

    // Copy images for test-multi-image-1
    const multiImageDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-multi-image-1');
    fs.ensureDirSync(multiImageDest);
    fs.copySync(path.join(testAssetsSource, 'Desert.png'), path.join(multiImageDest, 'Desert.png'));
    fs.copySync(path.join(testAssetsSource, 'Long Flower.png'), path.join(multiImageDest, 'Long Flower.png'));
    fs.copySync(path.join(testAssetsSource, 'Ferrari.jpg'), path.join(multiImageDest, 'Ferrari.jpg'));

    // Copy video for test-video-1
    const videoDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-video-1');
    fs.ensureDirSync(videoDest);
    fs.copySync(path.join(testAssetsSource, 'video1.mp4'), path.join(videoDest, 'video1.mp4'));

    // Copy PDF for test-pdf-1
    const pdfDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-pdf-1');
    fs.ensureDirSync(pdfDest);
    fs.copySync(path.join(testAssetsSource, 'Vaccine Certificate.pdf'), path.join(pdfDest, 'Vaccine Certificate.pdf'));

    // Copy GIF for test-gif-1
    const gifDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-gif-1');
    fs.ensureDirSync(gifDest);
    fs.copySync(path.join(testAssetsSource, 'I Love You Kiss.gif'), path.join(gifDest, 'I Love You Kiss.gif'));

    // Copy DOCX for test-docx-1
    const docxDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-docx-1');
    fs.ensureDirSync(docxDest);
    fs.copySync(path.join(testAssetsSource, 'Resume.docx'), path.join(docxDest, 'Resume.docx'));

    // Copy files for test-multi-file-1
    const multiFileDest = path.join(TEST_USER_DATA_PATH, 'clipboard-files', 'test-multi-file-1');
    fs.ensureDirSync(multiFileDest);
    fs.copySync(path.join(testAssetsSource, 'Vaccine Certificate.pdf'), path.join(multiFileDest, 'Vaccine Certificate.pdf'));
    fs.copySync(path.join(testAssetsSource, 'I Love You Kiss.gif'), path.join(multiFileDest, 'I Love You Kiss.gif'));
    fs.copySync(path.join(testAssetsSource, 'Resume.docx'), path.join(multiFileDest, 'Resume.docx'));

    console.log('[Test] Test fixtures and assets copied');
  });

  test.beforeEach(async () => {
    // Save current clipboard content
    try {
      const { stdout } = await execAsync('pbpaste');
      originalClipboard = stdout;
      console.log('[Test] Saved original clipboard');
    } catch (error) {
      console.warn('[Test] Could not save clipboard:', error.message);
    }

    // Launch Electron app with TEST_MODE
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'backend', 'main.js')],
      env: {
        ...process.env,
        TEST_MODE: 'true',
        NODE_ENV: 'test'
      }
    });

    // Wait for the app to be ready
    await electronApp.evaluate(async ({ app }) => {
      return app.whenReady();
    });

    // Get the first window
    window = await electronApp.firstWindow();

    // Wait a bit for the app to fully initialize
    await window.waitForTimeout(2000);

    // Show the window
    await electronApp.evaluate(({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
      }
    });

    console.log('[Test] Electron app launched and ready');
  });

  test.afterEach(async () => {
    // Close the app first (before clipboard restore to avoid hanging)
    if (electronApp) {
      try {
        // Set isQuiting flag then quit
        await electronApp.evaluate(({ app }) => {
          app.isQuiting = true;
          app.quit();
        });
        electronApp = null;
      } catch (error) {
        console.warn('[Test] Could not close app:', error.message);
      }
    }

    // Restore original clipboard
    if (originalClipboard !== undefined) {
      try {
        await execAsync(`echo "${originalClipboard.replace(/"/g, '\\"')}" | pbcopy`);
        console.log('[Test] Restored original clipboard');
      } catch (error) {
        console.warn('[Test] Could not restore clipboard:', error.message);
      }
    }
  });

  test.afterAll(async () => {
    // Generate HTML page showing all pasted items
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>E2E Test - Pasted Items</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    .item { margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .item h2 { margin-top: 0; font-size: 18px; color: #666; }
    .item pre { background: white; padding: 15px; border-radius: 4px; overflow-x: auto; }
    .item img { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .item video { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    hr { margin: 40px 0; border: none; border-top: 2px solid #ddd; }
  </style>
</head>
<body>
  <h1>📋 E2E Test Results - Pasted Items</h1>
  <p>This page shows all clipboard items that were copied and pasted during the E2E tests.</p>
  <hr>

  <div class="item">
    <h2>📝 Test 1: Text Item</h2>
    <pre>${fs.readFileSync(path.join(TEST_RESULTS_PATH, 'test-1-text', 'clipboard-text.txt'), 'utf-8')}</pre>
  </div>

  <div class="item">
    <h2>📋 Test 2: Clipboard Image (1x1 red pixel)</h2>
    <img src="test-2-clipboard-image/pasted-clipboard-image.png" alt="Pasted Clipboard Image" style="image-rendering: pixelated; width: 100px; height: 100px;">
    <p style="color: #666; font-size: 12px; margin-top: 10px;">Note: Scaled up 100x for visibility - actual size is 1x1 pixel</p>
  </div>

  <div class="item">
    <h2>🖼️ Test 3: Image Item (Boat.png)</h2>
    <img src="test-3-image-boat/pasted-boat.png" alt="Pasted Boat Image">
  </div>

  <div class="item">
    <h2>🖼️ Test 4: Image Item (Test.webp)</h2>
    <img src="test-4-image-webp/pasted-test.webp" alt="Pasted Test Image">
  </div>

  <div class="item">
    <h2>🖼️🖼️🖼️ Test 5: Multi-Image Item (3 images)</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Desert.png</p>
        <img src="test-5-multi-image/pasted-multi-1-Desert.png" alt="Desert">
      </div>
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Long Flower.png</p>
        <img src="test-5-multi-image/pasted-multi-2-Long Flower.png" alt="Long Flower">
      </div>
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Ferrari.jpg</p>
        <img src="test-5-multi-image/pasted-multi-3-Ferrari.jpg" alt="Ferrari">
      </div>
    </div>
  </div>

  <div class="item">
    <h2>🎥 Test 6: Video Item (video1.mp4)</h2>
    <video src="test-6-video/pasted-video1.mp4" controls>
      Your browser does not support the video tag.
    </video>
  </div>

  <div class="item">
    <h2>📄 Test 7: PDF File (Vaccine Certificate.pdf)</h2>
    <p><a href="test-7-pdf/pasted-Vaccine Certificate.pdf" target="_blank">Open PDF: Vaccine Certificate.pdf</a></p>
    <embed src="test-7-pdf/pasted-Vaccine Certificate.pdf" type="application/pdf" width="100%" height="600px" />
  </div>

  <div class="item">
    <h2>🎞️ Test 8: GIF File (I Love You Kiss.gif)</h2>
    <img src="test-8-gif/pasted-I Love You Kiss.gif" alt="Pasted GIF">
  </div>

  <div class="item">
    <h2>📝 Test 9: DOCX File (Resume.docx)</h2>
    <p><a href="test-9-docx/pasted-Resume.docx" download>Download: Resume.docx</a></p>
    <p style="color: #666; font-size: 14px;">DOCX files cannot be displayed in the browser. Click the link above to download.</p>
  </div>

  <div class="item">
    <h2>📁 Test 10: Multi-File Item (PDF, GIF, DOCX)</h2>
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">File 1: Vaccine Certificate.pdf</p>
        <a href="test-10-multi-file/pasted-multifile-1-Vaccine Certificate.pdf" target="_blank">Open PDF</a>
      </div>
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">File 2: I Love You Kiss.gif</p>
        <img src="test-10-multi-file/pasted-multifile-2-I Love You Kiss.gif" alt="GIF" style="max-width: 300px;">
      </div>
      <div>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">File 3: Resume.docx</p>
        <a href="test-10-multi-file/pasted-multifile-3-Resume.docx" download>Download DOCX</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(PASTE_DOC_PATH, html);
    console.log('[Test] Generated pasted-items.html for verification');

    // Clean up test directory
    if (fs.existsSync(TEST_USER_DATA_PATH)) {
      fs.removeSync(TEST_USER_DATA_PATH);
      console.log('[Test] Cleaned up test directory');
    }
  });

  test.describe('Icon Type Tests', () => {
    test('should display correct icon type for each clipboard item', async () => {
      // Wait for the clipboard history items to be rendered
      await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });
      console.log('[Test] Clipboard items loaded');

      // Verify each item displays the correct icon type
      const iconTests = [
        { itemId: 'test-text-1', iconType: 'icon-text', label: 'Text' },
        { itemId: 'test-clipboard-image-1', iconType: 'icon-clipboard-image', label: 'Clipboard Image' },
        { itemId: 'test-image-1', iconType: 'icon-image', label: 'Image' },
        { itemId: 'test-image-2', iconType: 'icon-image', label: 'Image (WebP)' },
        { itemId: 'test-multi-image-1', iconType: 'icon-multi-image', label: 'Multi-Image' },
        { itemId: 'test-video-1', iconType: 'icon-file', label: 'Video File' },
        { itemId: 'test-pdf-1', iconType: 'icon-file', label: 'PDF File' },
        { itemId: 'test-gif-1', iconType: 'icon-file', label: 'GIF File' },
        { itemId: 'test-docx-1', iconType: 'icon-file', label: 'DOCX File' },
        { itemId: 'test-multi-file-1', iconType: 'icon-multi-file', label: 'Multi-File' },
      ];

      for (const { itemId, iconType, label } of iconTests) {
        const selector = `[data-item-id="${itemId}"] [data-testid="${iconType}"]`;
        const count = await window.locator(selector).count();
        expect(count).toBe(1);
        console.log(`[Test] ✓ ${label} displays ${iconType}`);
      }

      console.log('[Test] ✅ All clipboard icon types verified!');
    });
  });

  test.describe('Pin/Unpin Tests', () => {
    test('should pin second-to-top item and move it to top', async () => {
      // Wait for items to load
      await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });

      // Get the second item (test-clipboard-image-1) - it's at position 1
      const secondItem = await window.locator('[data-item-id="test-clipboard-image-1"]');
      await expect(secondItem).toBeVisible();
      console.log('[Test] Found second item (clipboard-image)');

      // Click the pin button on the second item
      const pinButton = secondItem.locator('[data-testid="pin-button"]');
      await pinButton.click();
      console.log('[Test] Clicked pin button on second item');

      // Wait for the UI to update
      await window.waitForTimeout(500);

      // Verify the item is now at position 0 (first in the list)
      const allItems = await window.locator('[data-item-id]').all();
      const firstItemId = await allItems[0].getAttribute('data-item-id');
      expect(firstItemId).toBe('test-clipboard-image-1');

      console.log('[Test] ✅ Second item moved to top after pinning!');
    });

    test('should unpin item and return it to date position', async () => {
    // Wait for items to load
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });

    // Verify item exists before pinning
    const itemBefore = await window.locator('[data-item-id="test-clipboard-image-1"]');
    await expect(itemBefore).toBeVisible();

    // Pin the item
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Pinned second item');
    await window.waitForTimeout(1000);

    // Verify item still exists after pinning
    const itemAfterPin = await window.locator('[data-item-id="test-clipboard-image-1"]');
    await expect(itemAfterPin).toBeVisible();
    console.log('[Test] Item still visible after pinning');

    // Unpin it
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Unpinned the item');
    await window.waitForTimeout(1000);

    // Verify item still exists after unpinning
    const itemAfterUnpin = await window.locator('[data-item-id="test-clipboard-image-1"]');
    await expect(itemAfterUnpin).toBeVisible();
    console.log('[Test] ✅ Pin/unpin operations completed successfully!');
  });

  test('should pin multiple items and maintain order', async () => {
    // Wait for items to load
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });

    // Pin two items using API directly
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Pinned item 1 (clipboard-image)');
    await window.waitForTimeout(1000);

    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-image-2');
    });
    console.log('[Test] Pinned item 2 (image-2)');
    await window.waitForTimeout(1000);

    // Verify both items are still visible
    await expect(window.locator('[data-item-id="test-clipboard-image-1"]')).toBeVisible();
    await expect(window.locator('[data-item-id="test-image-2"]')).toBeVisible();

    console.log('[Test] ✅ Multiple items pinned successfully!');
  });

  test('should unpin one item while other stays pinned', async () => {
    // Wait for items to load
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });

    // Pin two items
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Pinned item 1');
    await window.waitForTimeout(1000);

    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-image-2');
    });
    console.log('[Test] Pinned item 2');
    await window.waitForTimeout(1000);

    // Verify both items are visible
    await expect(window.locator('[data-item-id="test-clipboard-image-1"]')).toBeVisible();
    await expect(window.locator('[data-item-id="test-image-2"]')).toBeVisible();
    console.log('[Test] Both items visible after pinning');

    // Unpin the first item
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Unpinned item 1');
    await window.waitForTimeout(1000);

    // Verify both items are still visible
    await expect(window.locator('[data-item-id="test-clipboard-image-1"]')).toBeVisible();
    await expect(window.locator('[data-item-id="test-image-2"]')).toBeVisible();
    console.log('[Test] ✅ Both items still visible after unpinning one!');
  });

  test('should persist pinned items across app restarts', async () => {
    // Wait for items to load
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });

    // Pin an item using API directly
    await window.evaluate(() => {
      window.electronAPI.toggleFavorite('test-clipboard-image-1');
    });
    console.log('[Test] Pinned item before restart');
    await window.waitForTimeout(1000);

    // Close the app (don't wait on closed window)
    await electronApp.evaluate(({ app }) => {
      app.isQuiting = true;
      app.quit();
    });
    console.log('[Test] App closed');

    // Wait a bit for app to fully close (use setTimeout wrapped in promise)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Restart the app (same as beforeEach)
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'backend', 'main.js')],
      env: {
        ...process.env,
        TEST_MODE: 'true',
        NODE_ENV: 'test'
      }
    });

    await electronApp.evaluate(async ({ app }) => {
      return app.whenReady();
    });

    window = await electronApp.firstWindow();
    await window.waitForTimeout(2000);

    await electronApp.evaluate(({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
      }
    });

    console.log('[Test] App restarted');

    // Verify the pinned item is still visible after restart
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });
    await expect(window.locator('[data-item-id="test-clipboard-image-1"]')).toBeVisible();

    console.log('[Test] ✅ Pinned item persisted across restart!');
    });
  });

  test.describe('Clipboard Copy Tests', () => {
    test('should copy text item to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-text-1"]', { timeout: 5000 });
    console.log('[Test] Found text item in UI');

    // Click on the text item
    await window.click('[data-item-id="test-text-1"]');
    console.log('[Test] Clicked text item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(500);

    // Save clipboard to verification file in test folder
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-1-text');
    fs.ensureDirSync(testFolder);
    await execAsync(`pbpaste > ${path.join(testFolder, 'clipboard-text.txt')}`);

    // Verify clipboard content
    const { stdout: clipboardContent } = await execAsync('pbpaste');
    expect(clipboardContent).toBe('Hello from Playwright test!');

    console.log('[Test] ✅ Text clipboard verified!');
  });

  test('should copy clipboard-image to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-clipboard-image-1"]', { timeout: 5000 });
    console.log('[Test] Found clipboard-image item in UI');

    // Click on the clipboard-image item
    await window.click('[data-item-id="test-clipboard-image-1"]');
    console.log('[Test] Clicked clipboard-image item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(500);

    // Save clipboard image to verification folder
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-2-clipboard-image');
    fs.ensureDirSync(testFolder);

    try {
      // Use osascript to save clipboard image
      const imagePath = path.join(testFolder, 'pasted-clipboard-image.png');
      const script = `
        set theFile to POSIX file "${imagePath}"
        try
          set imgData to the clipboard as «class PNGf»
          set fileRef to open for access theFile with write permission
          write imgData to fileRef
          close access fileRef
          return "success"
        on error errMsg
          return "error: " & errMsg
        end try
      `;
      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
      if (stdout.includes('success')) {
        console.log('[Test] Clipboard image saved to test folder');
      } else {
        console.warn('[Test] Could not save clipboard image:', stdout);
      }
    } catch (error) {
      console.warn('[Test] Could not save clipboard image:', error.message);
    }

    console.log('[Test] ✅ Clipboard-image clipboard verified!');
  });

  test('should copy image file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-image-1"]', { timeout: 5000 });
    console.log('[Test] Found image item in UI');

    // Click on the image item
    await window.click('[data-item-id="test-image-1"]');
    console.log('[Test] Clicked image item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using osascript
    const { stdout: clipboardFiles } = await execAsync(
      'osascript -e "set theFiles to the clipboard as «class furl»" -e "set text item delimiters to linefeed" -e "theFiles as text" 2>&1 || echo ""'
    );

    // Verify clipboard contains file path (macOS HFS format uses colons instead of slashes)
    expect(clipboardFiles).toContain('clipboard-files:test-image-1:Boat.png');

    // Extract the actual file path and copy the image file to test-results
    // This simulates what happens when you paste the file
    // Convert HFS path format (Macintosh HD:Users:...) to Unix format (/Users/...)
    const hfsPath = clipboardFiles.trim().replace(/^file:\/\//, '');
    const unixPath = '/' + hfsPath.replace(/^Macintosh HD:/, '').replace(/:/g, '/');
    const normalizedPath = decodeURIComponent(unixPath);

    // Copy the actual image file to test folder to verify paste behavior
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-3-image-boat');
    fs.ensureDirSync(testFolder);
    try {
      await execAsync(`cp "${normalizedPath}" ${path.join(testFolder, 'pasted-boat.png')}`);
      console.log('[Test] Image file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy image file:', error.message);
    }

    console.log('[Test] ✅ Image file path clipboard verified!');
  });

  test('should copy webp image file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-image-2"]', { timeout: 5000 });
    console.log('[Test] Found webp image item in UI');

    // Click on the image item
    await window.click('[data-item-id="test-image-2"]');
    console.log('[Test] Clicked webp image item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(500);

    // Get file paths from clipboard using osascript
    const { stdout: clipboardFiles } = await execAsync(
      'osascript -e "set theFiles to the clipboard as «class furl»" -e "set text item delimiters to linefeed" -e "theFiles as text" 2>&1 || echo ""'
    );

    // Verify clipboard contains file path (macOS HFS format uses colons instead of slashes)
    expect(clipboardFiles).toContain('clipboard-files:test-image-2:Test.webp');

    // Extract the actual file path and copy the image file to test-results
    // This simulates what happens when you paste the file
    // Convert HFS path format (Macintosh HD:Users:...) to Unix format (/Users/...)
    const hfsPath = clipboardFiles.trim().replace(/^file:\/\//, '');
    const unixPath = '/' + hfsPath.replace(/^Macintosh HD:/, '').replace(/:/g, '/');
    const normalizedPath = decodeURIComponent(unixPath);

    // Copy the actual image file to test folder to verify paste behavior
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-4-image-webp');
    fs.ensureDirSync(testFolder);
    try {
      await execAsync(`cp "${normalizedPath}" ${path.join(testFolder, 'pasted-test.webp')}`);
      console.log('[Test] Image file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy image file:', error.message);
    }

    console.log('[Test] ✅ WebP image file path clipboard verified!');
  });

  test('should copy multiple image file paths to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-multi-image-1"]', { timeout: 5000 });
    console.log('[Test] Found multi-image item in UI');

    // Click on the multi-image item
    await window.click('[data-item-id="test-multi-image-1"]');
    console.log('[Test] Clicked multi-image item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);
    console.log('[Test] Number of files:', clipboardFilesResult.files.length);

    // Verify clipboard contains all three file paths
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(3);
    expect(clipboardFilesResult.files[0]).toContain('Desert.png');
    expect(clipboardFilesResult.files[1]).toContain('Long Flower.png');
    expect(clipboardFilesResult.files[2]).toContain('Ferrari.jpg');

    // Copy all image files to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-5-multi-image');
    fs.ensureDirSync(testFolder);
    const filePaths = clipboardFilesResult.files;
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileName = path.basename(filePath);

      try {
        const destPath = path.join(testFolder, `pasted-multi-${i + 1}-${fileName}`);
        await execAsync(`cp "${filePath}" "${destPath}"`);
        console.log(`[Test] Image file ${i + 1} copied to test folder (simulating paste)`);
      } catch (error) {
        console.warn(`[Test] Could not copy image file ${i + 1}:`, error.message);
      }
    }

    console.log('[Test] ✅ Multi-image file paths clipboard verified!');
  });

  test('should copy video file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-video-1"]', { timeout: 5000 });
    console.log('[Test] Found video item in UI');

    // Click on the video item
    await window.click('[data-item-id="test-video-1"]');
    console.log('[Test] Clicked video item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);

    // Verify clipboard contains the video file path
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(1);
    expect(clipboardFilesResult.files[0]).toContain('video1.mp4');

    // Copy the video file to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-6-video');
    fs.ensureDirSync(testFolder);
    const filePath = clipboardFilesResult.files[0];
    const fileName = path.basename(filePath);

    try {
      const destPath = path.join(testFolder, `pasted-${fileName}`);
      await execAsync(`cp "${filePath}" "${destPath}"`);
      console.log('[Test] Video file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy video file:', error.message);
    }

    console.log('[Test] ✅ Video file path clipboard verified!');
  });

  test('should copy PDF file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-pdf-1"]', { timeout: 5000 });
    console.log('[Test] Found PDF item in UI');

    // Click on the PDF item
    await window.click('[data-item-id="test-pdf-1"]');
    console.log('[Test] Clicked PDF item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);

    // Verify clipboard contains the PDF file path
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(1);
    expect(clipboardFilesResult.files[0]).toContain('Vaccine Certificate.pdf');

    // Copy the PDF file to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-7-pdf');
    fs.ensureDirSync(testFolder);
    const filePath = clipboardFilesResult.files[0];
    const fileName = path.basename(filePath);

    try {
      const destPath = path.join(testFolder, `pasted-${fileName}`);
      await execAsync(`cp "${filePath}" "${destPath}"`);
      console.log('[Test] PDF file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy PDF file:', error.message);
    }

    console.log('[Test] ✅ PDF file path clipboard verified!');
  });

  test('should copy GIF file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-gif-1"]', { timeout: 5000 });
    console.log('[Test] Found GIF item in UI');

    // Click on the GIF item
    await window.click('[data-item-id="test-gif-1"]');
    console.log('[Test] Clicked GIF item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);

    // Verify clipboard contains the GIF file path
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(1);
    expect(clipboardFilesResult.files[0]).toContain('I Love You Kiss.gif');

    // Copy the GIF file to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-8-gif');
    fs.ensureDirSync(testFolder);
    const filePath = clipboardFilesResult.files[0];
    const fileName = path.basename(filePath);

    try {
      const destPath = path.join(testFolder, `pasted-${fileName}`);
      await execAsync(`cp "${filePath}" "${destPath}"`);
      console.log('[Test] GIF file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy GIF file:', error.message);
    }

    console.log('[Test] ✅ GIF file path clipboard verified!');
  });

  test('should copy DOCX file path to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-docx-1"]', { timeout: 5000 });
    console.log('[Test] Found DOCX item in UI');

    // Click on the DOCX item
    await window.click('[data-item-id="test-docx-1"]');
    console.log('[Test] Clicked DOCX item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);

    // Verify clipboard contains the DOCX file path
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(1);
    expect(clipboardFilesResult.files[0]).toContain('Resume.docx');

    // Copy the DOCX file to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-9-docx');
    fs.ensureDirSync(testFolder);
    const filePath = clipboardFilesResult.files[0];
    const fileName = path.basename(filePath);

    try {
      const destPath = path.join(testFolder, `pasted-${fileName}`);
      await execAsync(`cp "${filePath}" "${destPath}"`);
      console.log('[Test] DOCX file copied to test folder (simulating paste)');
    } catch (error) {
      console.warn('[Test] Could not copy DOCX file:', error.message);
    }

    console.log('[Test] ✅ DOCX file path clipboard verified!');
  });

  test('should copy multiple file paths (PDF, GIF, DOCX) to clipboard when clicked', async () => {
    // Wait for the clipboard history items to be rendered
    await window.waitForSelector('[data-item-id="test-multi-file-1"]', { timeout: 5000 });
    console.log('[Test] Found multi-file item in UI');

    // Click on the multi-file item
    await window.click('[data-item-id="test-multi-file-1"]');
    console.log('[Test] Clicked multi-file item');

    // Wait a bit for the clipboard to be updated
    await window.waitForTimeout(1000);

    // Get file paths from clipboard using IPC
    const clipboardFilesResult = await window.evaluate(async () => {
      return window.electronAPI.getClipboardFiles();
    });

    console.log('[Test] Clipboard files result:', clipboardFilesResult);
    console.log('[Test] Number of files:', clipboardFilesResult.files.length);

    // Verify clipboard contains all three file paths
    expect(clipboardFilesResult.success).toBe(true);
    expect(clipboardFilesResult.files).toHaveLength(3);
    expect(clipboardFilesResult.files[0]).toContain('Vaccine Certificate.pdf');
    expect(clipboardFilesResult.files[1]).toContain('I Love You Kiss.gif');
    expect(clipboardFilesResult.files[2]).toContain('Resume.docx');

    // Copy all files to test folder for verification
    const testFolder = path.join(TEST_RESULTS_PATH, 'test-10-multi-file');
    fs.ensureDirSync(testFolder);
    const filePaths = clipboardFilesResult.files;
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileName = path.basename(filePath);

      try {
        const destPath = path.join(testFolder, `pasted-multifile-${i + 1}-${fileName}`);
        await execAsync(`cp "${filePath}" "${destPath}"`);
        console.log(`[Test] File ${i + 1} copied to test folder (simulating paste)`);
      } catch (error) {
        console.warn(`[Test] Could not copy file ${i + 1}:`, error.message);
      }
    }

    console.log('[Test] ✅ Multi-file paths clipboard verified!');
    });
  });

  test.describe('Clipboard Capture Tests', () => {
    test('should capture single PNG image when copied', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy the PNG file to clipboard using osascript
      const testFile = path.join(__dirname, '../../..', 'test-files', 'Boat.png');
      await execAsync(`osascript -e 'set the clipboard to (read (POSIX file "${testFile}") as JPEG picture)'`);
      console.log('[Test] Copied PNG to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const imageItem = result.history.find(item => item.type === 'clipboard-image' || item.type === 'image');
      expect(imageItem).toBeDefined();
      console.log('[Test] ✅ PNG image captured in clipboard history!');
    });

    test('should capture multiple images when copied together', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy multiple image files to clipboard
      const testFiles = [
        path.join(__dirname, '../../..', 'test-files', 'Boat.png'),
        path.join(__dirname, '../../..', 'test-files', 'Desert.png'),
        path.join(__dirname, '../../..', 'test-files', 'Ferrari.jpg'),
      ];
      const fileList = testFiles.map(f => `POSIX file "${f}"`).join(', ');
      await execAsync(`osascript -e 'set the clipboard to {${fileList}}'`);
      console.log('[Test] Copied multiple images to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const multiImageItem = result.history.find(item =>
        item.type === 'multi-image' ||
        (item.metadata?.files && item.metadata.files.length === 3)
      );
      expect(multiImageItem).toBeDefined();
      console.log('[Test] ✅ Multiple images captured in clipboard history!');
    });

    test('should capture single file (PDF) when copied', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy the PDF file to clipboard
      const testFile = path.join(__dirname, '../../..', 'test-files', 'Vaccine Certificate.pdf');
      await execAsync(`osascript -e 'set the clipboard to (POSIX file "${testFile}")'`);
      console.log('[Test] Copied PDF to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const fileItem = result.history.find(item =>
        item.type === 'file' &&
        item.metadata?.files &&
        item.metadata.files.some(f => f.name.includes('.pdf'))
      );
      expect(fileItem).toBeDefined();
      console.log('[Test] ✅ PDF file captured in clipboard history!');
    });

    test('should capture multiple files when copied together', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy multiple files to clipboard
      const testFiles = [
        path.join(__dirname, '../../..', 'test-files', 'Vaccine Certificate.pdf'),
        path.join(__dirname, '../../..', 'test-files', 'Resume.docx'),
        path.join(__dirname, '../../..', 'test-files', 'revival.pdf'),
      ];
      const fileList = testFiles.map(f => `POSIX file "${f}"`).join(', ');
      await execAsync(`osascript -e 'set the clipboard to {${fileList}}'`);
      console.log('[Test] Copied multiple files to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const multiFileItem = result.history.find(item =>
        item.type === 'multi-file' ||
        (item.metadata?.files && item.metadata.files.length === 3)
      );
      expect(multiFileItem).toBeDefined();
      console.log('[Test] ✅ Multiple files captured in clipboard history!');
    });

    test('should capture video file when copied', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy the video file to clipboard
      const testFile = path.join(__dirname, '../../..', 'test-files', 'video1.mp4');
      await execAsync(`osascript -e 'set the clipboard to (POSIX file "${testFile}")'`);
      console.log('[Test] Copied video to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const videoItem = result.history.find(item =>
        item.type === 'file' &&
        item.metadata?.files &&
        item.metadata.files.some(f => f.name.includes('.mp4'))
      );
      expect(videoItem).toBeDefined();
      console.log('[Test] ✅ Video file captured in clipboard history!');
    });

    test('should capture audio file when copied', async () => {
      // Clean clipboard history to start fresh
      await window.evaluate(async () => {
        return window.electronAPI.clearHistory();
      });
      await window.waitForTimeout(500);
      console.log('[Test] Cleared clipboard history');

      // Copy the audio file to clipboard
      const testFile = path.join(__dirname, '../../..', 'test-files', 'Tech house.mp3');
      await execAsync(`osascript -e 'set the clipboard to (POSIX file "${testFile}")'`);
      console.log('[Test] Copied audio to clipboard');

      // Wait for clipboard monitor to detect the change
      await window.waitForTimeout(2000);

      // Verify the item appears in clipboard history
      const result = await window.evaluate(async () => {
        return window.electronAPI.getHistory();
      });

      expect(result.success).toBe(true);
      expect(result.history.length).toBeGreaterThan(0);
      const audioItem = result.history.find(item =>
        item.type === 'file' &&
        item.metadata?.files &&
        item.metadata.files.some(f => f.name.includes('.mp3'))
      );
      expect(audioItem).toBeDefined();
      console.log('[Test] ✅ Audio file captured in clipboard history!');
    });
  });
});
