-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccesRight" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AccesRight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAccesRight" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "accesRightId" INTEGER NOT NULL,

    CONSTRAINT "RoleAccesRight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AccesRight_name_key" ON "AccesRight"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAccesRight_roleId_accesRightId_key" ON "RoleAccesRight"("roleId", "accesRightId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAccesRight" ADD CONSTRAINT "RoleAccesRight_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAccesRight" ADD CONSTRAINT "RoleAccesRight_accesRightId_fkey" FOREIGN KEY ("accesRightId") REFERENCES "AccesRight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
