-- ========================================================
-- RESET FULL: Hapus semua data transaksi & update users
-- Jalankan di Supabase SQL Editor → Run
-- ========================================================
-- Yang dihapus: reward_poin, item_transaksi, resep, riwayat_harga,
--               transaksi, daily_report, menu, stok, member
-- Yang dipertahankan: kategori, users (di-update), pengaturan_poin, pengaturan_pembayaran
-- ========================================================

-- 1. Hapus reward_poin (FK ke member & transaksi)
DELETE FROM reward_poin;

-- 2. Hapus item_transaksi (FK ke transaksi & menu)
DELETE FROM item_transaksi;

-- 3. Hapus resep (FK ke menu & stok)
DELETE FROM resep;

-- 4. Hapus riwayat_harga (FK ke stok)
DELETE FROM riwayat_harga;

-- 5. Hapus transaksi (FK ke member)
DELETE FROM transaksi;

-- 6. Hapus daily_report (FK ke users - users tetap dipertahankan)
DELETE FROM daily_report;

-- 7. Hapus menu (FK ke kategori)
DELETE FROM menu;

-- 8. Hapus stok
DELETE FROM stok;

-- 9. Hapus member
DELETE FROM member;

-- ========================================================
-- UPDATE USERS: Ganti username & password
-- ========================================================

-- Update admin@warmindo → admin@soekardjo
UPDATE users
SET username = 'admin@soekardjo',
    password = '$2b$12$QpNVFnQOxL1fC.CtMyCuT.w2I3kl3vHZt69beuC.UJeUMH/QbLXRW',
    updated_at = NOW()
WHERE username = 'admin@warmindo';

-- Update kasir1@warmindo → kasir1@soekardjo
UPDATE users
SET username = 'kasir1@soekardjo',
    password = '$2b$12$QpNVFnQOxL1fC.CtMyCuT.w2I3kl3vHZt69beuC.UJeUMH/QbLXRW',
    updated_at = NOW()
WHERE username = 'kasir1@warmindo';

-- Update kasir2@warmindo → kasir2@soekardjo
UPDATE users
SET username = 'kasir2@soekardjo',
    password = '$2b$12$QpNVFnQOxL1fC.CtMyCuT.w2I3kl3vHZt69beuC.UJeUMH/QbLXRW',
    updated_at = NOW()
WHERE username = 'kasir2@warmindo';

-- Update dapur@warmindo → dapur@soekardjo
UPDATE users
SET username = 'dapur@soekardjo',
    password = '$2b$12$QpNVFnQOxL1fC.CtMyCuT.w2I3kl3vHZt69beuC.UJeUMH/QbLXRW',
    updated_at = NOW()
WHERE username = 'dapur@warmindo';

-- ========================================================
-- SELESAI! 
-- ========================================================
-- User baru:
--   admin@soekardjo   / soekardjo123 (Role: OWNER)
--   kasir1@soekardjo  / soekardjo123 (Role: KASIR, Shift 1)
--   kasir2@soekardjo  / soekardjo123 (Role: KASIR, Shift 2)
--   dapur@soekardjo   / soekardjo123 (Role: DAPUR)
--
-- Kategori tetap ada (Kopi, Non Kopi, Makanan)
-- Client perlu input ulang: Menu, Stok, Resep
-- Pengaturan poin & tax diatur manual oleh client
-- ========================================================
