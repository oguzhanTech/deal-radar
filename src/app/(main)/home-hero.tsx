import { getHeroDeals } from "./home-sections";
import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import type { HeroDeal } from "@/components/home/home-hero-carousel";

interface HomeHeroProps {
  deals?: HeroDeal[];
}

export async function HomeHero({ deals: initialDeals }: HomeHeroProps = {}) {
  const deals = initialDeals ?? (await getHeroDeals());
  if (!deals.length) return null;
  return <HomeHeroCarousel deals={deals} />;
}

