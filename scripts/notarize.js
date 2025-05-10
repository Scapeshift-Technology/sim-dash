const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

// Read the package.json to get appId
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appId = packageJson.build.appId;

exports.default = async function notarizing(context) {
  // Only notarize macOS builds
  if (context.electronPlatformName !== 'darwin') {
    console.log('Skipping notarization - not macOS');
    return;
  }
  
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('Skipping notarization - environment variables missing');
    console.log('Make sure APPLE_ID, APPLE_ID_PASSWORD and APPLE_TEAM_ID are set');
    return;
  }

  // Get the appPath from the context  
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  console.log(`Notarizing ${appId} at ${appPath}`);

  try {
    // Call the notarize API
    await notarize({
      tool: 'notarytool',
      appPath,
      appBundleId: appId,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log(`Successfully notarized ${appId}`);
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
}; 