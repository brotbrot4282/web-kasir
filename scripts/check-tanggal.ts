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
  const reports = await prisma.dailyReport.findMany({
    select: { id: true, tanggal: true, shift: true, openedAt: true },
    orderBy: { createdAt: "asc" },
  });

  for (const r of reports) {
    const wibDate = getWIBDate(r.openedAt);
    const newTgl = `${wibDate}T00:00:00+07:00`;
    console.log(
      `  ${r.id} [${r.shift}]: openedAt=${r.openedAt.toISOString()} WIB_date=${wibDate} new_tanggal=${newTgl}`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
