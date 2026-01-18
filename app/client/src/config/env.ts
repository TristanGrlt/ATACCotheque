const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;

if (!apiEndpoint) {
  throw new Error("VITE_API_ENDPOINT environment variable is not defined.");
}

export const API_ENDPOINT = apiEndpoint;
