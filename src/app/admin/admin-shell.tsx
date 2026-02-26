"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tag, Users, Flag, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "admin.dashboard" },
  { href: "/admin/deals", icon: Tag, labelKey: "admin.deals" },
  { href: "/admin/users", icon: Users, labelKey: "admin.users" },
  { href: "/admin/reports", icon: Flag, labelKey: "admin.reports" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col max-w-4xl mx-auto">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
          <div className="flex items-center gap-4 h-14 px-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-bold text-lg">{t("admin.title")}</h1>
          </div>
          <nav className="flex border-b">
            {navItems.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px",
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 p-4">{children}</main>
      </div>
    </ToastProvider>
  );
}
