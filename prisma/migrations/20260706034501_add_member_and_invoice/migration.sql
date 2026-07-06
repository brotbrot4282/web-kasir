-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL,
    "noWa" TEXT NOT NULL,
    "nama" TEXT,
    "poin" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_poin" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "transaksi_id" UUID,
    "poin" INTEGER NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reward_poin_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "transaksi" ADD COLUMN "public_id" TEXT;
UPDATE "transaksi" SET "public_id" = gen_random_uuid()::text WHERE "public_id" IS NULL;
ALTER TABLE "transaksi" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "transaksi" ADD COLUMN "no_wa" TEXT;
ALTER TABLE "transaksi" ADD COLUMN "member_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "member_noWa_key" ON "member"("noWa");
CREATE UNIQUE INDEX "transaksi_public_id_key" ON "transaksi"("public_id");

-- AddForeignKey
ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
