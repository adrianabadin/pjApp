import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f9fd" }}>
      <header
        className="px-4 h-20 sm:px-6 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#020238" }}
      >
        <div className="flex items-center gap-6">
          <Image
            src="/logo.svg"
            alt="Partido Justicialista Saladillo"
            width={140}
            height={44}
            className="h-10 w-auto"
            priority
          />
          {session.user?.role === "admin" && (
            <Link
              href="/dashboard/users"
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Usuarios
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs hidden sm:block"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {session.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
