-- CreateTable
CREATE TABLE "ranks" (
    "id" TEXT NOT NULL,
    "en_label" TEXT NOT NULL,
    "fr_label" TEXT NOT NULL,
    "min" INTEGER NOT NULL,

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);
