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
  const pw = await bcrypt.hash("soekardjo123", 12);

  // ── Users ──
  for (const u of [
    { username: "admin@soekardjo", nama: "Admin Soekardjo", role: "OWNER" as const },
    { username: "kasir1@soekardjo", nama: "Kasir Shift 1", role: "KASIR" as const, shift: "SHIFT_1" as const },
    { username: "kasir2@soekardjo", nama: "Kasir Shift 2", role: "KASIR" as const, shift: "SHIFT_2" as const },
    { username: "dapur@soekardjo", nama: "Koki Dapur", role: "DAPUR" as const },
  ]) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: { ...u, password: pw } });
  }
  console.log("✓ Users: 4");

  // ── Kategori ──
  const katNames = ["Kopi", "Non Kopi", "Makanan"];
  const kats: Record<string, string> = {};
  for (const n of katNames) {
    const k = await prisma.kategori.upsert({ where: { nama: n }, update: {}, create: { nama: n } });
    kats[n] = k.id;
  }
  console.log("✓ Kategori: 3");

  // ── Menu ──
  const drinkVariants = [
    {
      nama: "Temperatur",
      required: true,
      options: [
        { nama: "ICE", tambahHarga: 0 },
        { nama: "HOT", tambahHarga: 0 },
      ],
    },
    {
      nama: "Gula",
      required: false,
      options: [
        { nama: "Normal", tambahHarga: 0 },
        { nama: "Less Sugar", tambahHarga: 0 },
      ],
    },
    {
      nama: "Es",
      required: false,
      options: [
        { nama: "Normal", tambahHarga: 0 },
        { nama: "Less Ice", tambahHarga: 0 },
      ],
    },
  ];
  const menus = [
    { nama: "Kopi Hitam", harga: 5000, kat: "Kopi", var: drinkVariants },
    { nama: "Kopi Susu", harga: 7000, kat: "Kopi", var: drinkVariants },
    { nama: "Espresso", harga: 8000, kat: "Kopi" },
    { nama: "Cappuccino", harga: 10000, kat: "Kopi", var: drinkVariants },
    { nama: "Cafe Latte", harga: 12000, kat: "Kopi", var: drinkVariants },
    { nama: "Americano", harga: 9000, kat: "Kopi", var: drinkVariants },
    { nama: "Mocha", harga: 13000, kat: "Kopi", var: drinkVariants },
    { nama: "Matcha Latte", harga: 12000, kat: "Non Kopi", var: drinkVariants },
    { nama: "Chocolate", harga: 10000, kat: "Non Kopi", var: drinkVariants },
    { nama: "Red Velvet", harga: 12000, kat: "Non Kopi", var: drinkVariants },
    { nama: "Teh Tarik", harga: 6000, kat: "Non Kopi", var: drinkVariants },
    { nama: "Pisang Goreng", harga: 8000, kat: "Makanan" },
    { nama: "Kentang Goreng", harga: 10000, kat: "Makanan" },
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
    { namaBahan: "Kopi Bubuk", jumlah: 5000, satuan: "gram", hargaBahan: 120 },
    { namaBahan: "Susu Cair", jumlah: 5000, satuan: "ml", hargaBahan: 16 },
    { namaBahan: "Gula Pasir", jumlah: 5000, satuan: "gram", hargaBahan: 15 },
    { namaBahan: "Coklat Bubuk", jumlah: 2000, satuan: "gram", hargaBahan: 80 },
    { namaBahan: "Matcha Bubuk", jumlah: 1000, satuan: "gram", hargaBahan: 150 },
    { namaBahan: "Teh Bubuk", jumlah: 2000, satuan: "gram", hargaBahan: 50 },
    { namaBahan: "Red Velvet Powder", jumlah: 1000, satuan: "gram", hargaBahan: 120 },
    { namaBahan: "Es Batu", jumlah: 100, satuan: "pcs", hargaBahan: 500 },
    { namaBahan: "Cup", jumlah: 500, satuan: "pcs", hargaBahan: 800 },
    { namaBahan: "Tutup Cup", jumlah: 500, satuan: "pcs", hargaBahan: 300 },
    { namaBahan: "Sedotan", jumlah: 1000, satuan: "pcs", hargaBahan: 100 },
    { namaBahan: "Minyak Goreng", jumlah: 5000, satuan: "ml", hargaBahan: 15 },
    { namaBahan: "Pisang", jumlah: 50, satuan: "pcs", hargaBahan: 3000 },
    { namaBahan: "Kentang", jumlah: 10000, satuan: "gram", hargaBahan: 25 },
    { namaBahan: "Roti Tawar", jumlah: 50, satuan: "pcs", hargaBahan: 2500 },
    { namaBahan: "Selai", jumlah: 2000, satuan: "gram", hargaBahan: 40 },
    { namaBahan: "Mentega", jumlah: 2000, satuan: "gram", hargaBahan: 60 },
    { namaBahan: "Keju", jumlah: 1000, satuan: "gram", hargaBahan: 100 },
    { namaBahan: "Plastik Kemasan", jumlah: 500, satuan: "pcs", hargaBahan: 200 },
    { namaBahan: "Croissant (Frozen)", jumlah: 50, satuan: "pcs", hargaBahan: 8000 },
  ];
  for (const item of stokItems) {
    const existing = await prisma.stok.findFirst({ where: { namaBahan: item.namaBahan } });
    if (existing) await prisma.stok.update({ where: { id: existing.id }, data: { jumlah: item.jumlah, satuan: item.satuan, hargaBahan: item.hargaBahan } });
    else await prisma.stok.create({ data: item });
  }
  console.log("✓ Stok: 20");

  // ── Resep (HPP) ──
  const getStokId = async (nama: string) => (await prisma.stok.findFirst({ where: { namaBahan: nama } }))!.id;
  const getMenuId = async (nama: string) => (await prisma.menu.findFirst({ where: { nama } }))!.id;

  const stokIds = {
    kopiBubuk: await getStokId("Kopi Bubuk"),
    susuCair: await getStokId("Susu Cair"),
    gulaPasir: await getStokId("Gula Pasir"),
    coklatBubuk: await getStokId("Coklat Bubuk"),
    matchaBubuk: await getStokId("Matcha Bubuk"),
    tehBubuk: await getStokId("Teh Bubuk"),
    redVelvet: await getStokId("Red Velvet Powder"),
    cup: await getStokId("Cup"),
    tutupCup: await getStokId("Tutup Cup"),
    sedotan: await getStokId("Sedotan"),
    minyakGoreng: await getStokId("Minyak Goreng"),
    pisang: await getStokId("Pisang"),
    kentang: await getStokId("Kentang"),
    rotiTawar: await getStokId("Roti Tawar"),
    selai: await getStokId("Selai"),
    mentega: await getStokId("Mentega"),
    plastik: await getStokId("Plastik Kemasan"),
    croissant: await getStokId("Croissant (Frozen)"),
  };

  const setResep = async (menuNama: string, bahanList: { stokId: string; jumlah: number }[]) => {
    const menuId = await getMenuId(menuNama);
    for (const b of bahanList) {
      await prisma.resep.upsert({
        where: { menuId_stokId: { menuId, stokId: b.stokId } },
        update: { jumlah: b.jumlah },
        create: { menuId, stokId: b.stokId, jumlah: b.jumlah },
      });
    }
  };

  // Kopi
  await setResep("Kopi Hitam", [
    { stokId: stokIds.kopiBubuk, jumlah: 15 },
    { stokId: stokIds.gulaPasir, jumlah: 15 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Kopi Susu", [
    { stokId: stokIds.kopiBubuk, jumlah: 15 },
    { stokId: stokIds.susuCair, jumlah: 200 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Espresso", [
    { stokId: stokIds.kopiBubuk, jumlah: 18 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
  ]);
  await setResep("Cappuccino", [
    { stokId: stokIds.kopiBubuk, jumlah: 15 },
    { stokId: stokIds.susuCair, jumlah: 200 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Cafe Latte", [
    { stokId: stokIds.kopiBubuk, jumlah: 15 },
    { stokId: stokIds.susuCair, jumlah: 250 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Americano", [
    { stokId: stokIds.kopiBubuk, jumlah: 18 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Mocha", [
    { stokId: stokIds.kopiBubuk, jumlah: 15 },
    { stokId: stokIds.susuCair, jumlah: 200 },
    { stokId: stokIds.coklatBubuk, jumlah: 10 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);

  // Non Kopi
  await setResep("Matcha Latte", [
    { stokId: stokIds.matchaBubuk, jumlah: 8 },
    { stokId: stokIds.susuCair, jumlah: 250 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Chocolate", [
    { stokId: stokIds.coklatBubuk, jumlah: 15 },
    { stokId: stokIds.susuCair, jumlah: 200 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Red Velvet", [
    { stokId: stokIds.redVelvet, jumlah: 10 },
    { stokId: stokIds.susuCair, jumlah: 250 },
    { stokId: stokIds.gulaPasir, jumlah: 10 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);
  await setResep("Teh Tarik", [
    { stokId: stokIds.tehBubuk, jumlah: 10 },
    { stokId: stokIds.susuCair, jumlah: 150 },
    { stokId: stokIds.gulaPasir, jumlah: 15 },
    { stokId: stokIds.cup, jumlah: 1 },
    { stokId: stokIds.tutupCup, jumlah: 1 },
    { stokId: stokIds.sedotan, jumlah: 1 },
  ]);

  // Makanan
  await setResep("Pisang Goreng", [
    { stokId: stokIds.pisang, jumlah: 2 },
    { stokId: stokIds.minyakGoreng, jumlah: 100 },
    { stokId: stokIds.plastik, jumlah: 1 },
  ]);
  await setResep("Kentang Goreng", [
    { stokId: stokIds.kentang, jumlah: 200 },
    { stokId: stokIds.minyakGoreng, jumlah: 150 },
    { stokId: stokIds.plastik, jumlah: 1 },
  ]);
  await setResep("Roti Bakar", [
    { stokId: stokIds.rotiTawar, jumlah: 2 },
    { stokId: stokIds.mentega, jumlah: 15 },
    { stokId: stokIds.selai, jumlah: 20 },
    { stokId: stokIds.plastik, jumlah: 1 },
  ]);
  await setResep("Croissant", [
    { stokId: stokIds.croissant, jumlah: 1 },
    { stokId: stokIds.plastik, jumlah: 1 },
  ]);
  console.log("✓ Resep: 15 menu");

  // ── Pengaturan Poin ──
  await prisma.pengaturanPoin.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, rupiahPerPoin: 15000, nilaiPerPoin: 1000 },
  });
  console.log("✓ Pengaturan Poin: 1\n");

  console.log("\n=== SEED COMPLETE ===");
}

main().then(async () => { await prisma.$disconnect(); }).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
