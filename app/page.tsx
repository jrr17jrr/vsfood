import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { PrintSection } from "@/components/marketing/print-section";
import { PanelShowcase } from "@/components/marketing/panel-showcase";
import { CustomizationShowcase } from "@/components/marketing/customization-showcase";
import { PaymentsSection } from "@/components/marketing/payments-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <PrintSection />
        <PanelShowcase />
        <CustomizationShowcase />
        <PaymentsSection />
        <DemoSection />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <PublicFooter />
    </>
  );
}
