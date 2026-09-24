import React from 'react';
import { Sparkles, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onGoHome: () => void;
  showNewButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome, showNewButton }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 font-bold text-lg text-neutral-900 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <span className="text-2xl">🧩</span>
          <span className="tracking-tight">Reveal Puzzle</span>
        </button>

        {showNewButton && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>New Puzzle</span>
          </button>
        )}
      </div>
    </header>
  );
};
