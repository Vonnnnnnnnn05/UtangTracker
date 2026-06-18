"use client";

import { signOut } from "firebase/auth";
import { BarChart3, LogOut, ReceiptText, UsersRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/config";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/debts", label: "Debts", icon: WalletCards },
  { href: "/payments", label: "Payments", icon: ReceiptText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <AuthGate>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-line/80 bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link className="focus-ring rounded-md" href="/dashboard">
              <p className="text-lg font-black text-ink">ListaUtang</p>
              <p className="text-xs font-semibold text-muted">Customer debt tracker</p>
            </Link>
            <Button aria-label="Sign out" onClick={handleSignOut} variant="secondary" className="px-3">
              <LogOut aria-hidden="true" size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main id="main" className="flex-1 py-5">
          {children}
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-soft backdrop-blur md:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring flex min-h-14 flex-col items-center justify-center rounded-md px-1 text-[11px] font-bold transition ${
                    active ? "bg-mint text-leaf" : "text-muted hover:bg-mint/70"
                  }`}
                >
                  <Icon aria-hidden="true" size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <aside className="fixed left-4 top-28 hidden w-48 rounded-lg border border-line bg-surface p-2 shadow-soft md:block">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring mb-1 flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition last:mb-0 ${
                  active ? "bg-mint text-leaf" : "text-muted hover:bg-mint/70"
                }`}
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            );
          })}
        </aside>
      </div>
    </AuthGate>
  );
}
