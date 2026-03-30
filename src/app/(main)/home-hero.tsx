import { buildHeroSlides, fetchHeroAnnouncements, getHeroDeals } from "./home-sections";
import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import type { HeroSlide } from "@/components/home/home-hero-carousel";

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

