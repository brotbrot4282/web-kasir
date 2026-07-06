const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
const FONNTE_URL = "https://api.fonnte.com/send";

export async function kirimWA(noWa: string, pesan: string) {
  if (!FONNTE_API_KEY) {
    console.warn("FONNTE_API_KEY not set, skipping WA");
    return null;
  }
  const res = await fetch(FONNTE_URL, {
    method: "POST",
    headers: {
      Authorization: FONNTE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target: noWa, message: pesan, delay: "0" }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.reason || "Gagal kirim WA");
  }
  return res.json();
}
