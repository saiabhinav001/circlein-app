'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
    month: 'space-y-4',
    month_caption: 'flex justify-center pt-1 relative items-center',
    caption_label: 'text-sm font-medium',
    nav: 'space-x-1 flex items-center',
    button_previous: cn(
      buttonVariants({ variant: 'outline' }),
      'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1'
    ),
    button_next: cn(
      buttonVariants({ variant: 'outline' }),
      'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1'
    ),
    month_grid: 'w-full border-collapse space-y-1',
    weekdays: 'flex',
    weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
    week: 'flex w-full mt-2',
    day: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
    day_button: cn(
      buttonVariants({ variant: 'ghost' }),
      'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
    ),
    selected:
      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
    today: 'bg-accent text-accent-foreground',
    outside:
      'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
    disabled: 'text-muted-foreground opacity-50',
    hidden: 'invisible',
  };

  const resolvedClassNames = {
    ...defaultClassNames,
    ...classNames,
    month_caption:
      classNames?.month_caption ?? classNames?.caption ?? defaultClassNames.month_caption,
    button_previous:
      classNames?.button_previous ??
      (classNames?.nav_button || classNames?.nav_button_previous
        ? cn(classNames?.nav_button, classNames?.nav_button_previous)
        : defaultClassNames.button_previous),
    button_next:
      classNames?.button_next ??
      (classNames?.nav_button || classNames?.nav_button_next
        ? cn(classNames?.nav_button, classNames?.nav_button_next)
        : defaultClassNames.button_next),
    month_grid: classNames?.month_grid ?? classNames?.table ?? defaultClassNames.month_grid,
    weekdays: classNames?.weekdays ?? classNames?.head_row ?? defaultClassNames.weekdays,
    weekday: classNames?.weekday ?? classNames?.head_cell ?? defaultClassNames.weekday,
    week: classNames?.week ?? classNames?.row ?? defaultClassNames.week,
    day: classNames?.day ?? classNames?.cell ?? defaultClassNames.day,
    day_button: classNames?.day_button ?? classNames?.day ?? defaultClassNames.day_button,
    selected: classNames?.selected ?? classNames?.day_selected ?? defaultClassNames.selected,
    today: classNames?.today ?? classNames?.day_today ?? defaultClassNames.today,
    outside: classNames?.outside ?? classNames?.day_outside ?? defaultClassNames.outside,
    disabled: classNames?.disabled ?? classNames?.day_disabled ?? defaultClassNames.disabled,
    hidden: classNames?.hidden ?? classNames?.day_hidden ?? defaultClassNames.hidden,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={resolvedClassNames}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
