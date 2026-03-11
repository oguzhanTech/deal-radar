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
        verileri topladığımızı, bunları nasıl kullandığımızı ve haklarınızı kısaca özetliyoruz.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Toplanan veriler</h2>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Giriş için kullandığınız e-posta adresi</li>
          <li>Oluşturduğunuz fırsatlar, oylar ve yorumlar gibi topluluk etkileşimleri</li>
          <li>Profil bilgileriniz (görünen adınız, puan ve rozet bilgileriniz)</li>
          <li>Uygulamanın iyileştirilmesi için anonim kullanım istatistikleri (Google Analytics aracılığıyla)</li>
          <li>Bildirimler için tarayıcınız üzerinden oluşturulan web push abonelik bilgileri (endpoint ve şifreleme anahtarları)</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Verilerin kullanımı</h2>
        <p>
          Veriler, hesabınızı yönetmek, kötüye kullanımı önlemek, bildirim göndermek ve uygulamayı geliştirmek için
          kullanılır. Verilerinizi üçüncü taraflara satmayız.
        </p>
        <p>
          Topla&apos;da oturum, profil ve fırsat verileriniz Supabase altyapısı üzerinde saklanır. Bu veriler, yalnızca
          Topla hizmetinin sunulması için kullanılır ve yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Analitik ve çerezler</h2>
        <p>
          Uygulamada Google Analytics (gtag.js) kullanıyoruz. Bu araç, hangi sayfaların daha fazla kullanıldığını ve
          uygulamanın nasıl performans gösterdiğini anonim olarak ölçmemize yardımcı olur. Bu kapsamda, IP adresiniz gibi
          bazı teknik bilgiler Google tarafından anonimleştirilmiş veya toplulaştırılmış şekilde işlenebilir.
        </p>
        <p>
          Analitik veriler, kişisel profilinizle birleştirilmez ve yalnızca uygulamayı iyileştirmek için kullanılır.
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
        <h2 className="font-semibold text-foreground text-sm">Bildirimler ve tercihler</h2>
        <p>
          Topla, eklediğiniz veya radarınıza aldığınız fırsatlar için web push bildirimleri gönderebilir. Bildirim
          izni, tarayıcınız tarafından sizden açıkça istenir; siz izin vermeden bildirim gönderilmez.
        </p>
        <p>
          Dilediğiniz zaman tarayıcı veya cihaz ayarlarınızdan Topla bildirimlerini kapatabilir ya da bildirim iznini
          geri çekebilirsiniz. Ayrıca uygulama içinden bildirimleri kapatmanıza yardımcı olan bilgilendirici metinler
          gösterilir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hesabınıza erişim ve silme hakkı</h2>
        <p>
          Hesabınızla ilişkili verilere erişme, bunları düzeltme veya silinmesini talep etme hakkına sahipsiniz. Hesabınızın
          ve kişisel verilerinizin kalıcı olarak silinmesini isterseniz, aşağıdaki e-posta adresi üzerinden bizimle
          iletişime geçebilirsiniz. Talebiniz makul bir süre içinde değerlendirilir ve yasal yükümlülükler çerçevesinde
          hesabınız kapatılır ve kişisel verileriniz kaldırılır veya anonimleştirilir.
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

