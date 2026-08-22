import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { Pricing } from "@/components/marketing/pricing";

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
      </main>
      <PublicFooter />
    </>
  );
}
