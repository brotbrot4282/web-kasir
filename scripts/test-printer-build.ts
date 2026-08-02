import { buildStrukBytes } from "../src/lib/printer";

const sample = {
  noTransaksi: "INV-260802210000-001",
  totalHarga: 50000,
  totalBayar: 100000,
  kembalian: 50000,
  metodeBayar: "CASH",
  poinDidapat: 3,
  poinDigunakan: 0,
  totalPoin: 0,
  diskon: 5000,
  tax: 0,
  noWa: "08123456789",
  memberNama: "Budi",
  tipePesanan: "DINE_IN",
  catatan: "Meja 5",
  items: [
    { nama: "Kopi Susu Gula Aren - Es | Gula Aren Asli", harga: 18000, jumlah: 2, subtotal: 36000 },
    { nama: "Roti Bakar Coklat", harga: 14000, jumlah: 1, subtotal: 14000 },
  ],
};

const bytes = buildStrukBytes(sample, "customer");
let readable = "";
let dashRun = 0;
let maxDashRun = 0;
for (const b of bytes) {
  if (b === 0x2d) { dashRun++; maxDashRun = Math.max(maxDashRun, dashRun); }
  else dashRun = 0;
  if (b >= 0x20 && b <= 0x7e) readable += String.fromCharCode(b);
  else if (b === 0x0a) readable += "\n";
  else if (b === 0x0d) readable += "|";
}
console.log("max consecutive dash (0x2d) run:", maxDashRun);
console.log(readable);
