import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNoTransaksi } from "@/lib/utils";

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
    const { items, totalBayar } = body;

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

      const subtotal = menu.harga * item.jumlah;
      totalHarga += subtotal;

      itemData.push({
        menuId: menu.id,
        namaMenu: menu.nama,
        harga: menu.harga,
        jumlah: item.jumlah,
        subtotal,
      });
    }

    if (totalBayar < totalHarga) {
      return NextResponse.json(
        { error: "Uang tidak mencukupi", totalHarga, kekurangan: totalHarga - totalBayar },
        { status: 400 }
      );
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        noTransaksi: generateNoTransaksi(),
        totalHarga,
        totalBayar,
        kembalian: totalBayar - totalHarga,
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

    return NextResponse.json(transaksi, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
