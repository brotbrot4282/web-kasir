import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabase } from "@/lib/supabase";

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

    const optimized = await sharp(buffer)
      .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // validasi hasil sharp
    const meta = await sharp(optimized).metadata();
    if (!meta.format || !meta.width || !meta.height) {
      return NextResponse.json({ error: "Gagal memproses gambar" }, { status: 500 });
    }

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filename, optimized, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // verifikasi: download balik & cek validitas
    const { data: publicUrlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filename);

    const verifyRes = await fetch(publicUrlData.publicUrl);
    if (!verifyRes.ok) {
      await supabase.storage.from("menu-images").remove([filename]);
      return NextResponse.json({ error: "Gagal verifikasi gambar" }, { status: 500 });
    }

    const verifyBuf = Buffer.from(await verifyRes.arrayBuffer());
    try {
      await sharp(verifyBuf).metadata();
    } catch {
      await supabase.storage.from("menu-images").remove([filename]);
      return NextResponse.json({ error: "Gambar corrupt setelah upload" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
