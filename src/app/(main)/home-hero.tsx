import dynamic from "next/dynamic";
import { buildHeroSlides, fetchHeroAnnouncements, getHeroDeals } from "./home-sections";
import type { HeroSlide } from "@/components/home/home-hero-carousel";

const HomeHeroCarousel = dynamic(
  () =>
    import("@/components/home/home-hero-carousel").then((m) => m.HomeHeroCarousel),
  {
    loading: () => (
      <div
        className="relative aspect-[4/3] w-full max-w-3xl mx-auto rounded-2xl bg-muted animate-pulse min-h-[12rem]"
        aria-hidden
      />
    ),
  }
);

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

