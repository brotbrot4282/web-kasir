import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { formatRupiah } from "./utils";

export type PrinterInfo = { name: string; address: string; bonded?: boolean };

export interface AndroidPrinterBridge {
  getPrinters(): string;
  connect(address: string): boolean;
  disconnect(): boolean;
  isConnected(): boolean;
  print(base64: string): boolean;
}

declare global {
  interface Window {
    AndroidPrinter?: AndroidPrinterBridge;
  }
}

export type StrukItem = {
  nama: string;
  harga: number;
  jumlah: number;
  subtotal: number;
};

export type StrukData = {
  noTransaksi: string;
  totalHarga: number;
  totalBayar: number;
  kembalian: number;
  metodeBayar: string;
  poinDidapat: number;
  poinDigunakan: number;
  totalPoin: number;
  diskon: number;
  tax: number;
  noWa: string | null;
  memberNama?: string;
  tipePesanan: string;
  catatan: string | null;
  items: StrukItem[];
};

const COLS = 32;

const metodeLabel = (m: string) => (m === "QRIS" ? "QRIS" : m === "CARD" ? "Card" : "Tunai");

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(1, max - 1)) + ".";
}

function alignLine(left: string, right: string): string {
  const gap = COLS - left.length - right.length;
  if (gap >= 1) return left + " ".repeat(gap) + right;
  return truncate(left, Math.max(1, COLS - right.length - 1)) + " " + right;
}

export function getBridge(): AndroidPrinterBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AndroidPrinter;
}

export function isBridgeAvailable(): boolean {
  return typeof getBridge() !== "undefined";
}

export function getAvailablePrinters(): PrinterInfo[] {
  const bridge = getBridge();
  if (!bridge) return [];
  try {
    const raw = bridge.getPrinters();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function connectPrinter(address: string): boolean {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    return bridge.connect(address) === true;
  } catch {
    return false;
  }
}

export function disconnectPrinter(): boolean {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    return bridge.disconnect() === true;
  } catch {
    return false;
  }
}

export function getConnectionStatus(): boolean {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    return bridge.isConnected() === true;
  } catch {
    return false;
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function buildStrukBytes(data: StrukData, jenis: "customer" | "catatan"): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({ printerModel: "youku-58t" });

  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const labelTipe =
    data.tipePesanan === "TAKE_AWAY"
      ? "=== TAKE AWAY ==="
      : `=== DINE IN${data.catatan ? ` - ${data.catatan}` : ""} ===`;

  const separator = () => encoder.line("-".repeat(COLS));

  encoder.initialize();
  encoder.align("center");
  encoder.bold(true);
  encoder.line("WARKOP SOEKARDJO");
  encoder.bold(false);
  encoder.font("B");
  encoder.line(`${tanggal} ${jam}`);
  encoder.line(data.noTransaksi);
  encoder.font("A");
  encoder.align("left");

  if (data.memberNama) {
    encoder.line(`${data.memberNama}${data.noWa ? ` (${data.noWa})` : ""}`);
  }

  encoder.align("center");
  encoder.bold(true);
  encoder.line(labelTipe);
  encoder.bold(false);
  if (jenis === "catatan") {
    encoder.bold(true);
    encoder.line("=== STRUK CATATAN ===");
    encoder.bold(false);
  }
  encoder.align("left");
  separator();

  for (const item of data.items) {
    const subtotal = formatRupiah(item.subtotal);
    const maxNama = Math.max(1, COLS - subtotal.length - 1);
    encoder.line(alignLine(truncate(item.nama, maxNama), subtotal));
    encoder.font("B");
    encoder.line(`  ${formatRupiah(item.harga)} x ${item.jumlah}`);
    encoder.font("A");
  }

  separator();

  encoder.bold(true);
  encoder.line(alignLine("TOTAL", formatRupiah(data.totalHarga)));
  encoder.bold(false);

  if (data.diskon > 0) {
    encoder.line(alignLine("Diskon", `-${formatRupiah(data.diskon)}`));
  }
  if (data.poinDigunakan > 0) {
    const val =
      data.totalPoin > 0 ? `-${formatRupiah(data.totalPoin)}` : `-${data.poinDigunakan} poin`;
    encoder.line(alignLine("Poin Dipakai", val));
  }
  if (data.tax > 0) {
    encoder.line(alignLine("Tax Card", formatRupiah(data.tax)));
  }
  encoder.line(alignLine("Bayar", formatRupiah(data.totalBayar)));
  encoder.line(alignLine("Metode", metodeLabel(data.metodeBayar)));
  if (data.metodeBayar === "CASH") {
    encoder.line(alignLine("Kembali", formatRupiah(data.kembalian)));
  }

  if (data.poinDidapat > 0) {
    separator();
    encoder.line(alignLine("Poin", `+${data.poinDidapat} poin`));
  }

  separator();
  encoder.align("center");
  encoder.bold(true);
  encoder.line("Terima kasih");
  encoder.bold(false);
  encoder.font("B");
  encoder.line("Barang yang sudah dibeli");
  encoder.line("tidak dapat dikembalikan");

  encoder.newline(4);

  return encoder.encode();
}

export function printStruk(data: StrukData, jenis: "customer" | "catatan"): boolean {
  const bridge = getBridge();
  if (!bridge) {
    throw new Error("Print bridge tidak tersedia");
  }
  const bytes = buildStrukBytes(data, jenis);
  const base64 = uint8ArrayToBase64(bytes);
  const ok = bridge.print(base64);
  if (!ok) {
    throw new Error("Gagal mengirim data ke printer");
  }
  return true;
}
