import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";
import { formatRupiah, formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  const dateFilter: Record<string, Date> = {};
  if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
  if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

  const where = dari || sampai ? { createdAt: dateFilter } : {};

  const [total, aggTransaksi, transaksi, menuTerlaris, closingData] = await Promise.all([
    prisma.transaksi.count({ where }),
    prisma.transaksi.aggregate({ where, _sum: { totalHarga: true, diskon: true } }),
    prisma.transaksi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { itemTransaksi: true },
    }),
    prisma.itemTransaksi.groupBy({
      by: ["menuId", "namaMenu"],
      _sum: { jumlah: true },
      where: dari || sampai ? { transaksi: { createdAt: dateFilter } } : {},
      orderBy: { _sum: { jumlah: "desc" } },
      take: 10,
    }),
    prisma.dailyReport.findMany({
      where: dari || sampai ? { tanggal: dateFilter } : {},
      orderBy: { tanggal: "desc" },
      include: { user: { select: { nama: true } } },
    }),
  ]);

  const totalOmset = aggTransaksi._sum.totalHarga || 0;
  const totalDiskon = aggTransaksi._sum.diskon || 0;

  const itemAgg = await prisma.itemTransaksi.aggregate({
    where: dari || sampai ? { transaksi: { createdAt: dateFilter } } : {},
    _sum: { jumlah: true },
  });
  const totalItem = itemAgg._sum.jumlah || 0;

  const wb = new ExcelJS.Workbook();
  wb.creator = "WARKOP SOEKARDJO";
  wb.created = new Date();

  const style = {
    header: { font: { bold: true, color: { argb: "FFFFFF" }, size: 11 }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "8B0000" } }, alignment: { horizontal: "center" as const, vertical: "middle" as const } },
    cell: { font: { size: 10 }, alignment: { vertical: "middle" as const } },
    number: { font: { size: 10 }, alignment: { horizontal: "right" as const, vertical: "middle" as const }, numFmt: '#,##0' },
    title: { font: { bold: true, size: 14, color: { argb: "8B0000" } } },
  };

  // ── Sheet 1: Ringkasan ──
  const s1 = wb.addWorksheet("Ringkasan", { views: [{ state: "frozen", ySplit: 1 }] });
  s1.columns = [
    { header: "Metrik", key: "metrik", width: 25 },
    { header: "Nilai", key: "nilai", width: 20 },
  ];
  s1.getRow(1).eachCell((c) => { c.font = style.header.font; c.fill = style.header.fill; c.alignment = style.header.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
  const ringkasanData = [
    { metrik: "Total Omset", nilai: formatRupiah(totalOmset) },
    { metrik: "Total Diskon", nilai: formatRupiah(totalDiskon) },
    { metrik: "Total Transaksi", nilai: total.toLocaleString() },
    { metrik: "Total Item Terjual", nilai: totalItem.toLocaleString() },
  ];
  ringkasanData.forEach((r, i) => {
    const row = s1.addRow(r);
    row.eachCell((c) => { c.font = style.cell.font; c.alignment = style.cell.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
  });

  // ── Sheet 2: Menu Terlaris ──
  const s2 = wb.addWorksheet("Menu Terlaris", { views: [{ state: "frozen", ySplit: 1 }] });
  s2.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Menu", key: "menu", width: 30 },
    { header: "Total Terjual", key: "terjual", width: 15 },
  ];
  s2.getRow(1).eachCell((c) => { c.font = style.header.font; c.fill = style.header.fill; c.alignment = style.header.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
  if (menuTerlaris.length === 0) {
    s2.addRow({ menu: "Tidak ada data" });
  } else {
    menuTerlaris.forEach((m, i) => {
      const row = s2.addRow({ rank: i + 1, menu: m.namaMenu, terjual: m._sum.jumlah ?? 0 });
      row.eachCell((c) => { c.font = style.cell.font; c.alignment = style.cell.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
      row.getCell(3).numFmt = '#,##0';
    });
  }

  // ── Sheet 3: Riwayat Transaksi ──
  const s3 = wb.addWorksheet("Riwayat Transaksi", { views: [{ state: "frozen", ySplit: 1 }] });
  s3.columns = [
    { header: "No. Transaksi", key: "no", width: 22 },
    { header: "Total Harga", key: "total", width: 16 },
    { header: "Diskon", key: "diskon", width: 16 },
    { header: "Bayar", key: "bayar", width: 16 },
    { header: "Kembalian", key: "kembali", width: 16 },
    { header: "Item", key: "item", width: 10 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Detail Item", key: "detail", width: 50 },
  ];
  s3.getRow(1).eachCell((c) => { c.font = style.header.font; c.fill = style.header.fill; c.alignment = style.header.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
  if (transaksi.length === 0) {
    s3.addRow({ no: "Tidak ada data" });
  } else {
    transaksi.forEach((t) => {
      const detailItems = t.itemTransaksi.map((i) => `${i.namaMenu} x${i.jumlah} (${formatRupiah(i.subtotal)})`).join(", ");
      const row = s3.addRow({ no: t.noTransaksi, total: t.totalHarga, diskon: t.diskon ?? 0, bayar: t.totalBayar, kembali: t.kembalian, item: t.itemTransaksi.reduce((s, i) => s + i.jumlah, 0), tanggal: formatDate(t.createdAt), detail: detailItems });
      row.eachCell((c) => { c.font = style.cell.font; c.alignment = style.cell.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
      for (const col of [2, 3, 4, 5]) row.getCell(col).numFmt = '#,##0';
    });
  }

  // ── Sheet 4: Closing ──
  const s4 = wb.addWorksheet("Closing Shift", { views: [{ state: "frozen", ySplit: 1 }] });
  s4.columns = [
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Shift", key: "shift", width: 12 },
    { header: "Kasir", key: "kasir", width: 20 },
    { header: "Uang Awal", key: "uangAwal", width: 16 },
    { header: "Makanan", key: "makanan", width: 12 },
    { header: "Minuman", key: "minuman", width: 12 },
    { header: "Omset", key: "omset", width: 16 },
    { header: "Transaksi", key: "transaksi", width: 12 },
    { header: "Catatan", key: "catatan", width: 30 },
  ];
  s4.getRow(1).eachCell((c) => { c.font = style.header.font; c.fill = style.header.fill; c.alignment = style.header.alignment; c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
  if (closingData.length === 0) {
    s4.addRow({ tanggal: "Tidak ada data" });
  } else {
    closingData.forEach((c) => {
      const row = s4.addRow({
        tanggal: formatDate(c.tanggal),
        shift: c.shift === "SHIFT_1" ? "Shift 1" : "Shift 2",
        kasir: c.user.nama,
        uangAwal: c.uangAwal,
        makanan: c.totalMakanan,
        minuman: c.totalMinuman,
        omset: c.totalOmset,
        transaksi: c.totalTransaksi,
        catatan: c.catatan || "-",
      });
      row.eachCell((c2) => { c2.font = style.cell.font; c2.alignment = style.cell.alignment; c2.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; });
      for (const col of [4, 5, 6, 7, 8]) row.getCell(col).numFmt = '#,##0';
    });
  }

  const buffer = await wb.xlsx.writeBuffer();

  const filename = `laporan-warkop-${dari || "all"}${sampai ? `-${sampai}` : ""}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
