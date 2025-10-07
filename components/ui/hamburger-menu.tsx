'use client';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden relative w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus:outline-none"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div className="w-6 h-5 flex flex-col justify-center items-center gap-1.5">
        <span className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
        <span className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
        <span className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block rounded-full" />
      </div>
    </button>
  );
}
