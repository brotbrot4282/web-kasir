-- CreateTable
CREATE TABLE "pengaturan_poin" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "rupiah_per_poin" INTEGER NOT NULL DEFAULT 15000,
    "poin_per_gratis_item" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_poin_pkey" PRIMARY KEY ("id")
);
