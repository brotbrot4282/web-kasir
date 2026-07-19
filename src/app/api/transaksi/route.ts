import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNoTransaksi, formatRupiah } from "@/lib/utils";
import { kirimWA } from "@/lib/fonnte";
import { getSession } from "@/lib/auth";

const BRAND_NAME = process.env.BRAND_NAME || "WARKOP SOEKARDJO";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://www.instagram.com/warkop.soekardjo/";

type VariantOption = { nama: string; tambahHarga: number };
type VariantGroup = { nama: string; required: boolean; options: VariantOption[] };

function hitungHarga(menu: { harga: number; variants: VariantGroup[] | null }, variantString?: string | null): number {
  if (!variantString || !menu.variants) return menu.harga;
  const selectedNames = variantString.split(" | ");
  let tambahan = 0;
  for (const group of menu.variants) {
    const opt = group.options.find((o) => selectedNames.includes(o.nama));
    if (opt) tambahan += opt.tambahHarga;
  }
  return menu.harga + tambahan;
}

function formatPoin(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const skip = (page - 1) * limit;

  const dateFilter: Record<string, Date> = {};
  if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
  if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

  const where = dari || sampai ? { createdAt: dateFilter } : {};

  const [transaksi, total] = await Promise.all([
    prisma.transaksi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        itemTransaksi: {
          include: { menu: true },
        },
        member: {
          select: { nama: true, noWa: true },
        },
      },
    }),
    prisma.transaksi.count({ where }),
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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { items, totalBayar, noWa, memberNama, diskon = 0 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Minimal satu item diperlukan" }, { status: 400 });
    }

    if (totalBayar === undefined || totalBayar === null || typeof totalBayar !== "number" || totalBayar < 0) {
      return NextResponse.json({ error: "Total bayar tidak valid" }, { status: 400 });
    }

    if (typeof diskon !== "number" || diskon < 0) {
      return NextResponse.json({ error: "Diskon tidak valid" }, { status: 400 });
    }

    let totalHarga = 0;
    let poinDigunakan = 0;
    let totalPoin = 0;
    const poinItemNames: string[] = [];

    const pengaturan = await prisma.pengaturanPoin.findUnique({ where: { id: 1 } });
    const rupiahPerPoin = pengaturan?.rupiahPerPoin ?? 15000;
    const poinPerGratis = pengaturan?.poinPerGratisItem ?? 5;

    const itemData: Array<{
      menuId: string;
      namaMenu: string;
      harga: number;
      jumlah: number;
      subtotal: number;
      variant: string | null;
      statusDapur: "MENUNGGU";
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

      const variants = menu.variants as VariantGroup[] | null;
      const harga = hitungHarga({ harga: menu.harga, variants }, item.variant);
      const namaMenu = item.variant ? `${menu.nama} - ${item.variant}` : menu.nama;
      const subtotal = harga * item.jumlah;
      totalHarga += subtotal;

      if (item.gratisPoin) {
        poinDigunakan += poinPerGratis;
        totalPoin += subtotal;
        poinItemNames.push(namaMenu);
      }

      itemData.push({
        menuId: menu.id,
        namaMenu,
        harga,
        jumlah: item.jumlah,
        subtotal,
        variant: item.variant ?? null,
        statusDapur: "MENUNGGU",
      });
    }

    let member = null;
    if (noWa && typeof noWa === "string" && noWa.trim()) {
      const noWaTrimmed = noWa.trim();
      const existing = await prisma.member.findUnique({ where: { noWa: noWaTrimmed } });
      if (existing) {
        if (!existing.nama && memberNama && typeof memberNama === "string" && memberNama.trim()) {
          member = await prisma.member.update({
            where: { noWa: noWaTrimmed },
            data: { nama: memberNama.trim() },
          });
        } else {
          member = existing;
        }
      } else {
        member = await prisma.member.create({
          data: {
            noWa: noWaTrimmed,
            nama: (memberNama && typeof memberNama === "string" && memberNama.trim()) ? memberNama.trim() : null,
          },
        });
      }
    }

    if (member && poinDigunakan > 0 && member.poin < poinDigunakan) {
      return NextResponse.json(
        { error: `Poin tidak cukup (sisa ${member.poin}, butuh ${poinDigunakan})` },
        { status: 400 }
      );
    }

    const subtotalSebelumDiskon = totalHarga - totalPoin;
    if (diskon > subtotalSebelumDiskon) {
      return NextResponse.json(
        { error: `Diskon tidak boleh melebihi total Rp ${subtotalSebelumDiskon.toLocaleString()}` },
        { status: 400 }
      );
    }

    const harusDibayar = subtotalSebelumDiskon - diskon;
    const kembalian = totalBayar - harusDibayar;
    if (kembalian < 0) {
      return NextResponse.json(
        { error: `Uang tidak mencukupi, masih kurang Rp ${(harusDibayar - totalBayar).toLocaleString()}` },
        { status: 400 }
      );
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        noTransaksi: generateNoTransaksi(),
        totalHarga,
        diskon,
        totalBayar,
        kembalian,
        poinDigunakan,
        totalPoin,
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
      const cashAmount = totalHarga - totalPoin - diskon;
      poinDidapat = Math.floor(cashAmount / rupiahPerPoin);

      await prisma.rewardPoin.create({
        data: {
          memberId: member.id,
          transaksiId: transaksi.id,
          poin: poinDidapat,
          keterangan: `Transaksi ${transaksi.noTransaksi}`,
        },
      });

      if (poinDigunakan > 0) {
        await prisma.rewardPoin.create({
          data: {
            memberId: member.id,
            transaksiId: transaksi.id,
            poin: -poinDigunakan,
            keterangan: `Tukar: ${poinItemNames.join(", ")}`,
          },
        });
      }

      await prisma.member.update({
        where: { id: member.id },
        data: { poin: { increment: poinDidapat - poinDigunakan } },
      });

      try {
        const invoiceUrl = `http://localhost:3000/invoice/${transaksi.publicId}`;
        const pesan = [
          `Dear ${member.nama || "Customer"},`,
          "",
          `Terimakasih telah melakukan transaksi di ${BRAND_NAME}`,
          "Berikut adalah INVOICE transaksi Anda :",
          "",
          `* No Invoice : ${transaksi.noTransaksi}`,
          `* TOTAL TRANSAKSI : ${formatRupiah(transaksi.totalHarga)}`,
          diskon > 0 ? `* Diskon : -${formatRupiah(diskon)}` : "",
          poinDigunakan > 0 ? `* Poin Dipakai : ${poinDigunakan} POINT (${poinItemNames.join(", ")})` : "",
          `* Poin Didapat : ${formatPoin(poinDidapat)} POINT`,
          "",
          "Untuk melihat rincian transaksi dan point reward yang Anda dapatkan (POINT) klik link berikut",
          invoiceUrl,
          "",
          `*${BRAND_NAME} (17.00 - 23.00)*`,
          "",
          `Update info kegiatan menarik follow : ${INSTAGRAM_URL}`,
          "",
          "Have a Great Day,",
          "Management WARKOP SOEKARDJO",
          "#ojolalibaliomah",
          "#thefriendlyvapestoreinthetown",
        ].join("\n");
        await kirimWA(noWa, pesan);
      } catch (waErr) {
        console.warn("Gagal kirim WA:", waErr);
      }
    }

    return NextResponse.json({
      ...transaksi,
      poinDidapat,
      poinDigunakan,
      totalPoin,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
