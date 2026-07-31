export type Rentang = "JAM" | "HARI" | "MINGGU" | "BULAN";

export type TitikGrafik = {
  label: string;
  tanggal: string;
  omset: number;
  transaksi: number;
};

const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_ID_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const OFFSET_WIB_MS = 7 * 3600 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

export function wibParts(date: Date): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
  };
}

export function getIsoWeek(date: Date): { year: number; week: number } {
  const { year, month, day } = wibParts(date);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function isoDowFromParts(year: number, month: number, day: number): number {
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

function wibMidnightUtc(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) - OFFSET_WIB_MS;
}

function startOfWibDay(date: Date): Date {
  const { year, month, day } = wibParts(date);
  return new Date(wibMidnightUtc(year, month, day));
}

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function eachWibDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfWibDay(start);
  const endDay = startOfWibDay(end);
  while (cursor <= endDay) {
    days.push(cursor);
    cursor = addUtcDays(cursor, 1);
  }
  return days;
}

type Agg = { omset: number; transaksi: number };

function aggByKey(
  transactions: Array<{ createdAt: Date; totalHarga: number }>,
  keyFn: (p: { year: number; month: number; day: number; hour: number }) => string
): Map<string, Agg> {
  const map = new Map<string, Agg>();
  for (const t of transactions) {
    const key = keyFn(wibParts(new Date(t.createdAt)));
    const agg = map.get(key) ?? { omset: 0, transaksi: 0 };
    agg.omset += t.totalHarga;
    agg.transaksi += 1;
    map.set(key, agg);
  }
  return map;
}

function formatWeekLabel(monday: Date): string {
  const a = wibParts(monday);
  const b = wibParts(addUtcDays(monday, 6));
  if (a.month === b.month) return `${a.day}–${b.day} ${BULAN_ID[a.month - 1]}`;
  return `${a.day} ${BULAN_ID[a.month - 1]} – ${b.day} ${BULAN_ID[b.month - 1]}`;
}

export function buildGrafikData(
  transactions: Array<{ createdAt: Date; totalHarga: number }>,
  rentang: Rentang,
  dari?: Date,
  sampai?: Date
): TitikGrafik[] {
  const times = transactions.map((t) => new Date(t.createdAt).getTime());
  const minTime = times.length ? Math.min(...times) : null;
  const maxTime = times.length ? Math.max(...times) : null;

  const start = dari ? new Date(dari) : minTime != null ? startOfWibDay(new Date(minTime)) : null;
  const end = sampai ? new Date(sampai) : maxTime != null ? new Date(maxTime) : new Date();

  if (rentang === "JAM") {
    const buckets = Array.from({ length: 24 }, () => ({ omset: 0, transaksi: 0 }));
    for (const t of transactions) {
      const { hour } = wibParts(new Date(t.createdAt));
      buckets[hour].omset += t.totalHarga;
      buckets[hour].transaksi += 1;
    }
    return buckets.map((b, i) => ({
      label: `${pad(i)}:00`,
      tanggal: pad(i),
      omset: b.omset,
      transaksi: b.transaksi,
    }));
  }

  if (start == null) return [];

  const result: TitikGrafik[] = [];

  if (rentang === "BULAN") {
    const byKey = aggByKey(transactions, (p) => `${p.year}-${pad(p.month)}`);
    let year = wibParts(start).year;
    let month = wibParts(start).month;
    const { year: endYear, month: endMonth } = wibParts(end);
    while (year < endYear || (year === endYear && month <= endMonth)) {
      const key = `${year}-${pad(month)}`;
      const agg = byKey.get(key);
      result.push({
        label: `${BULAN_ID_FULL[month - 1]} ${year}`,
        tanggal: key,
        omset: agg?.omset ?? 0,
        transaksi: agg?.transaksi ?? 0,
      });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return result;
  }

  const byKey = aggByKey(transactions, (p) => {
    if (rentang === "HARI") return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
    const { year, week } = getIsoWeek(new Date(wibMidnightUtc(p.year, p.month, p.day)));
    return `${year}-W${pad(week)}`;
  });

  const seenWeeks = new Set<string>();

  for (const day of eachWibDay(start, end)) {
    const { year, month, day: dayOfMonth } = wibParts(day);
    if (rentang === "HARI") {
      const key = `${year}-${pad(month)}-${pad(dayOfMonth)}`;
      const agg = byKey.get(key);
      result.push({
        label: `${dayOfMonth} ${BULAN_ID[month - 1]}`,
        tanggal: key,
        omset: agg?.omset ?? 0,
        transaksi: agg?.transaksi ?? 0,
      });
    } else {
      const { year: wkYear, week } = getIsoWeek(new Date(wibMidnightUtc(year, month, dayOfMonth)));
      const key = `${wkYear}-W${pad(week)}`;
      if (seenWeeks.has(key)) continue;
      seenWeeks.add(key);
      const dow = isoDowFromParts(year, month, dayOfMonth);
      const monday = new Date(wibMidnightUtc(year, month, dayOfMonth) - (dow - 1) * 86400000);
      const agg = byKey.get(key);
      result.push({
        label: formatWeekLabel(monday),
        tanggal: key,
        omset: agg?.omset ?? 0,
        transaksi: agg?.transaksi ?? 0,
      });
    }
  }

  return result;
}
