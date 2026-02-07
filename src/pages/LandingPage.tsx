import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A1628] text-white font-sans">
      <LandingHeader />
      <HeroSection />
      <PainSection />
      <FeaturesGrid />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaFinal />
      <LandingFooter />
    </div>
  );
}
