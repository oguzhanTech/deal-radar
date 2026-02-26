import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-bold mb-2">{t("notFound.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("notFound.description")}</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium"
      >
        {t("notFound.goHome")}
      </Link>
    </div>
  );
}
