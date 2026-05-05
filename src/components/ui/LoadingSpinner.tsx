"use client";

import React from "react";

interface LoadingSpinnerProps {
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = "Synchronizing Telemetry..." }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl">
      <div className="relative flex flex-col items-center">
        {/* CINEMATIC LOGO CONTAINER */}
        <div className="relative w-40 h-40 mb-10 group">
          {/* HEADLIGHT GLOW EFFECTS */}
          <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-emerald-500 rounded-full blur-2xl animate-pulse opacity-40"></div>
          <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-emerald-500 rounded-full blur-2xl animate-pulse opacity-40 delay-75"></div>

          {/* THE LOGO */}
          <img
            src="/logo-1.png"
            alt="Falcon Tow"
            className="w-full h-full object-contain relative z-10 animate-pulse duration-1000"
          />

          {/* SCANNING BEAM */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="w-full h-[3px] bg-emerald-500 shadow-[0_0_20px_#10b981] absolute top-0 left-0 animate-scan"></div>
          </div>
        </div>

        {/* LOADING TEXT */}
        <div className="flex flex-col items-center gap-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-950">
            {label}
          </span>

          {/* PROGRESS BAR */}
          <div className="w-56 h-1 bg-emerald-50 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 w-full animate-progress rounded-full"></div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(180px); opacity: 0; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan {
          animation: scan 3s infinite ease-in-out;
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
