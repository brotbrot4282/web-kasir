-- CreateTable
CREATE TABLE "kategori" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "kategori_id" UUID NOT NULL,
    "gambar" TEXT,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "is_tersedia" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" UUID NOT NULL,
    "no_transaksi" TEXT NOT NULL,
    "total_harga" INTEGER NOT NULL,
    "total_bayar" INTEGER NOT NULL,
    "kembalian" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_transaksi" (
    "id" UUID NOT NULL,
    "transaksi_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "nama_menu" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok" (
    "id" UUID NOT NULL,
    "nama_bahan" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "satuan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kategori_nama_key" ON "kategori"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_no_transaksi_key" ON "transaksi"("no_transaksi");

-- AddForeignKey
ALTER TABLE "menu" ADD CONSTRAINT "menu_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_transaksi" ADD CONSTRAINT "item_transaksi_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_transaksi" ADD CONSTRAINT "item_transaksi_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
