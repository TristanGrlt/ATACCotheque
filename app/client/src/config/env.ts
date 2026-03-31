const isProd = import.meta.env.PROD;

const normalize = (value: string | undefined) => value?.trim();

const resolveMeiliHost = (value: string) => {
  if (!value.startsWith("/")) {
    return value;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${value}`;
  }

  return value;
};

const apiEndpoint =
  normalize(import.meta.env.VITE_API_ENDPOINT) || (isProd ? "/api" : undefined);
const meiliHostRaw =
  normalize(import.meta.env.VITE_MEILI_HOST) ||
  (isProd ? "/meili" : "http://localhost:7700");
const meiliHost = resolveMeiliHost(meiliHostRaw);
const meiliApiKey = normalize(import.meta.env.VITE_MEILI_API_KEY);

const isBrowserLocalhostLike = (value: string) => {
  if (value.startsWith("/")) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
  } catch {
    return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(
      value,
    );
  }
};

if (!apiEndpoint) {
  throw new Error("VITE_API_ENDPOINT environment variable is not defined.");
}

if (!meiliHost) {
  throw new Error("VITE_MEILI_HOST environment variable is not defined.");
}

if (!meiliApiKey) {
  throw new Error(
    "VITE_MEILI_API_KEY environment variable is not defined. Use a search-only key.",
  );
}

if (isProd && isBrowserLocalhostLike(apiEndpoint)) {
  throw new Error(
    "VITE_API_ENDPOINT must not target localhost in production. Use '/api' or your public API URL.",
  );
}

if (isProd && isBrowserLocalhostLike(meiliHost)) {
  throw new Error(
    "VITE_MEILI_HOST must not target localhost in production. Use '/meili' behind nginx.",
  );
}

if (isProd && /^http:\/\//i.test(meiliHost)) {
  throw new Error(
    "VITE_MEILI_HOST must use HTTPS in production (or '/meili' behind nginx).",
  );
}

// Prevent accidental exposure of privileged keys in production bundles.
if (isProd && /(master|admin|devmasterkey)/i.test(meiliApiKey)) {
  throw new Error(
    "VITE_MEILI_API_KEY appears to be a privileged key. Use a search-only key.",
  );
}

export const API_ENDPOINT = apiEndpoint;
export const MEILI_HOST = meiliHost;
export const MEILI_API_KEY = meiliApiKey;
