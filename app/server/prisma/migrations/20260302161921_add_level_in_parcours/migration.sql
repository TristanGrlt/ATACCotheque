-- Simplified migration to add the Level↔Parcours join table without re-dropping
-- already-migrated columns or constraints.

-- CreateTable
CREATE TABLE "_LevelToParcours" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LevelToParcours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LevelToParcours_B_index" ON "_LevelToParcours"("B");

-- AddForeignKey
ALTER TABLE "_LevelToParcours" ADD CONSTRAINT "_LevelToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LevelToParcours" ADD CONSTRAINT "_LevelToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
