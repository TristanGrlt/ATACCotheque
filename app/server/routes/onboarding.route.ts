import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { changeFirstPassword, getOnboardingStatus, initTOTPSetup, initWebAuthnSetup, verifyAndEnableTOTP, verifyAndEnableWebAuthn } from "../controllers/onboarding.controller.js";

const router = Router();

router.get("/status", verifyToken, getOnboardingStatus);
router.post("/password-change", verifyToken, changeFirstPassword);

router.post("/totp/init", verifyToken, initTOTPSetup);
router.post("/totp/verify", verifyToken, verifyAndEnableTOTP);

router.post("/webauthn/init", verifyToken, initWebAuthnSetup);
router.post("/webauthn/verify", verifyToken, verifyAndEnableWebAuthn);

export default router;