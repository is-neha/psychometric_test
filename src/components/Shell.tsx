import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "./ThemeToggle";

export function Shell({
  username,
  role,
  children,
}: {
  username: string;
  role: "ADMIN" | "USER";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="border-b border-sky-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-sky-950 dark:text-slate-100">
            Psychometric Test
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
              {username} · {role === "ADMIN" ? "Administrator" : "User"}
            </span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
