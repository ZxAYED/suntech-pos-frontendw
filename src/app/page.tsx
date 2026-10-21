import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TelemetryStrip } from "@/components/landing/telemetry-strip";
import { CheckoutShowcase } from "@/components/landing/checkout-showcase";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { CapabilityCards } from "@/components/landing/capability-cards";
import { FinalCta } from "@/components/landing/final-cta";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden selection:bg-[#0052FF] selection:text-white">
      {/* ── Navigation ── */}
      <HeadroomNavbar />

      {/* ── Section 1: Hero Section (Operations Core & Multi-Branch Preview) ── */}
      <HeroSection />

      {/* ── Section 2: Telemetry & Infrastructure Strip ── */}
      <TelemetryStrip />

      {/* ── Section 3: Checkout Showcase (Catalog & Direct Custom Sale) ── */}
      <CheckoutShowcase />

      {/* ── Section 4: Feature Showcases (Storefront Asset 1 & Stock Audits) ── */}
      <FeatureShowcase />

      {/* ── Section 5: Capability Architecture Bento Grid ── */}
      <CapabilityCards />

      {/* ── Section 6: Authorized Personnel Only Conversion CTA ── */}
      <FinalCta />

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
