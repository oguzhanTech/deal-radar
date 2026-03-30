import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KullanÄ±m ÅartlarÄ± â€” Topla",
};

export default function TermsPage() {
  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">KullanÄ±m ÅartlarÄ±</h1>
      <p>
        Topla&apos;yÄ± kullanarak aÅŸaÄŸÄ±daki temel ÅŸartlarÄ± kabul etmiÅŸ olursunuz. AmaÃ§, topluluk dÃ¼zenini korumak ve kÃ¶tÃ¼ye
        kullanÄ±mÄ± engellemektir.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Topluluk kurallarÄ±</h2>
        <ul className="list-disc list-inside space-y-0.5">
          <li>YanÄ±ltÄ±cÄ±, spam veya zararlÄ± iÃ§erik paylaÅŸmayÄ±n.</li>
          <li>YalnÄ±zca herkes iÃ§in gÃ¼venli ve yasal fÄ±rsatlar ekleyin.</li>
          <li>DiÄŸer kullanÄ±cÄ±larÄ±n gizliliÄŸine ve haklarÄ±na saygÄ± gÃ¶sterin.</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hesap ve iÃ§erik</h2>
        <p>
          HesabÄ±nÄ±z altÄ±nda paylaÅŸtÄ±ÄŸÄ±nÄ±z iÃ§eriklerden siz sorumlusunuz. Topla, topluluk kurallarÄ±nÄ± ihlal eden iÃ§erikleri
          kaldÄ±rma ve hesaplarÄ± sÄ±nÄ±rlandÄ±rma hakkÄ±nÄ± saklÄ± tutar.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hizmette deÄŸiÅŸiklik</h2>
        <p>
          UygulamayÄ± geliÅŸtirmek iÃ§in zaman zaman Ã¶zellikleri deÄŸiÅŸtirebilir veya kaldÄ±rabiliriz. Ã–nemli deÄŸiÅŸiklikler
          olduÄŸunda, uygulama iÃ§i duyurular veya gÃ¼ncelleme notlarÄ± ile bilgilendirme yaparÄ±z.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Reklamlar ve Ã¶demeler</h2>
        <p>
          Topla, ÅŸu an itibarÄ±yla uygulama iÃ§inde Ã¼Ã§Ã¼ncÃ¼ taraf reklam gÃ¶stermez ve uygulama iÃ§i satÄ±n alma (abonelik veya
          Ã¼rÃ¼n satÄ±ÅŸÄ±) sunmaz. Gelecekte bu durumda deÄŸiÅŸiklik olmasÄ± halinde, ÅŸartlar gÃ¼ncellenecek ve kullanÄ±cÄ±lar
          bilgilendirilecektir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Hesap kapatma</h2>
        <p>
          KullanÄ±cÄ±lar, hesaplarÄ±nÄ±n kapatÄ±lmasÄ±nÄ± ve kiÅŸisel verilerinin silinmesini talep edebilir. Bunun iÃ§in gizlilik
          politikamÄ±zda belirtilen iletiÅŸim kanalÄ± Ã¼zerinden bizimle irtibata geÃ§ebilirsiniz. Talebiniz makul bir sÃ¼re
          iÃ§inde deÄŸerlendirilir ve yasal yÃ¼kÃ¼mlÃ¼lÃ¼kler Ã§erÃ§evesinde hesabÄ±nÄ±z kapatÄ±lÄ±r.
        </p>
      </section>
    </div>
  );
}


