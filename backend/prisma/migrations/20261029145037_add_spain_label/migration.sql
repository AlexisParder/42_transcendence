-- La table "ranks" est déjà remplie par le seed : la colonne est d'abord ajoutée
-- sans contrainte, remplie avec une valeur unique (le seed met ensuite le vrai
-- libellé espagnol), puis passée en NOT NULL.

-- AlterTable
ALTER TABLE "ranks" ADD COLUMN     "es_label" TEXT;

UPDATE "ranks" SET "es_label" = "en_label" WHERE "es_label" IS NULL;

ALTER TABLE "ranks" ALTER COLUMN "es_label" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ranks_fr_label_key" ON "ranks"("fr_label");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_es_label_key" ON "ranks"("es_label");
