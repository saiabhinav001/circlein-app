'use client';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden relative w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus:outline-none"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div className="w-5 h-4 flex flex-col justify-center items-center gap-1">
        <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
        <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
        <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
      </div>
    </button>
  );
}
