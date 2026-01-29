'use client';

import { cn } from '@/lib/utils';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 rounded-lg flex items-center justify-center",
        "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
        "active:scale-95 transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2"
      )}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <span 
          className={cn(
            "w-5 h-0.5 bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-200 origin-center",
            isOpen && "rotate-45 translate-y-[7px]"
          )}
        />
        <span 
          className={cn(
            "w-5 h-0.5 bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-150",
            isOpen && "opacity-0 scale-x-0"
          )}
        />
        <span 
          className={cn(
            "w-5 h-0.5 bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-200 origin-center",
            isOpen && "-rotate-45 -translate-y-[7px]"
          )}
        />
      </div>
    </button>
  );
}
