import Link from "next/link";
import { FirsatCiniWidget } from "@/components/home/firsat-cini-widget";
import { DEAL_CATEGORIES } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

const QUICK_LINKS: { href: string; labelKey: string }[] = [
  { href: "/search?sort=trending", labelKey: "home.trending" },
  { href: "/search?sort=popular", labelKey: "home.popular" },
  { href: "/search?sort=new", labelKey: "home.newDeals" },
  { href: "/search?sort=endingSoon", labelKey: "home.endingSoon" },
  { href: "/search?hasCoupon=1", labelKey: "home.couponDeals" },
  { href: "/leaderboard", labelKey: "home.leaderboardTitle" },
];

/** Masaüstü ana sayfa sol sütun: hızlı sıralama ve kategori keşfi (mobilde gizli). */
export function HomeDesktopSidebar({ firsatCiniDeals }: { firsatCiniDeals: Deal[] }) {
  const categories = DEAL_CATEGORIES.slice(0, 10);

  return (
    <nav className="space-y-8 pr-1" aria-label={t("home.sidebar.aria")}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("home.sidebar.quick")}
        </p>
        <ul className="space-y-0.5">
          {QUICK_LINKS.map(({ href, labelKey }) => (
            <li key={href}>
              <Link
                href={href}
                prefetch
                className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/90 hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("home.sidebar.categories")}
        </p>
        <ul className="space-y-0.5">
          {categories.map((cat) => (
            <li key={cat}>
              <Link
                href={`/search?category=${encodeURIComponent(cat)}`}
                prefetch
                className="block rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors line-clamp-2 leading-snug cursor-pointer"
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <FirsatCiniWidget deals={firsatCiniDeals} compact className="-mr-3 xl:-mr-4" />
      </div>
    </nav>
  );
}
