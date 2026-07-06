import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase URL or key");

const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
const BUCKET = "menu-images";

async function migrate() {
  const menus = await prisma.menu.findMany({ where: { gambar: { not: null } } });
  const toMigrate = menus.filter((m) => m.gambar && !m.gambar!.startsWith("http"));

  if (toMigrate.length === 0) {
    console.log("✅ Semua gambar sudah pakai URL Supabase. Tidak perlu migrasi.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Menemukan ${toMigrate.length} menu dengan gambar lokal:`);

  for (const menu of toMigrate) {
    const localPath = menu.gambar!.replace(/^\//, ""); // "/menu/file.webp" -> "menu/file.webp"
    const filePath = path.join(process.cwd(), "public", localPath);
    const filename = path.basename(menu.gambar!);

    try {
      const buffer = await readFile(filePath);

      const optimized = await sharp(buffer)
        .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, optimized, { contentType: "image/webp", upsert: true });

      if (uploadError) {
        console.error(`  ❌ ${menu.nama}: upload gagal - ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

      await prisma.menu.update({ where: { id: menu.id }, data: { gambar: urlData.publicUrl } });

      console.log(`  ✅ ${menu.nama}: ${urlData.publicUrl}`);
    } catch (err) {
      console.error(`  ❌ ${menu.nama}: file tidak ada di ${filePath}`);
      // set gambar ke null karena file aslinya tidak ada
      await prisma.menu.update({ where: { id: menu.id }, data: { gambar: null } });
      console.log(`  ➡️  ${menu.nama}: gambar direset ke null`);
    }
  }

  await prisma.$disconnect();
  console.log("\n✅ Migrasi selesai!");
}

migrate();
