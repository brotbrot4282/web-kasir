-- CreateEnum
CREATE TYPE "StatusDapur" AS ENUM ('MENUNGGU', 'DIMASAK', 'SIAP');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DAPUR';

-- AlterTable
ALTER TABLE "item_transaksi" ADD COLUMN     "status_dapur" "StatusDapur" NOT NULL DEFAULT 'MENUNGGU';
