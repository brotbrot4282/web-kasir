import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNoTransaksi, formatRupiah } from "@/lib/utils";
import { kirimWA } from "@/lib/fonnte";

const BRAND_NAME = process.env.BRAND_NAME || "WARKOP SOEKARDJO";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://www.instagram.com/warkop.soekardjo/";

type Variant = { nama: string; tambahHarga: number };

function hitungHarga(menu: { harga: number; variants: Variant[] | null }, variantName?: string | null): number {
  if (!variantName || !menu.variants) return menu.harga;
  const v = menu.variants.find((v) => v.nama === variantName);
  return menu.harga + (v?.tambahHarga ?? 0);
}

function formatPoin(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [transaksi, total] = await Promise.all([
    prisma.transaksi.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        itemTransaksi: {
          include: { menu: true },
        },
      },
    }),
    prisma.transaksi.count(),
  ]);

  return NextResponse.json({
    data: transaksi,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, totalBayar, noWa } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Minimal satu item diperlukan" }, { status: 400 });
    }

    if (!totalBayar || typeof totalBayar !== "number" || totalBayar <= 0) {
      return NextResponse.json({ error: "Total bayar tidak valid" }, { status: 400 });
    }

    let totalHarga = 0;
    const itemData: Array<{
      menuId: string;
      namaMenu: string;
      harga: number;
      jumlah: number;
      subtotal: number;
      variant: string | null;
    }> = [];

    for (const item of items) {
      const menu = await prisma.menu.findUnique({ where: { id: item.menuId } });
      if (!menu) {
        return NextResponse.json(
          { error: `Menu dengan ID ${item.menuId} tidak ditemukan` },
          { status: 400 }
        );
      }
      if (!menu.isTersedia) {
        return NextResponse.json(
          { error: `${menu.nama} sedang tidak tersedia` },
          { status: 400 }
        );
      }
      if (menu.stok < item.jumlah) {
        return NextResponse.json(
          { error: `Stok ${menu.nama} tidak mencukupi (sisa ${menu.stok})` },
          { status: 400 }
        );
      }

      const variants = menu.variants as Variant[] | null;
      const harga = hitungHarga({ harga: menu.harga, variants }, item.variant);
      const namaMenu = item.variant ? `${menu.nama} - ${item.variant}` : menu.nama;
      const subtotal = harga * item.jumlah;
      totalHarga += subtotal;

      itemData.push({
        menuId: menu.id,
        namaMenu,
        harga,
        jumlah: item.jumlah,
        subtotal,
        variant: item.variant ?? null,
      });
    }

    if (totalBayar < totalHarga) {
      return NextResponse.json(
        { error: "Uang tidak mencukupi", totalHarga, kekurangan: totalHarga - totalBayar },
        { status: 400 }
      );
    }

    let member = null;
    if (noWa && typeof noWa === "string" && noWa.trim()) {
      member = await prisma.member.upsert({
        where: { noWa: noWa.trim() },
        update: {},
        create: { noWa: noWa.trim() },
      });
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        noTransaksi: generateNoTransaksi(),
        totalHarga,
        totalBayar,
        kembalian: totalBayar - totalHarga,
        noWa: noWa?.trim() || null,
        memberId: member?.id || null,
        itemTransaksi: {
          create: itemData,
        },
      },
      include: {
        itemTransaksi: {
          include: { menu: true },
        },
      },
    });

    for (const item of items) {
      await prisma.menu.update({
        where: { id: item.menuId },
        data: { stok: { decrement: item.jumlah } },
      });
    }

    let poinDidapat = 0;
    if (member) {
      poinDidapat = Math.floor(totalHarga / 1000);
      await prisma.rewardPoin.create({
        data: {
          memberId: member.id,
          transaksiId: transaksi.id,
          poin: poinDidapat,
          keterangan: `Transaksi ${transaksi.noTransaksi}`,
        },
      });
      await prisma.member.update({
        where: { id: member.id },
        data: { poin: { increment: poinDidapat } },
      });

      try {
        const invoiceUrl = `http://localhost:3000/invoice/${transaksi.publicId}`;
        const pesan = [
          `*${BRAND_NAME}*`,
          "",
          `Halo ${member.nama || "Customer"},`,
          "",
          `Terima kasih telah melakukan transaksi di ${BRAND_NAME}`,
          "Berikut INVOICE transaksi Anda :",
          "",
          `No Invoice : ${transaksi.noTransaksi}`,
          `TOTAL TRANSAKSI : ${formatRupiah(transaksi.totalHarga)}`,
          `Poin Didapat : ${formatPoin(poinDidapat)} OV POINT`,
          "",
          "Untuk melihat rincian transaksi klik link berikut",
          invoiceUrl,
          "",
          `Update info kegiatan menarik follow : ${INSTAGRAM_URL}`,
          "",
          "Have a Great Day,",
          BRAND_NAME,
        ].join("\n");
        await kirimWA(noWa, pesan);
      } catch (waErr) {
        console.warn("Gagal kirim WA:", waErr);
      }
    }

    return NextResponse.json({
      ...transaksi,
      poinDidapat,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
