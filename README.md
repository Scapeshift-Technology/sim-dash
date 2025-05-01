# SimDash - Sports Simulation Dashboard PRD

## 1. Overview

SimDash is an Electron-based desktop application designed to provide users with a powerful interface for viewing and interacting with sports simulation data stored in a SQL Server database, with individualized simulation configuration (e.g. "leans") stored on the user's local desktop. The application will allow users to connect to the OLTP/OLAP database with their assigned credentials, browse different sports leagues, view game schedules, analyze matchup details (e.g.: market pricing data, batting orders for MLB), and potentially adjust simulation parameters ("Leans").

## 2. Goals

*   Provide a user-friendly desktop interface for accessing sports simulation data.
*   Integrate seamlessly with a user-provided SQL Server database.
*   Offer views for league selection, daily game schedules, and detailed matchup information.
*   Implement interactive features for analyzing and potentially adjusting simulation data.
*   Utilize a modern tech stack (React, Redux Toolkit, Material UI) for a robust and maintainable application.
*   Ensure data is presented clearly, including handling time zone conversions.

## 3. Core Features (Planned)

*   **Database Connection:** Secure login screen to connect to a specified SQL Server instance using provided credentials. Connection profiles will be saved locally (SQLite).
*   **League Selection:** A persistent sidebar (visible after login) displaying available sports leagues (initially MLB, NBA) fetched from the database (`dbo.League_V`).
*   **Tabbed Navigation:** Clicking a league in the sidebar opens a dedicated tab for that league (if not already open). Allows viewing multiple leagues/matchups concurrently.
*   **Daily Schedule View:**
    *   Each league tab will display a schedule of games for a selected date.
    *   A date picker within each tab allows users to select the date (defaults to today).
    *   Schedule data (`PostDtmUTC`, `Participant1`, `Participant2`, `DaySequence`) fetched from `dbo.Match_V` based on the selected league and date.
    *   Game times (`PostDtmUTC`) will be converted and displayed in the user's local time zone.
*   **MLB Matchup Details:**
    *   Clicking an MLB game in the schedule view will open a new tab dedicated to that specific matchup.
    *   This tab will display detailed information, including batting orders for both home and away teams (fetched from a relevant table/view, or perhaps API; TBD).
*   **Interactive "Lean" Cells:** Certain data points (e.g., team/player skill levels, TBD) will be presented in interactive cells allowing users to adjust values. These adjustments ("Leans") will be synced to an appropriately-named local sqlite database, stored in app.getPath('userData').
*   **Real-time Data Refresh:** Implement mechanisms for automatically or manually refreshing data (schedules, matchup details -- e.g. MLB Pitcher Changes from a feed) to reflect the latest information in the database.
*   **UI/UX:** Utilize Material UI (MUI) for a clean, modern, and responsive user interface. State management handled by Redux Toolkit.

## 4. Technology Stack

*   **Framework:** Electron
*   **Frontend:** React, TypeScript, HTML, CSS
*   **UI Library:** Material UI (MUI)
*   **State Management:** Redux Toolkit
*   **Database (Primary):** SQL Server (via `mssql` package)
*   **Database (Local Settings: e.g. Profiles, Leans):** SQLite (via `sqlite3` package)
*   **Build Tool:** Vite
*   **Date Handling:** dayjs

## 5. Development Plan & Progress

*   **Phase 1: Setup & Core UI Refactor**
    *   [x] Setup Vite build system.
    *   [x] Install React, Redux Toolkit, MUI, and related dependencies.
    *   [x] Refactor main window (`index.html`, `renderer.tsx`) to use React.
    *   [x] Implement basic Redux store and MUI theme provider.
    *   [x] Convert login view to a React/MUI component connected to Redux.
    *   [x] Create main application layout (conditionally rendered after login).
*   **Phase 2: League Sidebar & Tabs**
    *   [ ] Implement `fetch-leagues` IPC handler in `main.js`.
    *   [ ] Create Sidebar React component using MUI.
    *   [ ] Fetch and display leagues ('MLB', 'NBA') in the sidebar.
    *   [ ] Implement tab management using MUI Tabs and Redux state.
    *   [ ] Clicking a league opens/focuses the corresponding league tab.
*   **Phase 3: Schedule View**
    *   [ ] Install MUI Date Pickers and `dayjs`.
    *   [ ] Add Date Picker to the league tab content component.
    *   [ ] Implement `fetch-schedule` IPC handler in `main.js`.
    *   [ ] Fetch schedule data based on selected league and date.
    *   [ ] Display schedule data in the league tab (initial basic table).
    *   [ ] Implement UTC to local time conversion for display.
*   **Phase 4: MLB Matchup Details (Future)**
    *   [...] Define necessary SQL queries/tables.
    *   [...] Implement matchup-specific tabs.
    *   [...] Display batting orders.
*   **Phase 5: Interactive Leans (Future)**
    *   [...] Define interactive elements and database update logic.
*   **Phase 6: Real-time Refresh & Polish (Future)**
    *   [...] Implement data refresh mechanisms.
    *   [...] UI/UX improvements and error handling.

*(This document will be updated as development progresses) 