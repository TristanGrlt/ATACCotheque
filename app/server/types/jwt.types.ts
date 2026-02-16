import { JwtPayload } from "jsonwebtoken";

export interface ExtendedJwtPayload extends JwtPayload {
  userId: string;
  username: string;
  onboardingCompleted?: boolean;
  mfaVerified?: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    jwtPayload?: ExtendedJwtPayload;
  }
}