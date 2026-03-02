import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim — Topla",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">İletişim</h1>
      <p>
        Topla ile ilgili öneri, hata bildirimi veya iş birliği için bizimle iletişime geçebilirsiniz. Tüm geri bildirimler
        uygulamayı geliştirmemize yardımcı olur.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">E-posta</h2>
        <p>
          Bize şu adresten ulaşabilirsiniz:{" "}
          <a href="mailto:eternalegendsinfo@gmail.com" className="underline underline-offset-4">
            eternalegendsinfo@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}

