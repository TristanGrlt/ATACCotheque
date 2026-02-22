// Options de cookie partagées pour toute l'app
import { CookieOptions } from 'express';

/** Cookie de session complet — valable 2h. */
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 2 * 60 * 60 * 1000, // 2h
};

/**
 * Cookie pre-auth — émis après validation des credentials, avant MFA.
 * TTL court (5 min), accès restreint au path MFA.
 */
export const preAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 5 * 60 * 1000, // 5 min
  path: '/user/mfa',
};
