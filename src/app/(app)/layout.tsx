import Sidebar from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh bg-sage-50">
      <Sidebar
        role={session.role as "OWNER" | "KASIR"}
        shift={session.shift || null}
        user={session.nama}
      />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
