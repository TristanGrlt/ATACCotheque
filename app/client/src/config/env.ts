const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;

const meiliHost = import.meta.env.VITE_MEILI_HOST || 'http://localhost:7700';
const meiliApiKey = import.meta.env.VITE_MEILI_API_KEY || 'devMasterKey';

if (!apiEndpoint) {
  throw new Error("VITE_API_ENDPOINT environment variable is not defined.");
}

export const API_ENDPOINT = apiEndpoint;
export const MEILI_HOST = meiliHost;
export const MEILI_API_KEY = meiliApiKey;
