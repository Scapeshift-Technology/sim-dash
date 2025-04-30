const { test, expect, _electron } = require('@playwright/test');

let electronApp;
let mainWindow;

// Test suite for the main application flow
test.describe('SQL Server Connection Flow', () => {

  // Launch the Electron app before running tests in this suite
  test.beforeAll(async () => {
    // Launch Electron app. Path might need adjustment based on build output later.
    // For development, Playwright can launch via the start command defined in package.json.
    // Assuming 'npm start' launches the app.
    electronApp = await _electron.launch({ args: ['.'] }); // Use args to point to the app's main directory

    // Wait for the main window to open
    mainWindow = await electronApp.firstWindow();
    await mainWindow.waitForLoadState('domcontentloaded');

    // Optional: Add a small delay or wait for a specific element if needed
    // await mainWindow.waitForSelector('#some-initial-element-id');
  });

  // Close the Electron app after all tests in this suite are done
  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  // The main test case
  test('should connect, display welcome message, disconnect, and return to initial state', async () => {
    // --- 1. Fill Credentials and Connect ---

    // Use actual IDs from src/index.html
    const hostInput = mainWindow.locator('#host');
    const portInput = mainWindow.locator('#port');
    const dbInput = mainWindow.locator('#database');
    const userInput = mainWindow.locator('#user');
    const passwordInput = mainWindow.locator('#password');
    const connectButton = mainWindow.locator('#login-button'); // Correct button ID

    // Read credentials strictly from environment variables
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;

    // Ensure environment variables are set - Fail fast if not
    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('Database test credentials environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) were not set.');
    }

    await hostInput.fill(dbHost);
    await portInput.fill(dbPort);
    await dbInput.fill(dbName);
    await userInput.fill(dbUser);
    await passwordInput.fill(dbPassword);

    await connectButton.click();

    // --- 2. Verify Welcome Message and Disconnect Button ---

    // Use actual IDs from src/index.html
    const welcomeMessage = mainWindow.locator('#welcome-message');
    const disconnectButton = mainWindow.locator('#logout-button');

    // Wait for the welcome message to appear and contain the username
    // Use a reasonable timeout. Default is 30 seconds.
    await expect(welcomeMessage).toBeVisible({ timeout: 45000 }); // Increased timeout for connection
    await expect(welcomeMessage).toContainText(`Welcome, ${dbUser}!`, {ignoreCase: true});

    // Verify the disconnect button is visible
    await expect(disconnectButton).toBeVisible();

    // --- 3. Disconnect ---
    await disconnectButton.click();

    // --- 4. Verify Return to Initial State ---

    // Target the H1 inside the login view or the login view itself
    const initialPageHeading = mainWindow.locator('#login-view h1'); // Target heading

    // Wait for the initial connection page heading to reappear
    await expect(initialPageHeading).toBeVisible();
    await expect(initialPageHeading).toContainText('Connect to SQL Server');
  });

});

// Helper function to potentially add IDs or test attributes if needed in the future
async function setTestId(selector, testId) {
  await mainWindow.evaluate(({ selector, testId }) => {
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute('data-testid', testId);
    }
  }, { selector, testId });
} 