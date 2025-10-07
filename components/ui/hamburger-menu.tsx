'use client';

import { motion } from 'framer-motion';

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
      <div className="w-6 h-5 flex flex-col justify-center items-center">
        <motion.span
          animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block mb-1.5 origin-center"
        />
        <motion.span
          animate={isOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block mb-1.5"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-6 h-0.5 bg-slate-700 dark:bg-slate-300 block origin-center"
        />
      </div>
    </button>
  );
}
