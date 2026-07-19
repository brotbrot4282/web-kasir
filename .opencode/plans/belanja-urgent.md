# Rencana: Fitur Barang Urgent saat Tutup Shift

## Overview
Menambah kolom "Barang Urgent" di modal tutup shift — list dinamis dengan nama barang + nominal (Rp).

## Changes

### 1. Prisma Schema
**File:** `prisma/schema.prisma`

Tambah field ke model `DailyReport` (setelah `catatan`):
```prisma
belanjaUrgent  Json?    @map("belanja_urgent")
```

Jalankan: `npx prisma migrate dev --name add_belanja_urgent`

---

### 2. Kasir Page — State & UI
**File:** `src/app/(app)/kasir/page.tsx`

#### Hapus unused state (line 48-49):
```diff
- const [closingEsBatu, setClosingEsBatu] = useState("");
- const [closingCup, setClosingCup] = useState("");
```

#### Tambah state baru:
```ts
const [belanjaUrgentItems, setBelanjaUrgentItems] = useState<Array<{ nama: string; nominal: number }>>([]);
```

#### Tambah helper functions:
```ts
const addBelanjaUrgent = () => setBelanjaUrgentItems([...belanjaUrgentItems, { nama: "", nominal: 0 }]);
const removeBelanjaUrgent = (idx: number) => setBelanjaUrgentItems(belanjaUrgentItems.filter((_, i) => i !== idx));
const updateBelanjaUrgent = (idx: number, field: "nama" | "nominal", value: string | number) => {
  const items = [...belanjaUrgentItems];
  items[idx] = { ...items[idx], [field]: value };
  setBelanjaUrgentItems(items);
};
const totalBelanjaUrgent = belanjaUrgentItems.reduce((sum, item) => sum + (item.nominal || 0), 0);
```

#### Tambah di closing modal (SEBELUM textarea "Catatan"):
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="text-xs font-medium text-sage-500">Barang Urgent</label>
    <button
      type="button"
      onClick={addBelanjaUrgent}
      className="text-xs font-medium text-sage-600 hover:text-sage-800 transition-colors"
    >
      + Tambah
    </button>
  </div>
  {belanjaUrgentItems.length > 0 && (
    <div className="space-y-2">
      {belanjaUrgentItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={item.nama}
            onChange={(e) => updateBelanjaUrgent(idx, "nama", e.target.value)}
            placeholder="Nama barang"
            className="flex-1 border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 bg-white"
          />
          <div className="relative w-32">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sage-400">Rp</span>
            <input
              type="text"
              value={item.nominal ? item.nominal.toLocaleString("id-ID") : ""}
              onChange={(e) => updateBelanjaUrgent(idx, "nominal", parseInt(e.target.value.replace(/\D/g, "")) || 0)}
              placeholder="0"
              className="w-full border border-sage-200 rounded-lg pl-8 pr-2 py-2 text-sm text-right text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => removeBelanjaUrgent(idx)}
            className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex justify-end">
        <span className="text-xs font-medium text-sage-500">
          Total Urgent: <span className="text-sage-700">{formatRupiah(totalBelanjaUrgent)}</span>
        </span>
      </div>
    </div>
  )}
</div>
```

#### Reset state setelah tutup shift berhasil:
Tambah `setBelanjaUrgentItems([]);` di bagian reset closing (setelah `setShowClosing(false)`)

#### Update submit handler:
Kirim `belanjaUrgent` di POST body:
```ts
belanjaUrgent: belanjaUrgentItems.length > 0 ? belanjaUrgentItems : null
```

---

### 3. Closing API
**File:** `src/app/api/closing/route.ts`

#### POST handler:
Terima `belanjaUrgent` dari body:
```ts
const { catatan, belanjaUrgent } = body;
```

Tambah ke update data:
```ts
belanjaUrgent: belanjaUrgent || null,
```

#### GET handler:
Pastikan `belanjaUrgent` di-include di response (sudah otomatis karena select all).

---

### 4. Laporan Page
**File:** `src/app/(app)/admin/laporan/page.tsx`

Tampilkan belanja urgent di detail closing report:
- Judul: "Barang Urgent"
- List item: nama — nominal
- Total belanja urgent

---

### 5. Cleanup
- Hapus `closingEsBatu` dan `closingCup` state yang unused (line 48-49)
- Hapus import/setter yang terkait jika ada

---

## Testing
1. Buka shift dengan uang awal
2. Buat beberapa transaksi
3. Tutup shift — tambah beberapa barang urgent
4. Cek laporan owner — belanja urgent harus tampil
5. Cek DB — field `belanja_urgent` harus berisi JSON array
