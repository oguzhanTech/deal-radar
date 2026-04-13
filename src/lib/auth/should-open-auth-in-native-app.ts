/**
 * E-posta doğrulama: gerçek masaüstü tarayıcıda web tamamlansın;
 * mobil / tablette Android App Links ile uygulama açılabilsin.
 *
 * "Masaüstü sitesi iste" genelde masaüstü UA döndürür → web yolu seçilir.
 */
export function shouldOpenAuthInNativeApp(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;

  const looksLikeDesktopComputer =
    /\b(Windows NT|Macintosh|X11; Linux x86_64|X11; CrOS)\b/i.test(ua) && !/\bMobile\b/i.test(ua);
  if (looksLikeDesktopComputer) return false;

  if (navigator.maxTouchPoints > 0 && /\bMacintosh\b/i.test(ua)) {
    return true;
  }

  if (/Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  return false;
}
