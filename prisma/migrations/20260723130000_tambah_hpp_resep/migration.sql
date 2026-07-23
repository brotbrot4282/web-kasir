-- AlterTable: Tambah kolom harga_bahan ke tabel stok
ALTER TABLE "stok" ADD COLUMN "harga_bahan" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable: Resep (junction Menu <-> Stok)
CREATE TABLE "resep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menu_id" UUID NOT NULL,
    "stok_id" UUID NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "resep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint (menu_id, stok_id)
CREATE UNIQUE INDEX "resep_menu_id_stok_id_key" ON "resep"("menu_id", "stok_id");

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_stok_id_fkey" FOREIGN KEY ("stok_id") REFERENCES "stok"("id") ON DELETE CASCADE ON UPDATE CASCADE;
