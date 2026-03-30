import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik PolitikasÄ± â€” Topla",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-4 text-sm text-muted-foreground">
      <h1 className="text-xl font-bold text-foreground">Gizlilik PolitikasÄ±</h1>
      <p>
        Topla, topluluk tarafÄ±ndan paylaÅŸÄ±lan fÄ±rsatlarÄ± gÃ¶stermek iÃ§in tasarlanmÄ±ÅŸ bir uygulamadÄ±r. Bu sayfada hangi
        verileri topladÄ±ÄŸÄ±mÄ±zÄ±, bunlarÄ± nasÄ±l kullandÄ±ÄŸÄ±mÄ±zÄ± ve haklarÄ±nÄ±zÄ± kÄ±saca Ã¶zetliyoruz.
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Toplanan veriler</h2>
        <ul className="list-disc list-inside space-y-0.5">
          <li>GiriÅŸ iÃ§in kullandÄ±ÄŸÄ±nÄ±z e-posta adresi</li>
          <li>OluÅŸturduÄŸunuz fÄ±rsatlar, oylar ve yorumlar gibi topluluk etkileÅŸimleri</li>
          <li>Profil bilgileriniz (gÃ¶rÃ¼nen adÄ±nÄ±z, puan ve rozet bilgileriniz)</li>
          <li>UygulamanÄ±n iyileÅŸtirilmesi iÃ§in anonim kullanÄ±m istatistikleri (Google Analytics aracÄ±lÄ±ÄŸÄ±yla)</li>
          <li>Bildirimler iÃ§in tarayÄ±cÄ±nÄ±z Ã¼zerinden oluÅŸturulan web push abonelik bilgileri (endpoint ve ÅŸifreleme anahtarlarÄ±)</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Verilerin kullanÄ±mÄ±</h2>
        <p>
          Veriler, hesabÄ±nÄ±zÄ± yÃ¶netmek, kÃ¶tÃ¼ye kullanÄ±mÄ± Ã¶nlemek, bildirim gÃ¶ndermek ve uygulamayÄ± geliÅŸtirmek iÃ§in
          kullanÄ±lÄ±r. Verilerinizi Ã¼Ã§Ã¼ncÃ¼ taraflara satmayÄ±z.
        </p>
        <p>
          Topla&apos;da oturum, profil ve fÄ±rsat verileriniz Supabase altyapÄ±sÄ± Ã¼zerinde saklanÄ±r. Bu veriler, yalnÄ±zca
          Topla hizmetinin sunulmasÄ± iÃ§in kullanÄ±lÄ±r ve yasal zorunluluklar dÄ±ÅŸÄ±nda Ã¼Ã§Ã¼ncÃ¼ taraflarla paylaÅŸÄ±lmaz.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Analitik ve Ã§erezler</h2>
        <p>
          Uygulamada Google Analytics (gtag.js) kullanÄ±yoruz. Bu araÃ§, hangi sayfalarÄ±n daha fazla kullanÄ±ldÄ±ÄŸÄ±nÄ± ve
          uygulamanÄ±n nasÄ±l performans gÃ¶sterdiÄŸini anonim olarak Ã¶lÃ§memize yardÄ±mcÄ± olur. Bu kapsamda, IP adresiniz gibi
          bazÄ± teknik bilgiler Google tarafÄ±ndan anonimleÅŸtirilmiÅŸ veya toplulaÅŸtÄ±rÄ±lmÄ±ÅŸ ÅŸekilde iÅŸlenebilir.
        </p>
        <p>
          Analitik veriler, kiÅŸisel profilinizle birleÅŸtirilmez ve yalnÄ±zca uygulamayÄ± iyileÅŸtirmek iÃ§in kullanÄ±lÄ±r.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Saklama sÃ¼resi</h2>
        <p>
          HesabÄ±nÄ±zÄ± sildiÄŸinizde, profil bilgileriniz ve kiÅŸisel verileriniz makul bir sÃ¼re iÃ§inde sistemlerimizden
          kaldÄ±rÄ±lÄ±r veya anonimleÅŸtirilir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Bildirimler ve tercihler</h2>
        <p>
          Topla, eklediÄŸiniz veya radarÄ±nÄ±za aldÄ±ÄŸÄ±nÄ±z fÄ±rsatlar iÃ§in web push bildirimleri gÃ¶nderebilir. Bildirim
          izni, tarayÄ±cÄ±nÄ±z tarafÄ±ndan sizden aÃ§Ä±kÃ§a istenir; siz izin vermeden bildirim gÃ¶nderilmez.
        </p>
        <p>
          DilediÄŸiniz zaman tarayÄ±cÄ± veya cihaz ayarlarÄ±nÄ±zdan Topla bildirimlerini kapatabilir ya da bildirim iznini
          geri Ã§ekebilirsiniz. AyrÄ±ca uygulama iÃ§inden bildirimleri kapatmanÄ±za yardÄ±mcÄ± olan bilgilendirici metinler
          gÃ¶sterilir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">HesabÄ±nÄ±za eriÅŸim ve silme hakkÄ±</h2>
        <p>
          HesabÄ±nÄ±zla iliÅŸkili verilere eriÅŸme, bunlarÄ± dÃ¼zeltme veya silinmesini talep etme hakkÄ±na sahipsiniz. HesabÄ±nÄ±zÄ±n
          ve kiÅŸisel verilerinizin kalÄ±cÄ± olarak silinmesini isterseniz, aÅŸaÄŸÄ±daki e-posta adresi Ã¼zerinden bizimle
          iletiÅŸime geÃ§ebilirsiniz. Talebiniz makul bir sÃ¼re iÃ§inde deÄŸerlendirilir ve yasal yÃ¼kÃ¼mlÃ¼lÃ¼kler Ã§erÃ§evesinde
          hesabÄ±nÄ±z kapatÄ±lÄ±r ve kiÅŸisel verileriniz kaldÄ±rÄ±lÄ±r veya anonimleÅŸtirilir.
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground text-sm">Ä°letiÅŸim</h2>
        <p>
          Bu politika ile ilgili sorularÄ±nÄ±z iÃ§in{" "}
          <a href="mailto:eternalegendsinfo@gmail.com" className="underline underline-offset-4">
            eternalegendsinfo@gmail.com
          </a>{" "}
          adresinden bizimle iletiÅŸime geÃ§ebilirsiniz.
        </p>
      </section>
    </div>
  );
}


