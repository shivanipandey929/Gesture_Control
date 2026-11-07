import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-6 shadow-glow-cyan/20">
        <Compass className="w-10 h-10 animate-spin" />
      </div>

      <h1 className="font-heading font-extrabold text-5xl sm:text-7xl text-white mb-2">404</h1>
      <h2 className="font-heading font-bold text-xl sm:text-2xl text-slate-300 mb-4">
        Destination Not Found
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        The requested spatial interface route does not exist. Use the gesture control nav to return safely home.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-sm hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-glow-cyan"
      >
        <Home className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
};

