-- CreateTable
CREATE TABLE "pembayaran_split" (
    "id" UUID NOT NULL,
    "transaksi_id" UUID NOT NULL,
    "metode_bayar" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembayaran_split_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pembayaran_split_transaksi_id_idx" ON "pembayaran_split"("transaksi_id");

-- AddForeignKey
ALTER TABLE "pembayaran_split" ADD CONSTRAINT "pembayaran_split_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;