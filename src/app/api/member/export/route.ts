import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      noWa: true,
      nama: true,
      poin: true,
      createdAt: true,
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WARKOP SOEKARDJO";
  const sheet = workbook.addWorksheet("Data Customer");

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama", key: "nama", width: 25 },
    { header: "No. WhatsApp", key: "noWa", width: 20 },
    { header: "Poin", key: "poin", width: 10 },
    { header: "Tanggal Daftar", key: "createdAt", width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A7C59" } };
  headerRow.alignment = { horizontal: "center" };

  members.forEach((m, i) => {
    sheet.addRow({
      no: i + 1,
      nama: m.nama || "-",
      noWa: m.noWa,
      poin: m.poin,
      createdAt: new Date(m.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" }),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-customer-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
