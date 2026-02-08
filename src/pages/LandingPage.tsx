import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { PainSection } from "@/components/landing/PainSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { SectionCta } from "@/components/landing/SectionCta";
import { ShowcaseDashboard } from "@/components/landing/ShowcaseDashboard";
import { ShowcaseCampeonatos } from "@/components/landing/ShowcaseCampeonatos";
import { ShowcasePresenca } from "@/components/landing/ShowcasePresenca";
import { ShowcaseFinanceiro } from "@/components/landing/ShowcaseFinanceiro";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
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
      <TrustBar />
      <PainSection />
      <SectionCta text="Conhecer planos" />
      <FeaturesGrid />
      <SectionCta text="Começar agora" />
      <ShowcaseDashboard />
      <SectionCta text="Assinar meu plano" />
      <ShowcaseCampeonatos />
      <SectionCta text="Organizar meu time" />
      <ShowcasePresenca />
      <SectionCta text="Conhecer planos" />
      <ShowcaseFinanceiro />
      <SectionCta text="Começar agora" />
      <HowItWorks />
      <SectionCta text="Assinar meu plano" />
      <ComparisonTable />
      <SectionCta text="Organizar meu time" />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaFinal />
      <LandingFooter />
    </div>
  );
}
