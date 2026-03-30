import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ä°letiÅŸim â€” Topla",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">Ä°letiÅŸim</h1>
      <p>
        Topla ile ilgili Ã¶neri, hata bildirimi veya iÅŸ birliÄŸi iÃ§in bizimle iletiÅŸime geÃ§ebilirsiniz. TÃ¼m geri bildirimler
        uygulamayÄ± geliÅŸtirmemize yardÄ±mcÄ± olur.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">E-posta</h2>
        <p>
          Bize ÅŸu adresten ulaÅŸabilirsiniz:{" "}
          <a href="mailto:eternalegendsinfo@gmail.com" className="underline underline-offset-4">
            eternalegendsinfo@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}


