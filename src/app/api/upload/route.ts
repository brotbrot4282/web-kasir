import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file harus JPG, PNG, atau WebP" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Maksimal ukuran file 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const dir = path.join(process.cwd(), "public", "menu");
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });

    await sharp(buffer)
      .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    return NextResponse.json({ url: `/menu/${filename}` });
  } catch {
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}
