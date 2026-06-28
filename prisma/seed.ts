import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("password123", 12);
  await prisma.user.upsert({
    where: { username: "admin@warmindo" },
    update: {},
    create: {
      username: "admin@warmindo",
      password: adminPassword,
      nama: "Admin Warmindo",
    },
  });
  console.log("Admin user created");

  // Upsert kategori
  const makanan = await prisma.kategori.upsert({
    where: { nama: "Makanan" },
    update: {},
    create: { nama: "Makanan" },
  });
  const minuman = await prisma.kategori.upsert({
    where: { nama: "Minuman" },
    update: {},
    create: { nama: "Minuman" },
  });
  console.log(`Kategori: ${makanan.nama}, ${minuman.nama}`);

  // Daftar menu
  const menuItems = [
    { nama: "Indomie Goreng Biasa", harga: 8000, kategoriId: makanan.id, stok: 50 },
    { nama: "Indomie Goreng Telur", harga: 10000, kategoriId: makanan.id, stok: 40 },
    { nama: "Indomie Goreng Spesial", harga: 13000, kategoriId: makanan.id, stok: 30 },
    { nama: "Indomie Kuah Biasa", harga: 8000, kategoriId: makanan.id, stok: 50 },
    { nama: "Indomie Kuah Telur", harga: 10000, kategoriId: makanan.id, stok: 40 },
    { nama: "Nasi Goreng", harga: 12000, kategoriId: makanan.id, stok: 25 },
    { nama: "Nasi Goreng Spesial", harga: 15000, kategoriId: makanan.id, stok: 20 },
    { nama: "Mie Ayam", harga: 12000, kategoriId: makanan.id, stok: 20 },
    { nama: "Bakso", harga: 12000, kategoriId: makanan.id, stok: 30 },
    { nama: "Siomay", harga: 10000, kategoriId: makanan.id, stok: 25 },
    { nama: "Pisang Goreng", harga: 7000, kategoriId: makanan.id, stok: 20 },
    { nama: "Tahu Goreng", harga: 5000, kategoriId: makanan.id, stok: 30 },
    { nama: "Tempe Goreng", harga: 5000, kategoriId: makanan.id, stok: 30 },
    { nama: "Kentang Goreng", harga: 10000, kategoriId: makanan.id, stok: 20 },
    { nama: "Cireng", harga: 8000, kategoriId: makanan.id, stok: 25 },
    { nama: "Teh Manis Hangat", harga: 5000, kategoriId: minuman.id, stok: 50 },
    { nama: "Teh Manis Dingin", harga: 6000, kategoriId: minuman.id, stok: 50 },
    { nama: "Teh Tawar Hangat", harga: 4000, kategoriId: minuman.id, stok: 30 },
    { nama: "Es Jeruk", harga: 7000, kategoriId: minuman.id, stok: 40 },
    { nama: "Jeruk Hangat", harga: 6000, kategoriId: minuman.id, stok: 30 },
    { nama: "Kopi Hitam", harga: 5000, kategoriId: minuman.id, stok: 40 },
    { nama: "Kopi Susu", harga: 7000, kategoriId: minuman.id, stok: 35 },
    { nama: "Susu Coklat Hangat", harga: 8000, kategoriId: minuman.id, stok: 25 },
    { nama: "Air Mineral", harga: 3000, kategoriId: minuman.id, stok: 60 },
    { nama: "Teh Botol", harga: 5000, kategoriId: minuman.id, stok: 40 },
    { nama: "Coca Cola", harga: 7000, kategoriId: minuman.id, stok: 35 },
    { nama: "Fanta", harga: 7000, kategoriId: minuman.id, stok: 35 },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menu.findFirst({ where: { nama: item.nama } });
    if (existing) {
      await prisma.menu.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.menu.create({ data: item });
    }
  }
  console.log(`${menuItems.length} menu items created/updated`);

  // Stok bahan baku
  const stokItems = [
    { namaBahan: "Indomie Goreng", jumlah: 10, satuan: "Dus" },
    { namaBahan: "Indomie Kuah", jumlah: 8, satuan: "Dus" },
    { namaBahan: "Telur", jumlah: 60, satuan: "Butir" },
    { namaBahan: "Beras", jumlah: 25, satuan: "Kg" },
    { namaBahan: "Minyak Goreng", jumlah: 5, satuan: "Liter" },
    { namaBahan: "Gula Pasir", jumlah: 10, satuan: "Kg" },
    { namaBahan: "Kopi Bubuk", jumlah: 2, satuan: "Kg" },
    { namaBahan: "Teh Celup", jumlah: 5, satuan: "Kotak" },
    { namaBahan: "Susu Kental Manis", jumlah: 12, satuan: "Kaleng" },
    { namaBahan: "Jeruk", jumlah: 5, satuan: "Kg" },
    { namaBahan: "Air Mineral Galon", jumlah: 3, satuan: "Galon" },
    { namaBahan: "Siomay", jumlah: 50, satuan: "Biji" },
    { namaBahan: "Bakso", jumlah: 100, satuan: "Biji" },
    { namaBahan: "Pisang Kepok", jumlah: 5, satuan: "Kg" },
    { namaBahan: "Kentang", jumlah: 8, satuan: "Kg" },
    { namaBahan: "Tahu", jumlah: 20, satuan: "Biji" },
    { namaBahan: "Tempe", jumlah: 15, satuan: "Papan" },
    { namaBahan: "Cireng", jumlah: 50, satuan: "Biji" },
    { namaBahan: "Mie Ayam", jumlah: 5, satuan: "Kg" },
  ];

  for (const item of stokItems) {
    const existing = await prisma.stok.findFirst({ where: { namaBahan: item.namaBahan } });
    if (existing) {
      await prisma.stok.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.stok.create({ data: item });
    }
  }
  console.log(`${stokItems.length} stok items created/updated`);

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
