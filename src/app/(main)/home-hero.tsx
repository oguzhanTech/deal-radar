import { getHeroDeals } from "./home-sections";
import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";

export async function HomeHero() {
  const deals = await getHeroDeals();
  if (!deals.length) return null;
  return <HomeHeroCarousel deals={deals} />;
}

