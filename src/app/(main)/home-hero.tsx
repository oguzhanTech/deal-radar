import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import { buildHeroSlides, fetchHeroAnnouncements, getHeroDeals } from "./home-sections";
import type { HeroSlide } from "@/components/home/home-hero-carousel";

/**
 * LCP notu: Anasayfada en büyük üst öğe hero’daki `next/image` (priority).
 * Lighthouse’ta “Largest Contentful Paint element” ile doğrulayın; önceki `dynamic()`
 * hero chunk’ını geciktirdiği için kritik yolu uzatıyordu.
 */

interface HomeHeroProps {
  heroSlides?: HeroSlide[];
}

export async function HomeHero({ heroSlides: initialSlides }: HomeHeroProps = {}) {
  let slides: HeroSlide[];
  if (initialSlides !== undefined) {
    slides = initialSlides;
  } else {
    const [heroDeals, announcements] = await Promise.all([getHeroDeals(), fetchHeroAnnouncements()]);
    slides = buildHeroSlides(announcements, heroDeals);
  }
  if (!slides.length) return null;
  return <HomeHeroCarousel slides={slides} />;
}

