"use client";

import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

const presets = [
  { label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
  { label: "This week", range: () => ({ from: startOfWeek(new Date()), to: new Date() }) },
  { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last 30 days", range: () => ({ from: addDays(new Date(), -29), to: new Date() }) },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const label =
    value?.from && value?.to
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d")}`
      : "Select dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[220px] justify-start">
          <CalendarRange className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto">
        <div className="mb-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              size="sm"
              variant="outline"
              onClick={() => {
                onChange(preset.range());
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
