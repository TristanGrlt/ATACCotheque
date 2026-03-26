/*
  Warnings:

  - The values [MANAGE_ROLES,REVIEW_ANNALES] on the enum `AppPermission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppPermission_new" AS ENUM ('MANAGE_USERS', 'MANAGE_PEDAGO');
ALTER TABLE "Role" ALTER COLUMN "permissions" TYPE "AppPermission_new"[] USING ("permissions"::text::"AppPermission_new"[]);
ALTER TYPE "AppPermission" RENAME TO "AppPermission_old";
ALTER TYPE "AppPermission_new" RENAME TO "AppPermission";
DROP TYPE "public"."AppPermission_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Annexe" DROP CONSTRAINT "Annexe_pastExamId_fkey";

-- DropIndex
DROP INDEX "Course_name_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "aliases" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Annexe" ADD CONSTRAINT "Annexe_pastExamId_fkey" FOREIGN KEY ("pastExamId") REFERENCES "PastExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
