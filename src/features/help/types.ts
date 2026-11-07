// Type definitions for SunTech POS Help System
// Derived mechanically from editorial sources:
// - docs/SunTech_Admin_Help_Content.md
// - docs/SunTech_Cashier_Help_Content.md

export interface HelpTableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface HelpStepsBlock {
  type: "steps";
  items: string[];
}

export interface HelpListBlock {
  type: "list";
  items: string[];
}

export interface HelpHeadingBlock {
  type: "heading";
  level: 3;
  text: string;
}

export interface HelpParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface HelpRememberBlock {
  type: "remember";
  text: string;
}

export interface HelpExampleBlock {
  type: "example";
  label?: string;
  text: string;
}

export interface HelpCalloutBlock {
  type: "callout";
  label: string;
  text: string;
}

export type HelpBlock =
  | HelpHeadingBlock
  | HelpParagraphBlock
  | HelpStepsBlock
  | HelpListBlock
  | HelpTableBlock
  | HelpRememberBlock
  | HelpExampleBlock
  | HelpCalloutBlock;

export interface HelpTopic {
  id: string; // URL anchor slug, e.g. "1-start-here", "3-catalog--add-and-manage-items"
  number: number;
  title: string; // e.g. "Start here"
  fullTitle: string; // e.g. "1. Start here"
  blocks: HelpBlock[];
  searchIndex: string; // plain text of all content for fast zero-dependency local search
}

export interface QuickLink {
  want: string;
  label: string;
  topicId: string;
}

export interface HelpGuideData {
  role: "admin" | "cashier";
  title: string; // "Help — Admin" | "Help — Cashier"
  sourceDoc: string; // "docs/SunTech_Admin_Help_Content.md"
  intro: {
    paragraphs: string[];
    workflowText: string;
    extraNote?: string;
  };
  quickLinks: QuickLink[];
  topics: HelpTopic[];
}

