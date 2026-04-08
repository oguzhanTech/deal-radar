import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları — Topla",
};

export default function TermsPage() {
  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">Kullanım Şartları</h1>
      <p>
        Topla&apos;yı kullanarak aşağıdaki temel şartları kabul etmiş olursunuz. Amaç, topluluk düzenini korumak ve kötüye
        kullanımı engellemektir.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Topluluk kuralları</h2>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Yanıltıcı, spam veya zararlı içerik paylaşmayın.</li>
          <li>Yalnızca herkes için güvenli ve yasal fırsatlar ekleyin.</li>
          <li>Diğer kullanıcıların gizliliğine ve haklarına saygı gösterin.</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hesap ve içerik</h2>
        <p>
          Hesabınız altında paylaştığınız içeriklerden siz sorumlusunuz. Topla, topluluk kurallarını ihlal eden içerikleri
          kaldırma ve hesapları sınırlandırma hakkını saklı tutar.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hizmette değişiklik</h2>
        <p>
          Uygulamayı geliştirmek için zaman zaman özellikleri değiştirebilir veya kaldırabiliriz. Önemli değişiklikler
          olduğunda, uygulama içi duyurular veya güncelleme notları ile bilgilendirme yaparız.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Reklamlar ve ödemeler</h2>
        <p>
          Topla, şu an itibarıyla uygulama içinde üçüncü taraf reklam göstermez ve uygulama içi satın alma (abonelik veya
          ürün satışı) sunmaz. Gelecekte bu durumda değişiklik olması halinde, şartlar güncellenecek ve kullanıcılar
          bilgilendirilecektir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hesap kapatma</h2>
        <p>
          Kullanıcılar, hesaplarının kapatılmasını ve kişisel verilerinin silinmesini talep edebilir. Bunun için gizlilik
          politikamızda belirtilen iletişim kanalı üzerinden bizimle irtibata geçebilirsiniz. Talebiniz makul bir süre
          içinde değerlendirilir ve yasal yükümlülükler çerçevesinde hesabınız kapatılır.
        </p>
      </section>
    </div>
  );
}


