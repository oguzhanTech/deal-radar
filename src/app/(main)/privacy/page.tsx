import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Topla",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">Gizlilik Politikası</h1>
      <p>
        Topla, topluluk tarafından paylaşılan fırsatları göstermek için tasarlanmış bir uygulamadır. Bu sayfada hangi
        verileri topladığımızı ve bunları nasıl kullandığımızı kısaca özetliyoruz.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Toplanan veriler</h2>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Giriş için kullandığınız e-posta adresi</li>
          <li>Oluşturduğunuz fırsatlar, oylar ve yorumlar gibi topluluk etkileşimleri</li>
          <li>Uygulamanın iyileştirilmesi için anonim kullanım istatistikleri</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Verilerin kullanımı</h2>
        <p>
          Veriler, hesabınızı yönetmek, kötüye kullanımı önlemek ve uygulamayı geliştirmek için kullanılır. Verilerinizi
          üçüncü taraflara satmayız.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Saklama süresi</h2>
        <p>
          Hesabınızı sildiğinizde, profil bilgileriniz ve kişisel verileriniz makul bir süre içinde sistemlerimizden
          kaldırılır veya anonimleştirilir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">İletişim</h2>
        <p>
          Bu politika ile ilgili sorularınız için{" "}
          <a href="mailto:eternalegendsinfo@gmail.com" className="underline underline-offset-4">
            eternalegendsinfo@gmail.com
          </a>{" "}
          adresinden bizimle iletişime geçebilirsiniz.
        </p>
      </section>
    </div>
  );
}

