-- ========================================================
-- RESET DEMO: Hapus semua data hari ini (WIB)
-- Jalankan di Supabase SQL Editor → Run
-- ========================================================

-- 1. Kembalikan poin member dari reward_poin hari ini
UPDATE member m
SET poin = m.poin - sub.total_poin
FROM (
  SELECT member_id, SUM(poin) AS total_poin
  FROM reward_poin
  WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta')
  GROUP BY member_id
) sub
WHERE m.id = sub.member_id;

-- 2. Kembalikan stok menu dari item transaksi hari ini
UPDATE menu m
SET stok = m.stok + sub.total_jumlah
FROM (
  SELECT it.menu_id, SUM(it.jumlah) AS total_jumlah
  FROM item_transaksi it
  JOIN transaksi t ON it.transaksi_id = t.id
  WHERE t.created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta')
  GROUP BY it.menu_id
) sub
WHERE m.id = sub.menu_id;

-- 3. Hapus reward_poin hari ini
DELETE FROM reward_poin
WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta');

-- 4. Hapus item_transaksi hari ini (cascade dari transaksi, tapi explicit lebih aman)
DELETE FROM item_transaksi
WHERE transaksi_id IN (
  SELECT id FROM transaksi
  WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta')
);

-- 5. Hapus transaksi hari ini
DELETE FROM transaksi
WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta');

-- 6. Hapus daily_report hari ini (buka/tutup shift)
DELETE FROM daily_report
WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta');

-- Selesai! Sekarang bisa buka shift baru dari awal.
