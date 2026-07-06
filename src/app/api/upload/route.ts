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

    const blob = new Blob([optimized], { type: "image/webp" });

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filename, blob, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}
