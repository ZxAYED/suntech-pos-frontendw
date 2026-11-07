"use client";

import type { ReactNode } from "react";

interface InlineTextProps {
  text: string;
  onSelectTopic?: (topicId: string) => void;
}

export function InlineText({ text, onSelectTopic }: InlineTextProps) {
  if (!text) return null;

  // Regex to match:
  // 1. [Link text](#anchor)
  // 2. **Bold text**
  // 3. (?:see|follow)\s+(?:part\s+(\d+))
  const regex = /\[(.*?)\]\(#(.*?)\)|\*\*(.*?)\*\*|(see|follow)\s+part\s+(\d+)/gi;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      // [Link text](#anchor)
      const linkText = match[1];
      const anchor = match[2];
      nodes.push(
        <button
          key={match.index}
          type="button"
          onClick={() => onSelectTopic?.(anchor)}
          className="font-medium text-[#0052FF] hover:underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 rounded px-0.5 cursor-pointer text-left inline"
        >
          {linkText}
        </button>,
      );
    } else if (match[3] !== undefined) {
      // **Bold text** (matches UI buttons, fields, key labels)
      nodes.push(
        <strong
          key={match.index}
          className="font-semibold text-slate-900 bg-slate-100/90 px-1.5 py-0.5 rounded text-[15px] border border-slate-200/80 inline-block align-baseline"
        >
          {match[3]}
        </strong>,
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      // "see part 13" or "follow part 13"
      const action = match[4];
      const partNum = parseInt(match[5], 10);
      nodes.push(
        <span key={match.index}>
          {action}{" "}
          <button
            type="button"
            onClick={() => {
              // Target slug starts with "#{partNum}-"
              onSelectTopic?.(`part-${partNum}`);
            }}
            className="font-medium text-[#0052FF] hover:underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 rounded px-0.5 cursor-pointer inline"
          >
            part {partNum}
          </button>
        </span>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return <>{nodes}</>;
}
