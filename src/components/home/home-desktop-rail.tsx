import Link from "next/link";
import { EditorPickWidget } from "@/components/home/editor-pick-widget";
import { DealCard } from "@/components/deals/deal-card";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

export type EditorPickRailData = { deal: Deal; editorName: string | null } | null;

interface HomeDesktopRailProps {
  editorPick: EditorPickRailData;
  mixedDeals: Deal[];
}

/** Masaüstü ana sayfa sağ sütun: editör seçimi + karışık keşif listesi. */
export function HomeDesktopRail({ editorPick, mixedDeals }: HomeDesktopRailProps) {
  const hasMixed = mixedDeals.length > 0;
  if (!editorPick && !hasMixed) return null;

  return (
    <div
      className="space-y-8 sticky top-20 self-start overflow-x-hidden pb-8 min-w-0"
      aria-label={t("home.rail.aria")}
    >
      {editorPick ? (
        <EditorPickWidget
          deal={editorPick.deal}
          editorQuote={editorPick.deal.editor_pick_quote ?? null}
          editorName={editorPick.editorName}
          sectionClassName="px-0"
          density="rail"
        />
      ) : null}
      {hasMixed ? (
        <section className="space-y-3 min-w-0">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <span className="text-base leading-none" aria-hidden>
              ✨
            </span>
            {t("home.rail.discover")}
          </h3>
          <div className="grid gap-2 min-w-0">
            {mixedDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} compact compactLayout="rail" />
            ))}
          </div>
          <Link
            href="/search"
            prefetch
            className="text-xs font-semibold text-primary hover:underline inline-block"
          >
            {t("common.seeAll")}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
