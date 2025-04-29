const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const welcomeMessage = document.getElementById('welcome-message');
const loginError = document.getElementById('login-error');

// Profile elements
const profileSelect = document.getElementById('profile-select');
const saveProfileButton = document.getElementById('save-profile-button');
const deleteProfileButton = document.getElementById('delete-profile-button');
const profileNameInput = document.getElementById('profile-name');
const profileStatus = document.getElementById('profile-status');

// Input fields
const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const databaseInput = document.getElementById('database');
const userInput = document.getElementById('user');
const passwordInput = document.getElementById('password');

let profiles = {}; // To store loaded profiles { name: profileData }

// --- UI Update Functions ---

function showLoginView() {
    loginView.style.display = 'block';
    mainView.style.display = 'none';
    welcomeMessage.textContent = 'Welcome!';
    loginError.textContent = '';
    profileStatus.textContent = '';
    loadProfiles(); // Reload profiles when showing login
}

function showMainView(username) {
    loginView.style.display = 'none';
    mainView.style.display = 'block';
    welcomeMessage.textContent = `Welcome, ${username}!`;
    loginError.textContent = ''; // Clear any previous errors
    profileStatus.textContent = '';
}

function setLoadingState(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? 'Connecting...' : 'Connect';
    saveProfileButton.disabled = isLoading;
    deleteProfileButton.disabled = isLoading;
    profileSelect.disabled = isLoading;
}

function setProfileStatus(message, isError = false) {
    profileStatus.textContent = message;
    profileStatus.className = isError ? 'error-message' : 'status-message';
}

// --- Profile Management ---

async function loadProfiles() {
    try {
        const loadedProfiles = await window.electronAPI.getProfiles();
        profiles = {}; // Clear existing
        profileSelect.innerHTML = '<option value="">-- New Connection --</option>'; // Reset dropdown

        loadedProfiles.forEach(p => {
            profiles[p.name] = p; // Store profile data by name
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = p.name;
            profileSelect.appendChild(option);
        });
        updateDeleteButtonState();
    } catch (error) {
        console.error('Failed to load profiles:', error);
        setProfileStatus('Error loading profiles.', true);
    }
}

function populateFormFromProfile(profileName) {
    if (profileName && profiles[profileName]) {
        const p = profiles[profileName];
        hostInput.value = p.host || '';
        portInput.value = p.port || '';
        databaseInput.value = p.database || '';
        userInput.value = p.user || '';
        passwordInput.value = p.password || ''; // Be cautious with pre-filling passwords
        profileNameInput.value = p.name; // Set save field to current profile name
        loginError.textContent = '';
        profileStatus.textContent = '';
    } else {
        // Clear form for 'New Connection'
        loginForm.reset();
        hostInput.value = 'localhost'; // Default values
        portInput.value = '1433';
        profileNameInput.value = '';
        loginError.textContent = '';
        profileStatus.textContent = '';
    }
    updateDeleteButtonState();
}

function updateDeleteButtonState() {
    deleteProfileButton.style.display = profileSelect.value ? 'inline-block' : 'none';
}

profileSelect.addEventListener('change', (e) => {
    populateFormFromProfile(e.target.value);
});

saveProfileButton.addEventListener('click', async () => {
    const profileName = profileNameInput.value.trim();
    if (!profileName) {
        setProfileStatus('Please enter a profile name.', true);
        return;
    }

    const profileData = {
        name: profileName,
        host: hostInput.value.trim(),
        port: parseInt(portInput.value.trim(), 10),
        database: databaseInput.value.trim(),
        user: userInput.value.trim(),
        password: passwordInput.value // Save password (insecurely!)
    };

    // Basic validation
    if (!profileData.host || !profileData.port || !profileData.database || !profileData.user) {
         setProfileStatus('Host, Port, Database, and User are required to save.', true);
        return;
    }

    setProfileStatus('Saving...');
    try {
        const success = await window.electronAPI.saveProfile(profileData);
        if (success) {
            setProfileStatus(`Profile '${profileName}' saved.`);
            await loadProfiles(); // Reload profiles
            profileSelect.value = profileName; // Select the newly saved/updated profile
            updateDeleteButtonState();
        } else {
            setProfileStatus('Failed to save profile.', true);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        setProfileStatus(`Error saving profile: ${error.message}`, true);
    }
});

deleteProfileButton.addEventListener('click', async () => {
    const profileNameToDelete = profileSelect.value;
    if (!profileNameToDelete) {
        setProfileStatus('No profile selected to delete.', true);
        return;
    }

    // Optional: Add a confirmation dialog here
    // if (!confirm(`Are you sure you want to delete profile '${profileNameToDelete}'?`)) {
    //     return;
    // }

    setProfileStatus('Deleting...');
    try {
        const success = await window.electronAPI.deleteProfile(profileNameToDelete);
        if (success) {
            setProfileStatus(`Profile '${profileNameToDelete}' deleted.`);
            profileNameInput.value = ''; // Clear name field if it matched deleted one
            await loadProfiles(); // Reload profiles
            populateFormFromProfile(''); // Reset form to default
        } else {
            setProfileStatus('Failed to delete profile.', true);
        }
    } catch (error) {
        console.error('Error deleting profile:', error);
        setProfileStatus(`Error deleting profile: ${error.message}`, true);
    }
});


// --- Connection Logic ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoadingState(true);
    loginError.textContent = ''; // Clear previous errors
    profileStatus.textContent = '';

    const config = {
        host: hostInput.value.trim(),
        port: portInput.value.trim(),
        database: databaseInput.value.trim(),
        user: userInput.value.trim(),
        password: passwordInput.value // Get password from input
    };

    try {
        const result = await window.electronAPI.login(config);
        if (result.success) {
            showMainView(result.username);
        } else {
            loginError.textContent = `Login failed: ${result.error}`;
        }
    } catch (error) {
        console.error('Login IPC error:', error);
        loginError.textContent = `An error occurred: ${error.message}`;
    } finally {
        setLoadingState(false);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        const result = await window.electronAPI.logout();
        if (result.success) {
            showLoginView();
        } else {
            // Handle logout failure - maybe show an error message
            // For simplicity, just show login view anyway
            console.error('Logout failed:', result.error);
            showLoginView();
        }
    } catch (error) {
        console.error('Logout IPC error:', error);
        showLoginView(); // Show login view even on error
    }
});

// --- Initial Load ---

document.addEventListener('DOMContentLoaded', () => {
    showLoginView(); // Start with the login view
    // loadProfiles is called within showLoginView
}); 