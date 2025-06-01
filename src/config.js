/**
 * Application Configuration
 * This file centralizes all configuration for the Vue.js application.
 * Environment-specific values can be set here directly instead of using .env files.
 */

const config = {
  // API Configuration
  api: {
    url: 'http://localhost:3000', // Base API URL (without trailing slash)
  },

  // Azure AD Configuration
  azure: {
    clientId: '08c46765-3002-426c-bdef-284ecfee5a40',
    tenantId: '5e74901d-334f-46e3-96d1-47d842585abd',
    redirectUri: 'http://localhost:5173',
  }
};

// Add a helper to allow using config values like environment variables
// This makes it easier to migrate from env variables
const getConfig = (path) => {
  const parts = path.split('.');
  let result = config;

  for (const part of parts) {
    if (result && result[part] !== undefined) {
      result = result[part];
    } else {
      return undefined;
    }
  }

  return result;
};

export { config, getConfig };
export default config;
