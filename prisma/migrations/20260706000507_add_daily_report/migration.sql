-- CreateTable
CREATE TABLE "daily_report" (
    "id" UUID NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "shift" "Shift" NOT NULL,
    "user_id" UUID NOT NULL,
    "es_batu" INTEGER NOT NULL DEFAULT 0,
    "cup_terjual" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_tanggal_shift_key" ON "daily_report"("tanggal", "shift");

-- AddForeignKey
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
