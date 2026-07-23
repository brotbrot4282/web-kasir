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

export function convertToStokUnit(
  jumlah: number,
  fromSatuan: string,
  toSatuan: string
): number {
  if (fromSatuan === toSatuan) return jumlah;
  const fromConv = CONVERSION[fromSatuan];
  const toConv = CONVERSION[toSatuan];
  if (!fromConv || !toConv) return jumlah;
  return (jumlah * fromConv.factor) / toConv.factor;
}

export function getAvailableUnits(stokSatuan: string): string[] {
  const units: string[] = [stokSatuan];
  const base = CONVERSION[stokSatuan]?.base;
  if (base) {
    for (const [unit, conv] of Object.entries(CONVERSION)) {
      if (conv.base === base && unit !== stokSatuan) {
        units.push(unit);
      }
    }
  }
  return units;
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
