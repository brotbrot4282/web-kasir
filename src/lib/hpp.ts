const CONVERSION: Record<string, { base: string; factor: number }> = {
  kg: { base: "gram", factor: 1000 },
  gram: { base: "gram", factor: 1 },
  liter: { base: "ml", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  pcs: { base: "pcs", factor: 1 },
  bungkus: { base: "pcs", factor: 1 },
  pack: { base: "pcs", factor: 1 },
};

export function toBaseUnit(
  jumlah: number,
  satuan: string
): { jumlah: number; satuan: string } {
  const conv = CONVERSION[satuan];
  if (!conv) return { jumlah, satuan };
  return { jumlah: jumlah * conv.factor, satuan: conv.base };
}

export function hitungHPP(
  resep: { jumlah: number; stok: { hargaBahan: number; satuan: string } }[]
): number {
  return resep.reduce((total, r) => total + r.jumlah * r.stok.hargaBahan, 0);
}

export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}
