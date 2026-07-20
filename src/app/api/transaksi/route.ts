import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNoTransaksi, formatRupiah } from "@/lib/utils";
import { kirimWA } from "@/lib/fonnte";
import { getSession } from "@/lib/auth";
import { transaksiSchema } from "@/lib/validations";

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
    const parsed = transaksiSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { items, totalBayar, noWa, memberNama, diskon, metodeBayar } = parsed.data;

    let totalHarga = 0;
    let poinDigunakan = 0;
    let totalPoin = 0;
    const poinItemNames: string[] = [];

    const pengaturan = await prisma.pengaturanPoin.findUnique({ where: { id: 1 } });
    const rupiahPerPoin = pengaturan?.rupiahPerPoin ?? 15000;
    const poinPerGratis = pengaturan?.poinPerGratisItem ?? 5;
    const minimalTransaksi = pengaturan?.minimalTransaksi ?? 10000;

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

    if (poinDigunakan > 0 && minimalTransaksi > 0) {
      const harusDibayarCek = totalHarga - totalPoin;
      if (harusDibayarCek < minimalTransaksi) {
        return NextResponse.json(
          { error: `Sisa transaksi harus minimal Rp ${minimalTransaksi.toLocaleString("id-ID")} setelah pakai poin (sisa Rp ${harusDibayarCek.toLocaleString("id-ID")})` },
          { status: 400 }
        );
      }
    }

    const subtotalSebelumDiskon = totalHarga - totalPoin;
    if (diskon > subtotalSebelumDiskon) {
      return NextResponse.json(
        { error: `Diskon tidak boleh melebihi total Rp ${subtotalSebelumDiskon.toLocaleString()}` },
        { status: 400 }
      );
    }

    const harusDibayar = subtotalSebelumDiskon - diskon;
    const kembalian = metodeBayar === "QRIS" ? 0 : totalBayar - harusDibayar;
    if (metodeBayar === "CASH" && kembalian < 0) {
      return NextResponse.json(
        { error: `Uang tidak mencukupi, masih kurang Rp ${(harusDibayar - totalBayar).toLocaleString()}` },
        { status: 400 }
      );
    }

    const transaksi = await prisma.$transaction(async (tx) => {
      // Atomic stock decrement: prevents race condition
      for (const item of items) {
        const result: { stok: number }[] = await tx.$queryRaw`
          UPDATE menu SET stok = stok - ${item.jumlah}
          WHERE id = ${item.menuId}::uuid AND stok >= ${item.jumlah}
          RETURNING stok
        `;
        if (result.length === 0) {
          const menu = await tx.menu.findUnique({ where: { id: item.menuId }, select: { nama: true, stok: true } });
          throw new Error(`STOK_TIDAK_CUKUP:${menu?.nama ?? item.menuId}:${menu?.stok ?? 0}`);
        }
      }

      const newTransaksi = await tx.transaksi.create({
        data: {
          noTransaksi: generateNoTransaksi(),
          totalHarga,
          diskon,
          totalBayar: metodeBayar === "QRIS" ? harusDibayar : totalBayar,
          kembalian,
          metodeBayar,
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

      let poinDidapat = 0;
      if (member) {
        const cashAmount = totalHarga - totalPoin - diskon;
        poinDidapat = Math.floor(cashAmount / rupiahPerPoin);

        await tx.rewardPoin.create({
          data: {
            memberId: member.id,
            transaksiId: newTransaksi.id,
            poin: poinDidapat,
            keterangan: `Transaksi ${newTransaksi.noTransaksi}`,
          },
        });

        if (poinDigunakan > 0) {
          await tx.rewardPoin.create({
            data: {
              memberId: member.id,
              transaksiId: newTransaksi.id,
              poin: -poinDigunakan,
              keterangan: `Tukar: ${poinItemNames.join(", ")}`,
            },
          });
        }

        await tx.member.update({
          where: { id: member.id },
          data: { poin: { increment: poinDidapat - poinDigunakan } },
        });
      }

      return { ...newTransaksi, poinDidapat };
    });

    if (member) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const invoiceUrl = `${baseUrl}/invoice/${transaksi.publicId}`;
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
          `* Poin Didapat : ${formatPoin(transaksi.poinDidapat)} POINT`,
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
        await kirimWA(noWa!, pesan);
      } catch (waErr) {
        console.warn("Gagal kirim WA:", waErr);
      }
    }

    return NextResponse.json({
      ...transaksi,
      poinDigunakan,
      totalPoin,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("STOK_TIDAK_CUKUP:")) {
      const [, nama, sisa] = message.split(":");
      return NextResponse.json(
        { error: `Stok ${nama} tidak mencukupi (sisa ${sisa})` },
        { status: 400 }
      );
    }
    console.error("Transaksi error:", err);
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
