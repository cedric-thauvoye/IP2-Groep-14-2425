import { PublicClientApplication } from '@azure/msal-browser';

// Read values directly from import.meta.env with fallbacks from hardcoded .env values
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '08c46765-3002-426c-bdef-284ecfee5a40';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '5e74901d-334f-46e3-96d1-47d842585abd';
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:5173';

// MSAL configuration with fallback options to handle common issues
const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: redirectUri,
    navigateToLoginRequestUrl: false, // Sometimes helps with redirect issues
  },
  cache: {
    cacheLocation: 'sessionStorage', // Try using sessionStorage instead of localStorage
    storeAuthStateInCookie: true, // Enable this for Internet Explorer/Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            break;
          case 1: // Warning
            console.warn(message);
            break;
          case 2: // Info
            console.info(message);
            break;
          case 3: // Verbose
            console.debug(message);
            break;
        }
      },
      logLevel: 2, // Set to 3 for more detailed logging during troubleshooting
    }
  }
};

// Create MSAL application object
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL - this is important to do before using any MSAL methods
let msalInitialized = false;
let initializePromise = null;

// Make sure MSAL is initialized
const ensureInitialized = async () => {
  if (!msalInitialized) {
    if (!initializePromise) {
      initializePromise = msalInstance.initialize();
    }
    await initializePromise;
    msalInitialized = true;
  }
};

// Login request with broader scopes
const loginRequest = {
  scopes: ["openid", "profile", "User.Read"]
};

// Simple redirect login
const loginWithRedirect = async () => {
  try {
    // Ensure MSAL is initialized before calling loginRedirect
    await ensureInitialized();
    await msalInstance.loginRedirect(loginRequest);
  } catch (error) {
    console.error("Error during login redirect:", error);
  }
};

// Handle redirect response
const handleRedirectPromise = async () => {
  try {
    // Ensure MSAL is initialized before calling handleRedirectPromise
    await ensureInitialized();
    const response = await msalInstance.handleRedirectPromise();
    return response?.accessToken || null;
  } catch (error) {
    console.error("Error handling redirect:", error);
    return null;
  }
};

// Get current account - simplified
const getAccount = async () => {
  // Ensure MSAL is initialized before calling getAllAccounts
  await ensureInitialized();
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

// Acquire token silently
const acquireToken = async () => {
  // Ensure MSAL is initialized
  await ensureInitialized();

  const account = await getAccount();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account: account
    });
    return response.accessToken;
  } catch (error) {
    console.error("Silent token acquisition failed:", error);
    return null;
  }
};

// Logout - modified to only clear local app tokens without Microsoft account logout
const logout = async () => {
  // Ensure MSAL is initialized before attempting any operations
  await ensureInitialized();

  try {
    // Clear session storage and local storage tokens for our app
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    // Don't call msalInstance.logoutRedirect() anymore
    // Just redirect to the login page with a logout parameter
    window.location.href = '/?logout=true';
    return Promise.resolve();
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback: still redirect to login page
    window.location.href = '/';
    return Promise.resolve();
  }
};

// Initialize MSAL immediately
ensureInitialized().catch(error => {
  console.error("Error initializing MSAL:", error);
});

export {
  msalInstance,
  loginWithRedirect,
  handleRedirectPromise,
  getAccount,
  acquireToken,
  logout
};
