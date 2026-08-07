"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  trigger?: ReactNode;
  className?: string;
}

/** Calendar popover matching the detail page's Dates control. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Date",
  trigger,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 rounded-md px-2 text-xs font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="size-3.5" aria-hidden />
            {selected ? format(selected, "MMM d") : placeholder}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
