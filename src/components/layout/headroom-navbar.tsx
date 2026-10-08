"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";

export function HeadroomNavbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > 80 && latest > previous) {
      // Scrolling down past threshold -> hide navbar
      setHidden(true);
    } else {
      // Scrolling up or near top -> show navbar
      setHidden(false);
    }

    if (latest > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
          : "bg-white/80 backdrop-blur-xs border-b border-white/20"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo using logo.png */}
        <div className="flex items-center gap-6">
          <BrandLogo size="md" href="/" />
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600">
            <Link
              href="/pos/terminal"
              className="hover:text-[#070B28] transition-colors cursor-pointer"
            >
              Terminal
            </Link>
            <Link
              href="/admin/dashboard"
              className="hover:text-[#070B28] transition-colors cursor-pointer"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/catalog"
              className="hover:text-[#070B28] transition-colors cursor-pointer"
            >
              Catalog
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons with elegant, sleek proportions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-slate-700 hover:text-[#070B28] px-3 py-1.5 transition-colors cursor-pointer"
          >
            Sign In
          </Link>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.8 }}>
            <Link
              href="/pos/terminal"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0052FF] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#0047E0] transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Launch Terminal</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
