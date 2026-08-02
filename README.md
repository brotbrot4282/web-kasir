This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Printer Termal (Rongta RPP02N 58mm)

- Web kasir tidak bisa Bluetooth langsung dari browser. Solusinya: APK wrapper WebView (`android/`) yang memuat `https://warkop-soekardjo.vercel.app/kasir` dan membuka jembatan native **`window.AndroidPrinter`** (Bluetooth SPP) ke halaman.
- `src/lib/printer.ts`: deteksi bridge, `buildStrukBytes()` (ESC/POS via `@point-of-sale/receipt-printer-encoder`, model `youku-58t`, 32 kolom), `printStruk()`, dan fallback iframe bila dibuka dari browser biasa.
- Tombol **Printer** di halaman kasir: tampil hanya jika bridge tersedia (di dalam APK). Hubungkan printer yang sudah di-pairing di sana.
- Catatan: `rule()` di library bermasalah (mojibake di file dist) → gunakan `separator()` (baris `-` manual).

## APK Kasir (Android)

- APK siap pasang: `dist/warkop-kasir-v1.0.apk` (release). Pasang di HP kasir, izinkan "instal dari sumber tak dikenal", pairing printer via Bluetooth HP lalu hubungkan lewat tombol Printer di app.
- Build ulang (perlu Android SDK di `C:\Android`):
  ```bash
  cd android
  .\gradlew.bat assembleRelease
  ```
  Hasil: `android\app\build\outputs\apk\release\app-release.apk`.
- **PENTING — cadangkan keystore**: `android\keystore\warkop-kasir-release.keystore` + `android\keystore.properties` (berisi password, gitignored). Hilang = tidak bisa signing update berikutnya.
