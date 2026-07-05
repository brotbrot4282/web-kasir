-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'KASIR');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('SHIFT_1', 'SHIFT_2');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'OWNER',
ADD COLUMN     "shift" "Shift";
