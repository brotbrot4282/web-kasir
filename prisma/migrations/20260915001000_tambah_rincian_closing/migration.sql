ALTER TABLE "daily_report" ADD COLUMN "total_makanan_rupiah" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_report" ADD COLUMN "total_minuman_rupiah" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_report" ADD COLUMN "breakdown" JSONB;