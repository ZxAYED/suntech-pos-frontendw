"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Compass, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HelpGuideData } from "../types";
import { getTopicIdFromHash, searchTopics } from "../utils";
import { AnimatedTopicPanel } from "./animated-topic-panel";
import { HelpBlockRenderer } from "./help-block-renderer";

interface HelpViewProps {
  guide: HelpGuideData;
}

export function HelpView({ guide }: HelpViewProps) {
  const { topics, quickLinks, intro } = guide;
  const readingPanelRef = useRef<HTMLDivElement>(null);

  // Initialize active topic from window.location.hash or fallback to Start here (topics[0])
  const [activeTopicId, setActiveTopicId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const fromHash = getTopicIdFromHash(window.location.hash, topics);
      if (fromHash) return fromHash;
    }
    return topics[0]?.id || "1-start-here";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDirectory, setShowDirectory] = useState(false);

  // Listen to hashchange and popstate for browser Back/Forward & reload
  useEffect(() => {
    const handleHash = () => {
      const fromHash = getTopicIdFromHash(window.location.hash, topics);
      if (fromHash) {
        setActiveTopicId(fromHash);
      } else {
        // Unknown or empty fragments fall back safely to Start here
        setActiveTopicId(topics[0]?.id || "1-start-here");
      }
    };

    handleHash();

    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, [topics]);

  // Select a topic by ID (or cross-ref like 'part-13')
  const selectTopic = (targetId: string, updateHash = true) => {
    let resolvedId = targetId;

    // Handle "part-X" references
    if (targetId.startsWith("part-")) {
      const partNum = parseInt(targetId.replace("part-", ""), 10);
      const match = topics.find((t) => t.number === partNum);
      if (match) resolvedId = match.id;
    }

    const targetTopic = topics.find((t) => t.id === resolvedId) || topics[0];
    if (!targetTopic) return;

    setActiveTopicId(targetTopic.id);

    if (updateHash && typeof window !== "undefined") {
      if (window.location.hash !== `#${targetTopic.id}`) {
        window.history.pushState(null, "", `#${targetTopic.id}`);
      }
    }

    // Scroll reading panel smoothly into view
    if (readingPanelRef.current) {
      readingPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === activeTopicId) || topics[0];
  }, [activeTopicId, topics]);

  const activeIndex = useMemo(() => {
    return topics.findIndex((t) => t.id === activeTopic.id);
  }, [activeTopic.id, topics]);

  const prevTopic = activeIndex > 0 ? topics[activeIndex - 1] : null;
  const nextTopic = activeIndex < topics.length - 1 ? topics[activeIndex + 1] : null;

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTopics(searchQuery, topics);
  }, [searchQuery, topics]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans">
      {/* Header & Introduction */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0052FF]">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {guide.role === "admin" ? "Admin Documentation" : "Cashier Documentation"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#070B28]">
              {guide.title}
            </h1>
            {intro.paragraphs.map((p, idx) => (
              <p key={idx} className="text-base text-slate-600 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 shrink-0">
            <label htmlFor="help-search-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Search help
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                id="help-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sale, refund, or salary…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-[#0052FF] focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Text Banner */}
        {intro.workflowText && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-slate-800">
            <div className="text-sm md:text-base leading-relaxed font-medium">
              {intro.workflowText}
            </div>
            {intro.extraNote && (
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                {intro.extraNote}
              </div>
            )}
          </div>
        )}

        {/* Directory Toggle (Find what you need) */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDirectory((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0052FF] hover:text-blue-700 cursor-pointer"
            aria-expanded={showDirectory}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Find what you need ({quickLinks.length} topics)</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDirectory && "rotate-180")} />
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click any topic to read its guide
          </span>
        </div>

        {/* Quick Links Table */}
        {showDirectory && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-2xs animate-in fade-in-50 duration-200">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Find what you need
            </div>
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>I want to…</th>
                    <th>Open this part</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {quickLinks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-700 font-medium">
                        {item.want}
                      </td>
                      <td className="px-4 py-2.5 text-right sm:text-left">
                        <button
                          type="button"
                          onClick={() => {
                            selectTopic(item.topicId);
                            setShowDirectory(false);
                          }}
                          className="font-semibold text-[#0052FF] hover:underline underline-offset-2 cursor-pointer"
                        >
                          {item.label}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Display */}
      {searchQuery.trim() && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#070B28]">
              Search results for &ldquo;{searchQuery.trim()}&rdquo;
            </h2>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    selectTopic(result.id);
                    setSearchQuery("");
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-[#0052FF] hover:bg-blue-50/30 cursor-pointer group"
                >
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#0052FF]">
                    Topic {result.number}
                  </span>
                  <span className="text-sm font-semibold text-[#070B28] group-hover:text-[#0052FF]">
                    {result.fullTitle}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Click to view full topic instructions
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center" role="status">
              <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" aria-hidden="true" />
              <p className="text-base font-semibold text-slate-800">
                No help found. Try another word.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Check your spelling or try searching for terms like &ldquo;sale&rdquo;, &ldquo;refund&rdquo;, or &ldquo;salary&rdquo;.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobile Topic Selector (Accessible choose a topic control) */}
      <div className="block md:hidden">
        <label htmlFor="mobile-topic-selector" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Choose a topic
        </label>
        <select
          id="mobile-topic-selector"
          value={activeTopic.id}
          onChange={(e) => selectTopic(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-xs focus:border-[#0052FF] focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Main Two-Column Layout on Desktop */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Compact Vertical Topic Menu on Desktop */}
        <nav
          aria-label="Topics menu"
          className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs max-h-[calc(100vh-120px)] overflow-y-auto"
        >
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-2">
            Topics ({topics.length})
          </div>
          <div className="space-y-1">
            {topics.map((t) => {
              const isActive = t.id === activeTopic.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTopic(t.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                    isActive
                      ? "font-semibold text-[#0052FF]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="activeTopicPill"
                      className="absolute inset-0 rounded-lg bg-blue-50/90 border border-blue-200/60"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold mt-0.5",
                      isActive
                        ? "bg-[#0052FF] text-white"
                        : "bg-slate-100 text-slate-600",
                    )}
                    aria-hidden="true"
                  >
                    {t.number}
                  </span>
                  <span className="relative z-10 leading-snug">{t.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Wide White Reading Panel */}
        <main
          ref={readingPanelRef}
          tabIndex={-1}
          aria-labelledby="reading-topic-title"
          className="flex-1 min-w-0 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-xs focus:outline-none"
        >
          <AnimatedTopicPanel topicKey={activeTopic.id}>
            {/* Active Topic Header */}
            <div className="pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <span>Topic {activeTopic.number} of {topics.length}</span>
              </div>
              <h2 id="reading-topic-title" className="text-2xl md:text-3xl font-bold tracking-tight text-[#070B28]">
                {activeTopic.fullTitle}
              </h2>
            </div>

            {/* Topic Content Blocks */}
            <div className="pt-6 space-y-1">
              {activeTopic.blocks.map((block, idx) => (
                <HelpBlockRenderer key={idx} block={block} onSelectTopic={selectTopic} />
              ))}
            </div>

            {/* Topic Footer Navigation (Prev / Next) */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevTopic ? (
                <button
                  type="button"
                  onClick={() => selectTopic(prevTopic.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Previous: {prevTopic.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextTopic && (
                <button
                  type="button"
                  onClick={() => selectTopic(nextTopic.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Next: {nextTopic.title}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </AnimatedTopicPanel>
        </main>
      </div>
    </div>
  );
}

