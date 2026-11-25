import { ArrowRight, Lock } from "lucide-react";
import { Container } from "@/components/common/container";
import { GlowingButton } from "@/components/common/glowing-button";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { motionTokens } from "@/components/motion/motion-tokens";

export function FinalCta() {
  return (
    <section className="bg-slate-50">
      <Container className="pb-16 sm:pb-24">
        <MotionReveal distance={35} duration={motionTokens.duration.cinematic}
          className="relative isolate overflow-hidden rounded-2xl bg-[#111d3d] px-6 py-10 text-white sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div aria-hidden className="landing-cta-lines" />
          <div className="max-w-xl">
            <h2 className="landing-heading text-white!">Open your workspace.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">Sign in with your staff account to open a register or manage your branch.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0">
            <GlowingButton href="/pos/terminal" size="md">Launch Terminal <ArrowRight size={16} aria-hidden /></GlowingButton>
            <GlowingButton href="/login" variant="dark" size="md"><Lock size={15} aria-hidden /> Admin Sign In</GlowingButton>
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
