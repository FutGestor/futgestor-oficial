import { HeroSection } from "@/components/landing/HeroSection";
import { ZigZagFeatures } from "@/components/landing/ZigZagFeatures";
import { GallerySection } from "@/components/landing/GallerySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <ZigZagFeatures />
      <GallerySection />
      <PricingSection />
      <FaqSection />
      <LandingFooter />
    </div>
  );
}
