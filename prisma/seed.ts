import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...\n");
  const pw = await bcrypt.hash("warmindo123", 12);

  // ── Users ──
  for (const u of [
    { username: "admin@warmindo", nama: "Admin Warmindo", role: "OWNER" as const },
    { username: "kasir1@warmindo", nama: "Kasir Shift 1", role: "KASIR" as const, shift: "SHIFT_1" as const },
    { username: "kasir2@warmindo", nama: "Kasir Shift 2", role: "KASIR" as const, shift: "SHIFT_2" as const },
  ]) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: { ...u, password: pw } });
  }
  console.log("✓ Users: 3");

  // ── Kategori ──
  const katNames = ["Kopi", "Non Kopi", "Makanan", "Cemilan", "Lainnya"];
  const kats: Record<string, string> = {};
  for (const n of katNames) {
    const k = await prisma.kategori.upsert({ where: { nama: n }, update: {}, create: { nama: n } });
    kats[n] = k.id;
  }
  console.log("✓ Kategori: 5");

  // ── Menu ──
  const iceHot = JSON.stringify([{ nama: "ICE", tambahHarga: 0 }, { nama: "HOT", tambahHarga: 0 }]);
  const menus = [
    { nama: "Kopi Hitam", harga: 5000, kat: "Kopi", var: iceHot },
    { nama: "Kopi Susu", harga: 7000, kat: "Kopi", var: iceHot },
    { nama: "Espresso", harga: 8000, kat: "Kopi" },
    { nama: "Cappuccino", harga: 10000, kat: "Kopi", var: iceHot },
    { nama: "Cafe Latte", harga: 12000, kat: "Kopi", var: iceHot },
    { nama: "Americano", harga: 9000, kat: "Kopi", var: iceHot },
    { nama: "Mocha", harga: 13000, kat: "Kopi", var: iceHot },
    { nama: "Matcha Latte", harga: 12000, kat: "Non Kopi", var: iceHot },
    { nama: "Chocolate", harga: 10000, kat: "Non Kopi", var: iceHot },
    { nama: "Red Velvet", harga: 12000, kat: "Non Kopi", var: iceHot },
    { nama: "Teh Tarik", harga: 6000, kat: "Non Kopi", var: iceHot },
    { nama: "Pisang Goreng", harga: 8000, kat: "Cemilan" },
    { nama: "Kentang Goreng", harga: 10000, kat: "Cemilan" },
    { nama: "Roti Bakar", harga: 12000, kat: "Makanan" },
    { nama: "Croissant", harga: 15000, kat: "Makanan" },
  ];
  for (const m of menus) {
    const existing = await prisma.menu.findFirst({ where: { nama: m.nama } });
    const data: Parameters<typeof prisma.menu.create>[0]['data'] = { nama: m.nama, harga: m.harga, kategoriId: kats[m.kat], stok: 999 };
    if (m.var) data.variants = m.var;
    if (existing) await prisma.menu.update({ where: { id: existing.id }, data });
    else await prisma.menu.create({ data });
  }
  console.log("✓ Menu: 15");

  // ── Stok ──
  const stokItems = [
    ["Kopi Bubuk", 5000, "gram"], ["Susu Cair", 5000, "ml"], ["Gula Pasir", 5000, "gram"],
    ["Coklat Bubuk", 2000, "gram"], ["Matcha Bubuk", 1000, "gram"], ["Teh Bubuk", 2000, "gram"],
    ["Red Velvet Powder", 1000, "gram"], ["Es Batu", 100, "plastik"], ["Cup", 500, "pcs"],
    ["Tutup Cup", 500, "pcs"], ["Sedotan", 1000, "pcs"], ["Minyak Goreng", 5000, "ml"],
    ["Pisang", 50, "pcs"], ["Kentang", 10000, "gram"], ["Roti Tawar", 50, "pcs"],
    ["Selai", 2000, "gram"], ["Mentega", 2000, "gram"], ["Keju", 1000, "gram"],
    ["Plastik Kemasan", 500, "pcs"],
  ] as const;
  for (const [namaBahan, jumlah, satuan] of stokItems) {
    const existing = await prisma.stok.findFirst({ where: { namaBahan } });
    if (existing) await prisma.stok.update({ where: { id: existing.id }, data: { jumlah, satuan } });
    else await prisma.stok.create({ data: { namaBahan, jumlah: jumlah as number, satuan } });
  }
  console.log("✓ Stok: 19");

  // ── Member ──
  const memberData = [
    { noWa: "08123456789", nama: "Budi", poin: 10 },
    { noWa: "08234567890", nama: "Ani", poin: 5 },
    { noWa: "08345678901", nama: "Citra", poin: 0 },
  ];
  for (const m of memberData) {
    await prisma.member.upsert({ where: { noWa: m.noWa }, update: m, create: m });
  }
  console.log("✓ Member: 3\n");

  // ── Sample Transaksi ──
  const getMenuId = async (nama: string) => (await prisma.menu.findFirst({ where: { nama } }))!.id;
  const budi = (await prisma.member.findUnique({ where: { noWa: "08123456789" } }))!;
  const ani = (await prisma.member.findUnique({ where: { noWa: "08234567890" } }))!;
  const kopiSusu = await getMenuId("Kopi Susu");
  const pisang = await getMenuId("Pisang Goreng");
  const tehTarik = await getMenuId("Teh Tarik");
  const rotiBakar = await getMenuId("Roti Bakar");
  const kopiHitam = await getMenuId("Kopi Hitam");

  // 1: Budi Kopi Susu 7k
  const t1 = await prisma.transaksi.create({
    data: { noTransaksi: "INV-SEED-0001", totalHarga: 7000, totalBayar: 7000, kembalian: 0, noWa: "08123456789", memberId: budi.id, itemTransaksi: { create: [{ menuId: kopiSusu, namaMenu: "Kopi Susu", harga: 7000, jumlah: 1, subtotal: 7000 }] } },
  });
  await prisma.rewardPoin.create({ data: { memberId: budi.id, transaksiId: t1.id, poin: 0, keterangan: `Transaksi ${t1.noTransaksi}` } });
  await prisma.menu.update({ where: { id: kopiSusu }, data: { stok: { decrement: 1 } } });

  // 2: Budi Pisang Goreng 8k + Teh Tarik ICE 6k = 14k, bayar 15k, dapat 1 poin
  const t2 = await prisma.transaksi.create({
    data: { noTransaksi: "INV-SEED-0002", totalHarga: 14000, totalBayar: 15000, kembalian: 1000, noWa: "08123456789", memberId: budi.id, itemTransaksi: { create: [{ menuId: pisang, namaMenu: "Pisang Goreng", harga: 8000, jumlah: 1, subtotal: 8000 }, { menuId: tehTarik, namaMenu: "Teh Tarik - ICE", harga: 6000, jumlah: 1, subtotal: 6000 }] } },
  });
  await prisma.rewardPoin.create({ data: { memberId: budi.id, transaksiId: t2.id, poin: 1, keterangan: `Transaksi ${t2.noTransaksi}` } });
  await prisma.member.update({ where: { id: budi.id }, data: { poin: { increment: 1 } } });
  for (const id of [pisang, tehTarik]) await prisma.menu.update({ where: { id }, data: { stok: { decrement: 1 } } });

  // 3: Ani Roti Bakar 12k, bayar 12k
  const t3 = await prisma.transaksi.create({
    data: { noTransaksi: "INV-SEED-0003", totalHarga: 12000, totalBayar: 12000, kembalian: 0, noWa: "08234567890", memberId: ani.id, itemTransaksi: { create: [{ menuId: rotiBakar, namaMenu: "Roti Bakar", harga: 12000, jumlah: 1, subtotal: 12000 }] } },
  });
  await prisma.rewardPoin.create({ data: { memberId: ani.id, transaksiId: t3.id, poin: 0, keterangan: `Transaksi ${t3.noTransaksi}` } });
  await prisma.menu.update({ where: { id: rotiBakar }, data: { stok: { decrement: 1 } } });

  // 4: Budi redeem 5 poin → Kopi Hitam ICE gratis, bayar 0
  const t4 = await prisma.transaksi.create({
    data: { noTransaksi: "INV-SEED-0004", totalHarga: 5000, totalBayar: 0, kembalian: 0, poinDigunakan: 5, totalPoin: 5000, noWa: "08123456789", memberId: budi.id, itemTransaksi: { create: [{ menuId: kopiHitam, namaMenu: "Kopi Hitam - ICE", harga: 5000, jumlah: 1, subtotal: 5000 }] } },
  });
  await prisma.rewardPoin.create({ data: { memberId: budi.id, transaksiId: t4.id, poin: 0, keterangan: `Transaksi ${t4.noTransaksi}` } });
  await prisma.rewardPoin.create({ data: { memberId: budi.id, transaksiId: t4.id, poin: -5, keterangan: "Tukar: Kopi Hitam - ICE" } });
  await prisma.member.update({ where: { id: budi.id }, data: { poin: { increment: -5 } } });
  await prisma.menu.update({ where: { id: kopiHitam }, data: { stok: { decrement: 1 } } });

  console.log("✓ Sample transaksi: 4 (1 redeem)");
  console.log("\n=== SEED COMPLETE ===");
}

main().then(async () => { await prisma.$disconnect(); }).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
