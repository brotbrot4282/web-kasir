-- AlterTable
ALTER TABLE "transaksi" ADD COLUMN     "poin_digunakan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_poin" INTEGER NOT NULL DEFAULT 0;
