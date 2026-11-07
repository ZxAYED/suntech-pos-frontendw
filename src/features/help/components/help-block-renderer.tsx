"use client";

import { BookOpen, Info } from "lucide-react";
import type { HelpBlock } from "../types";
import { InlineText } from "./inline-text";

interface HelpBlockRendererProps {
  block: HelpBlock;
  onSelectTopic?: (topicId: string) => void;
}

export function HelpBlockRenderer({ block, onSelectTopic }: HelpBlockRendererProps) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="text-lg md:text-xl font-bold text-[#070B28] mt-8 mb-4 pt-4 border-t border-slate-100">
          <InlineText text={block.text} onSelectTopic={onSelectTopic} />
        </h3>
      );

    case "paragraph":
      return (
        <p className="text-base text-slate-700 leading-relaxed my-3">
          <InlineText text={block.text} onSelectTopic={onSelectTopic} />
        </p>
      );

    case "steps":
      return (
        <ol className="space-y-3 my-4">
          {block.items.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 text-base text-slate-700 leading-relaxed">
              <span
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[#0052FF] font-semibold text-xs border border-blue-200 mt-0.5"
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <InlineText text={step} onSelectTopic={onSelectTopic} />
              </div>
            </li>
          ))}
        </ol>
      );

    case "list":
      return (
        <ul className="space-y-2.5 my-4 pl-2 text-base text-slate-700 leading-relaxed">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2.5 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <InlineText text={item} onSelectTopic={onSelectTopic} />
              </div>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="my-5 overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-sm md:text-base border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3">
                    <InlineText text={h} onSelectTopic={onSelectTopic} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5 text-slate-800 leading-normal align-top">
                      <InlineText text={cell} onSelectTopic={onSelectTopic} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "remember":
      return (
        <div className="my-4 rounded-lg border border-amber-200/90 bg-amber-50/70 p-4 text-amber-950 flex gap-3 items-start">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-base text-slate-800 leading-relaxed">
            <span className="font-semibold text-amber-900 mr-1.5">Remember:</span>
            <InlineText text={block.text} onSelectTopic={onSelectTopic} />
          </div>
        </div>
      );

    case "example":
      return (
        <div className="my-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4 text-slate-800 flex gap-3 items-start">
          <BookOpen className="h-5 w-5 text-[#0052FF] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-base text-slate-800 leading-relaxed">
            <span className="font-semibold text-blue-900 mr-1.5">{block.label || "Example"}:</span>
            <InlineText text={block.text} onSelectTopic={onSelectTopic} />
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="my-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-slate-800 text-base leading-relaxed">
          <span className="font-semibold text-slate-900 mr-1.5">{block.label}:</span>
          <InlineText text={block.text} onSelectTopic={onSelectTopic} />
        </div>
      );

    default:
      return null;
  }
}

