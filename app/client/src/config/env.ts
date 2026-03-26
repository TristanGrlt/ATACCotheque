const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
const isProd = import.meta.env.PROD;

const meiliHost = import.meta.env.VITE_MEILI_HOST || (!isProd ? 'http://localhost:7700' : undefined);
const meiliApiKey = import.meta.env.VITE_MEILI_API_KEY;

if (!apiEndpoint) {
  throw new Error("VITE_API_ENDPOINT environment variable is not defined.");
}

if (!meiliHost) {
  throw new Error("VITE_MEILI_HOST environment variable is not defined.");
}

if (!meiliApiKey) {
  throw new Error("VITE_MEILI_API_KEY environment variable is not defined. Use a search-only key.");
}

// Prevent accidental exposure of privileged keys in production bundles.
if (isProd && /(master|admin|devmasterkey)/i.test(meiliApiKey)) {
  throw new Error("VITE_MEILI_API_KEY appears to be a privileged key. Use a search-only key.");
}

export const API_ENDPOINT = apiEndpoint;
export const MEILI_HOST = meiliHost;
export const MEILI_API_KEY = meiliApiKey;
