"use client";

import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: readonly TabItem<T>[] | TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  tabClassName?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  tabClassName = "",
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 overflow-x-auto max-w-full ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center justify-center whitespace-nowrap cursor-pointer select-none transition-all ${
              isActive
                ? "bg-white text-[#070B28] font-semibold shadow-xs rounded-md px-3.5 py-1.5 text-xs"
                : "text-slate-600 hover:text-[#070B28] font-medium px-3.5 py-1.5 text-xs rounded-md"
            } ${tabClassName}`}
          >
            {Icon && <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 font-mono text-[11px] ${
                  isActive ? "text-[#0052FF] font-semibold" : "text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
