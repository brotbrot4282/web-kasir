import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: resolve(__dirname, "../.env"), override: true });

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function getWIBDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function main() {
  console.log("Step 1: Dropping unique index...");
  await prisma.$executeRawUnsafe(
    `DROP INDEX IF EXISTS "daily_report_tanggal_shift_key"`
  );

  console.log("Step 2: Updating records...");
  const reports = await prisma.dailyReport.findMany({
    select: { id: true, shift: true, openedAt: true },
  });

  for (const r of reports) {
    const wibDate = getWIBDate(r.openedAt);
    const newTanggal = `${wibDate}T00:00:00.000+07:00`;

    console.log(`  ${r.id} [${r.shift}]: openedAt=${r.openedAt.toISOString()} → WIB=${wibDate}`);

    await prisma.$executeRawUnsafe(
      `UPDATE "daily_report" SET tanggal = $1::timestamptz WHERE id = $2::uuid`,
      newTanggal,
      r.id
    );
  }

  console.log("Step 3: Re-creating unique index...");
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "daily_report_tanggal_shift_key" ON "daily_report" ("tanggal", "shift")`
  );

  console.log("Step 4: Verifying...");
  const verify = await prisma.dailyReport.findMany({
    select: { id: true, tanggal: true, shift: true },
    orderBy: { createdAt: "desc" },
  });

  for (const r of verify) {
    const wibDate = getWIBDate(r.tanggal);
    console.log(`  ${r.id} [${r.shift}]: tanggal=${r.tanggal.toISOString()} WIB=${wibDate}`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => { console.error("Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
