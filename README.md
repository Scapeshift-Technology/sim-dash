# Electron SQL Server Connection Template

This is a basic Electron application template demonstrating how to:

*   Connect to a Microsoft SQL Server database.
*   Save and load connection profiles (host, port, db, user, password) using a local SQLite database.
*   Switch between saved profiles.
*   Display the SQL Server username upon successful connection.

**Warning:** Passwords are stored in plain text in the local SQLite database (`profiles.sqlite` in the user data directory). This is insecure and intended for demonstration purposes only. In a real application, use the OS keyring (e.g., `keytar` package) or other secure storage mechanisms.

## Setup

1.  **Clone the repository (or create the files as shown).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *Note:* `npm install` might take some time as it needs to download Electron and potentially rebuild native modules like `sqlite3` and `mssql` for your specific OS and architecture.

## Running the App

```bash
npm start
```

## How it Works

*   **`package.json`**: Defines dependencies (`electron`, `mssql`, `sqlite3`) and the start script.
*   **`src/main.js`**: The main Electron process. It creates the browser window, handles IPC communication for login/logout and profile management, connects to the SQL Server using `mssql`, and manages the `sqlite3` database for profiles.
*   **`src/preload.js`**: Securely exposes necessary functions from `main.js` to the renderer process (`renderer.js`) using `contextBridge`.
*   **`src/db.js`**: A helper module for interacting with the `sqlite3` database (creating the table, saving, loading, deleting profiles).
*   **`src/index.html`**: The main UI file containing the login form, profile management controls, and the welcome screen.
*   **`src/renderer.js`**: The script running in the browser window. It handles user input, calls the exposed API functions (via `window.electronAPI`) to interact with the main process, and updates the UI.
*   **`src/styles.css`**: Basic styling for the application.

## Profile Storage

Connection profiles are stored in a SQLite database file named `profiles.sqlite` located in the Electron application's user data directory. You can find this directory using `app.getPath('userData')`.

## SQL Server Configuration Notes

*   The connection logic in `src/main.js` uses `encrypt: true` and `trustServerCertificate: true`. Adjust these settings based on your SQL Server's configuration and security requirements.
*   `trustServerCertificate: true` is generally only suitable for local development or when connecting to servers with self-signed certificates. For production environments, you should typically set this to `false` and ensure proper certificate validation.
*   Ensure the SQL Server instance is configured to allow TCP/IP connections and that the specified port (default 1433) is open in any firewalls.
*   The query `SELECT SUSER_SNAME() AS username` is used to retrieve the login name in SQL Server. `USER_NAME()` retrieves the database user name, which might be different. 