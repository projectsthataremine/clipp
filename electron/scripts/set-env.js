/**
 * Set environment variable in .env file for builds
 * Usage: node scripts/set-env.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2];

if (!env || !['dev', 'prod'].includes(env)) {
  console.error('Usage: node scripts/set-env.js [dev|prod]');
  process.exit(1);
}

// Write to backend/.env (this is what gets bundled in the packaged app)
const backendEnvPath = path.join(__dirname, '../backend/.env');

try {
  // Read existing .env file to preserve Supabase credentials
  let envContent = '';
  if (fs.existsSync(backendEnvPath)) {
    envContent = fs.readFileSync(backendEnvPath, 'utf8');
  }

  // Remove any existing CLIPP_ENV line
  envContent = envContent.split('\n').filter(line => !line.startsWith('CLIPP_ENV=')).join('\n');

  // Add CLIPP_ENV at the top
  envContent = `CLIPP_ENV=${env}\n${envContent}`;

  // Write back to file
  fs.writeFileSync(backendEnvPath, envContent, 'utf8');
  console.log(`✅ Set CLIPP_ENV=${env} in backend/.env file`);
} catch (error) {
  console.error('❌ Failed to write backend/.env file:', error);
  process.exit(1);
}
