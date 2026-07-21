import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: resolve(__dirname, "../.env"), override: true });

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const reports = await prisma.dailyReport.findMany({
    select: { id: true, tanggal: true, shift: true },
  });

  console.log(`Found ${reports.length} daily reports to fix`);

  for (const r of reports) {
    const oldTanggal = r.tanggal;
    const newTanggal = new Date(oldTanggal.getTime() - 14 * 60 * 60 * 1000);

    console.log(
      `  ${r.id} [${r.shift}]: ${oldTanggal.toISOString()} → ${newTanggal.toISOString()}`
    );

    await prisma.dailyReport.update({
      where: { id: r.id },
      data: { tanggal: newTanggal },
    });
  }

  console.log("Fix migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
