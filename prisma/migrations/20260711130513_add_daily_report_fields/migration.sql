-- AlterTable
ALTER TABLE "daily_report" ADD COLUMN     "total_makanan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_minuman" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_omset" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_transaksi" INTEGER NOT NULL DEFAULT 0;
