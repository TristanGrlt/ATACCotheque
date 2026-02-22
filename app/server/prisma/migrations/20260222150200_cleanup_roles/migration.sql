/*
  Warnings:

  - The values [MANAGE_ROLES,REVIEW_ANNALES] on the enum `AppPermission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppPermission_new" AS ENUM ('MANAGE_USERS');
ALTER TABLE "Role" ALTER COLUMN "permissions" TYPE "AppPermission_new"[] USING ("permissions"::text::"AppPermission_new"[]);
ALTER TYPE "AppPermission" RENAME TO "AppPermission_old";
ALTER TYPE "AppPermission_new" RENAME TO "AppPermission";
DROP TYPE "public"."AppPermission_old";
COMMIT;
