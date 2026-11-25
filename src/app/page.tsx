import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TelemetryStrip } from "@/components/landing/telemetry-strip";
import { CheckoutShowcase } from "@/components/landing/checkout-showcase";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { CapabilityCards } from "@/components/landing/capability-cards";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingMotion } from "@/components/landing/landing-motion";
import { BackendWarmup } from "@/components/landing/backend-warmup";
import "@/components/landing/landing.css";

export default function LandingPage() {
  return (
    <LandingMotion>
      <div className="suntech-landing relative min-h-screen bg-slate-50 font-sans selection:bg-[#0052FF] selection:text-white">
        <BackendWarmup />
        <HeadroomNavbar />
        <main>
          <HeroSection />
          <TelemetryStrip />
          <CheckoutShowcase />
          <FeatureShowcase />
          <CapabilityCards />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </LandingMotion>
  );
}
