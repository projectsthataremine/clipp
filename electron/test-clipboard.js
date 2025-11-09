#!/usr/bin/env node

// Test script to diagnose clipboard file reading on macOS
const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

const execFileAsync = util.promisify(execFile);

console.log('='.repeat(60));
console.log('CLIPBOARD FILE DETECTION TEST');
console.log('='.repeat(60));
console.log('');

async function testNativeHelper() {
  console.log('Test 1: Native Objective-C Helper (uses NSPasteboard)');
  console.log('-'.repeat(60));

  const helperPath = path.join(__dirname, 'backend/native/clipboard_helper');

  if (!fs.existsSync(helperPath)) {
    console.log('❌ Helper not found at:', helperPath);
    return null;
  }

  try {
    const { stdout, stderr } = await execFileAsync(helperPath, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 5000
    });

    if (stderr) {
      console.log('⚠️  stderr:', stderr);
    }

    const result = stdout.toString('utf8').trim();
    console.log('Raw output:', result);

    try {
      const paths = JSON.parse(result);
      if (paths.length > 0) {
        console.log('✅ SUCCESS! Found', paths.length, 'file(s):');
        paths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
        return paths;
      } else {
        console.log('❌ No files found (empty array)');
        return [];
      }
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error running helper:', error.message);
    return null;
  }
}

async function testElectronClipboard() {
  console.log('\nTest 2: Electron Clipboard API');
  console.log('-'.repeat(60));

  try {
    const { clipboard } = require('electron');

    const formats = clipboard.availableFormats();
    console.log('Available formats:', formats);

    // Test 1: public.file-url
    console.log('\nTest 2a: clipboard.read("public.file-url")');
    try {
      const fileUrl = clipboard.read('public.file-url');
      if (fileUrl && fileUrl.length > 0) {
        console.log('✅ Found file URL:', fileUrl);
        const decoded = decodeURIComponent(fileUrl.replace('file://', ''));
        console.log('   Decoded path:', decoded);
        return [decoded];
      } else {
        console.log('❌ No file URL found');
      }
    } catch (e) {
      console.log('❌ Error:', e.message);
    }

    // Test 2: NSFilenamesPboardType
    console.log('\nTest 2b: clipboard.readBuffer("NSFilenamesPboardType")');
    try {
      const buffer = clipboard.readBuffer('NSFilenamesPboardType');
      console.log('Buffer length:', buffer ? buffer.length : 0, 'bytes');
      if (buffer && buffer.length > 0) {
        console.log('✅ Has data in NSFilenamesPboardType');
      } else {
        console.log('❌ Empty buffer');
      }
    } catch (e) {
      console.log('❌ Error:', e.message);
    }

    return null;
  } catch (error) {
    console.log('❌ Cannot load Electron (expected if run standalone)');
    console.log('   Run this inside Electron app for full test');
    return null;
  }
}

async function testElectronClipboardEx() {
  console.log('\nTest 3: electron-clipboard-ex');
  console.log('-'.repeat(60));

  try {
    const clipboardEx = require('electron-clipboard-ex');
    const filePaths = clipboardEx.readFilePaths();

    console.log('Result:', filePaths);

    if (filePaths && filePaths.length > 0) {
      console.log('✅ SUCCESS! Found', filePaths.length, 'file(s):');
      filePaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      return filePaths;
    } else {
      console.log('❌ No files found');
      return [];
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testAppleScript() {
  console.log('\nTest 4: AppleScript (alternative method)');
  console.log('-'.repeat(60));

  const script = `
    tell application "System Events"
      try
        set theClipboard to the clipboard
        return theClipboard as text
      on error
        return ""
      end try
    end tell
  `;

  try {
    const { stdout } = await execFileAsync('osascript', ['-e', script]);
    const result = stdout.toString('utf8').trim();
    console.log('Clipboard text content:', result.substring(0, 100));

    if (result.startsWith('/')) {
      console.log('⚠️  Might be file path:', result);
    } else {
      console.log('❌ Not a file path');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function main() {
  console.log('📋 Copy a file (Cmd+C) in Finder, then press Enter to test...');

  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n🔍 Testing clipboard file detection methods...\n');

  const result1 = await testNativeHelper();
  const result2 = await testElectronClipboard();
  const result3 = await testElectronClipboardEx();
  await testAppleScript();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  if (result1 && result1.length > 0) {
    console.log('✅ Native helper: WORKS');
  } else {
    console.log('❌ Native helper: FAILED');
  }

  if (result2 && result2.length > 0) {
    console.log('✅ Electron clipboard: WORKS');
  } else {
    console.log('❌ Electron clipboard: FAILED');
  }

  if (result3 && result3.length > 0) {
    console.log('✅ electron-clipboard-ex: WORKS');
  } else {
    console.log('❌ electron-clipboard-ex: FAILED');
  }

  console.log('');
  process.exit(0);
}

// Check if run standalone or in Electron
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testNativeHelper, testElectronClipboard, testElectronClipboardEx };
