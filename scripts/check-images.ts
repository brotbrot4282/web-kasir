import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function main() {
  const menus = await prisma.menu.findMany({ where: { gambar: { not: null } } });
  console.log("Menu dengan gambar:", menus.length);

  for (const m of menus) {
    const url = m.gambar!;
    if (url.startsWith("/")) {
      console.log("LOCAL PATH:", m.nama, "->", url);
      await prisma.menu.update({ where: { id: m.id }, data: { gambar: null } });
      console.log("  -> direset null");
      continue;
    }
    if (url.includes("supabase.co")) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.log("BROKEN:", m.nama, "(status", res.status + ")");
          const filename = url.split("/").pop();
          if (filename) await supabase.storage.from("menu-images").remove([filename]);
          await prisma.menu.update({ where: { id: m.id }, data: { gambar: null } });
          console.log("  -> direset null");
        } else {
          const buf = Buffer.from(await res.arrayBuffer());
          try {
            const sharp = (await import("sharp")).default;
            const meta = await sharp(buf).metadata();
            console.log("OK:", m.nama, "->", meta.format, meta.width + "x" + meta.height);
          } catch {
            console.log("CORRUPT:", m.nama);
            const filename = url.split("/").pop();
            if (filename) await supabase.storage.from("menu-images").remove([filename]);
            await prisma.menu.update({ where: { id: m.id }, data: { gambar: null } });
            console.log("  -> direset null");
          }
        }
      } catch (e: any) {
        console.log("FETCH ERROR:", m.nama, "->", e.message);
      }
    }
  }

  await prisma.$disconnect();
}

main();
