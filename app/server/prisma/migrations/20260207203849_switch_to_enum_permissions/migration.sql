/*
  Warnings:

  - You are about to drop the `AccesRight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleAccesRight` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AppPermission" AS ENUM ('MANAGE_USERS', 'MANAGE_ROLES', 'REVIEW_ANNALES');

-- DropForeignKey
ALTER TABLE "RoleAccesRight" DROP CONSTRAINT "RoleAccesRight_accesRightId_fkey";

-- DropForeignKey
ALTER TABLE "RoleAccesRight" DROP CONSTRAINT "RoleAccesRight_roleId_fkey";

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "permissions" "AppPermission"[];

-- DropTable
DROP TABLE "AccesRight";

-- DropTable
DROP TABLE "RoleAccesRight";
