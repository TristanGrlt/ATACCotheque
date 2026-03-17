-- CreateTable
CREATE TABLE "PasskeyLoginChallenge" (
    "id" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasskeyLoginChallenge_pkey" PRIMARY KEY ("id")
);
