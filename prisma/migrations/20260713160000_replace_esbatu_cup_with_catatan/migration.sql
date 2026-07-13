-- AlterTable: Drop es_batu and cup_terjual, add catatan
ALTER TABLE "daily_report" DROP COLUMN "es_batu",
DROP COLUMN "cup_terjual";

ALTER TABLE "daily_report" ADD COLUMN "catatan" TEXT;
