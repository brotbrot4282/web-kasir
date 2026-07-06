import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase URL or key");

const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.storage.from("menu-images").list();
  if (error) { console.error("List error:", error.message); return; }

  if (!data || data.length === 0) { console.log("No files in bucket"); return; }

  console.log("Files in menu-images:");
  for (const f of data) {
    console.log(`  - ${f.name} (${f.metadata?.size ?? "?"} bytes)`);
  }

  const names = data.map((f) => f.name);
  const { error: delErr } = await supabase.storage.from("menu-images").remove(names);
  if (delErr) {
    console.error("Delete error:", delErr.message);
  } else {
    console.log(`Deleted ${names.length} file(s)`);
  }
}

main();
