import { PublicClientApplication, BrowserAuthError } from '@azure/msal-browser';

// IMMEDIATELY check for crypto availability before any other code runs
(function ensureCryptoAvailableImmediately() {
  if (typeof window === 'undefined') return; // Skip if not in browser environment

  // Check if window.crypto is available
  if (!window.crypto) {
    console.warn('window.crypto is not available. Using a fallback implementation.');
    // Create a basic crypto polyfill
    window.crypto = {
      subtle: {},
      getRandomValues: function(array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }
    };
  }
  // Check for subtle crypto
  else if (!window.crypto.subtle && window.crypto.webkitSubtle) {
    console.warn('Using webkitSubtle as crypto.subtle');
    window.crypto.subtle = window.crypto.webkitSubtle;
  }
})();

// Read values from import.meta.env with fallbacks
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI;

// A safer function to create the MSAL instance that won't throw exceptions
const createMsalInstance = () => {
  try {
    // Safer MSAL configuration
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: redirectUri,
        navigateToLoginRequestUrl: false,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: true,
      },
      system: {
        allowNativeBroker: false, // Disable native broker which might cause crypto errors
        loggerOptions: {
          logLevel: 2, // Warning level
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            if (level <= 2) console.warn(message);
          }
        }
      }
    };

    // Create the MSAL instance with the config
    const instance = new PublicClientApplication(msalConfig);
    console.log("MSAL instance created successfully");
    return instance;
  } catch (error) {
    console.error("Failed to create MSAL instance:", error);

    // Return a dummy MSAL instance with the necessary methods
    return {
      initialize: () => Promise.resolve(),
      handleRedirectPromise: () => Promise.resolve(null),
      getAllAccounts: () => [],
      loginRedirect: () => {
        console.log("Using fallback loginRedirect");
        // Use a simple redirect as fallback
        window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20User.Read`;
        return Promise.resolve();
      },
      acquireTokenSilent: () => Promise.reject(new Error('MSAL is not available')),
      acquireTokenRedirect: () => Promise.resolve(),
    };
  }
};

// Create MSAL instance with the safer method
const msalInstance = createMsalInstance();

// Initialize MSAL - this is important to do before using any MSAL methods
let msalInitialized = false;
let initializePromise = null;

// Make sure MSAL is initialized
const ensureInitialized = async () => {
  if (!msalInitialized) {
    if (!initializePromise) {
      try {
        initializePromise = msalInstance.initialize ? msalInstance.initialize() : Promise.resolve();
      } catch (error) {
        console.error("Error initializing MSAL:", error);
        initializePromise = Promise.resolve(); // Provide a resolved promise as fallback
      }
    }

    try {
      await initializePromise;
      msalInitialized = true;
    } catch (error) {
      console.error("Failed to initialize MSAL:", error);
    }
  }
};

// Login request with broader scopes
const loginRequest = {
  scopes: ["openid", "profile", "User.Read"]
};

// Simple redirect login with error handling
const loginWithRedirect = async () => {
  try {
    // Ensure MSAL is initialized before calling loginRedirect
    await ensureInitialized();

    if (msalInstance.loginRedirect) {
      await msalInstance.loginRedirect(loginRequest);
    } else {
      // Fallback if loginRedirect is not available
      console.warn("Using fallback login method");
      window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20User.Read`;
    }
  } catch (error) {
    console.error("Error during login redirect:", error);
    // Show a user-friendly message and provide an alternative
    alert("There was a problem with Microsoft login. Please try again or contact support.");
  }
};

// Handle redirect response with error handling
const handleRedirectPromise = async () => {
  try {
    // Ensure MSAL is initialized before calling handleRedirectPromise
    await ensureInitialized();
    const response = msalInstance.handleRedirectPromise ?
      await msalInstance.handleRedirectPromise() : null;
    return response?.accessToken || null;
  } catch (error) {
    console.error("Error handling redirect:", error);
    return null;
  }
};

// Get current account - simplified
const getAccount = async () => {
  try {
    // Ensure MSAL is initialized before calling getAllAccounts
    await ensureInitialized();
    const accounts = msalInstance.getAllAccounts ?
      msalInstance.getAllAccounts() : [];
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting account:", error);
    return null;
  }
};

// Acquire token silently with better error handling
const acquireToken = async () => {
  try {
    // Ensure MSAL is initialized
    await ensureInitialized();

    const account = await getAccount();
    if (!account) return null;

    try {
      if (!msalInstance.acquireTokenSilent) {
        throw new Error('acquireTokenSilent not available');
      }

      const response = await msalInstance.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account: account
      });
      return response.accessToken;
    } catch (error) {
      console.warn("Silent token acquisition failed:", error);

      // Try interactive acquisition as fallback
      if (error instanceof BrowserAuthError ||
          error.message.includes('interaction_required') ||
          error.message.includes('crypto')) {

        try {
          if (msalInstance.acquireTokenRedirect) {
            console.log("Falling back to interactive token acquisition");
            await msalInstance.acquireTokenRedirect({
              scopes: loginRequest.scopes,
              account: account
            });
          } else {
            // Final fallback - just redirect to login
            loginWithRedirect();
          }
        } catch (redirectError) {
          console.error("Error during token redirect:", redirectError);
        }
      }

      return null;
    }
  } catch (error) {
    console.error("Error in acquireToken:", error);
    return null;
  }
};

// Logout - clear local storage and session storage
const logout = async () => {
  try {
    // Just clear storage without MSAL logout which might cause errors
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    try {
      // Clear browser session storage (MSAL data)
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear session storage:", e);
    }

    // Redirect to login
    window.location.href = '/?logout=true';
    return Promise.resolve();
  } catch (error) {
    console.error("Error during logout:", error);
    window.location.href = '/';
    return Promise.resolve();
  }
};

// Initiate the initialization immediately, but don't wait for it
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
