/**
 * Machine info detection for macOS
 * Detects machine model name and macOS version
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Get machine name (e.g., "MacBook Pro 2024")
 * Falls back to "My Mac" if detection fails
 */
async function getMachineName() {
  try {
    // Get Mac model name
    const { stdout: model } = await execAsync(
      "system_profiler SPHardwareDataType | grep 'Model Name' | awk -F': ' '{print $2}'"
    );

    const modelName = model.trim();

    if (!modelName) {
      return 'My Mac';
    }

    // Try to get year from model identifier
    try {
      const { stdout: identifier } = await execAsync(
        "system_profiler SPHardwareDataType | grep 'Model Identifier' | awk -F': ' '{print $2}'"
      );

      // Extract number from identifier (e.g., "MacBookPro18,3" → 18)
      const match = identifier.match(/(\d+),/);
      if (match) {
        const modelNum = parseInt(match[1]);
        // Rough estimate: Higher numbers = newer models
        const estimatedYear = 2003 + modelNum;
        return `${modelName} (${estimatedYear})`;
      }
    } catch (yearError) {
      console.log('Could not detect year, using model name only');
    }

    return modelName;
  } catch (error) {
    console.error('Failed to get machine name:', error);
    return 'My Mac';
  }
}

/**
 * Get macOS version (e.g., "macOS 15.0 Sequoia")
 */
async function getMacOSVersion() {
  try {
    const { stdout: version } = await execAsync('sw_vers -productVersion');

    const versionNumber = version.trim();
    const majorVersion = versionNumber.split('.')[0];

    // Map major versions to names
    const versionNames = {
      '15': 'Sequoia',
      '14': 'Sonoma',
      '13': 'Ventura',
      '12': 'Monterey',
      '11': 'Big Sur',
      '10': 'Catalina or earlier',
    };

    const versionName = versionNames[majorVersion] || '';
    return `macOS ${versionNumber}${versionName ? ' ' + versionName : ''}`;
  } catch (error) {
    console.error('Failed to get macOS version:', error);
    return 'macOS';
  }
}

/**
 * Get both machine name and OS version
 */
async function getMachineInfo() {
  const [name, os] = await Promise.all([
    getMachineName(),
    getMacOSVersion()
  ]);

  return { name, os };
}

module.exports = {
  getMachineName,
  getMacOSVersion,
  getMachineInfo
};
