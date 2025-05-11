const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

// Read the package.json to get appId
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appId = packageJson.build.appId;

exports.default = async function notarizing(context) {
  console.log('[Notarize Script] Starting notarization process...');
  // Only notarize macOS builds
  if (context.electronPlatformName !== 'darwin') {
    console.log('[Notarize Script] Skipping notarization - not a macOS platform (' + context.electronPlatformName + ').');
    return;
  }
  
  console.log('[Notarize Script] Checking for required environment variables...');
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('[Notarize Script] Skipping notarization - one or more required environment variables are missing.');
    console.log(`  APPLE_ID set: ${!!process.env.APPLE_ID}`);
    console.log(`  APPLE_ID_PASSWORD set: ${!!process.env.APPLE_ID_PASSWORD}`);
    console.log(`  APPLE_TEAM_ID set: ${!!process.env.APPLE_TEAM_ID}`);
    return; // Or throw an error if you want the build to fail here
  }
  console.log('[Notarize Script] All required environment variables appear to be set.');

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  
  if (!fs.existsSync(appPath)) {
    console.error(`[Notarize Script] Cannot find application at path: ${appPath}`);
    throw new Error(`Notarization failed: app not found at ${appPath}`);
  }

  console.log(`[Notarize Script] Attempting to notarize app: ${appId}`);
  console.log(`  App Path: ${appPath}`);
  console.log(`  Using APPLE_ID: ${process.env.APPLE_ID}`);
  // Do not log the password itself, just its presence
  console.log(`  Using APPLE_ID_PASSWORD: ${process.env.APPLE_ID_PASSWORD ? 'Set' : 'NOT SET'}`);
  console.log(`  Using APPLE_TEAM_ID: ${process.env.APPLE_TEAM_ID}`);

  try {
    console.log('[Notarize Script] Calling @electron/notarize function. This may take several minutes...');
    await notarize({
      tool: 'notarytool',
      appPath,
      appBundleId: appId,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    console.log(`[Notarize Script] Successfully notarized ${appId}. Call to @electron/notarize completed.`);
  } catch (error) {
    console.error('[Notarize Script] Notarization FAILED during the @electron/notarize call.');
    console.error('[Notarize Script] Error details:', error);
    if (error.message) {
        console.error('[Notarize Script] Error message:', error.message);
    }
    if (error.stack) {
        console.error('[Notarize Script] Error stack:', error.stack);
    }
    // Some errors from notarytool might be in stderr or have specific properties
    if (error.stderr) {
        console.error('[Notarize Script] Error stderr:', error.stderr);
    }
    throw error; // Re-throw to ensure the build process fails
  }
  console.log('[Notarize Script] Notarization function finished.');
}; 