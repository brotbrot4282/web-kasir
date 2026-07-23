-- AlterTable: Hapus poin_per_gratis_item, tambah nilai_per_poin
ALTER TABLE "pengaturan_poin" DROP COLUMN "poin_per_gratis_item";
ALTER TABLE "pengaturan_poin" ADD COLUMN "nilai_per_poin" INTEGER NOT NULL DEFAULT 1000;
