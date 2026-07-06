-- AlterTable
ALTER TABLE "item_transaksi" ADD COLUMN     "variant" TEXT;

-- AlterTable
ALTER TABLE "menu" ADD COLUMN     "variants" JSONB DEFAULT '[]';
