import React from "react";

interface PaeonixLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "brand";
}

export const PaeonixLogo: React.FC<PaeonixLogoProps> = ({
  className = "",
  showText = true,
  size = "md",
  variant = "brand"
}) => {
  // Pixel sizing mapping
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-base", subtitle: "text-[7px]" },
    md: { icon: "w-11 h-11", text: "text-lg", subtitle: "text-[8px]" },
    lg: { icon: "w-16 h-16", text: "text-2xl", subtitle: "text-[10px]" },
    xl: { icon: "w-24 h-24", text: "text-3xl", subtitle: "text-[12px]" }
  };

  const currentSize = sizeMap[size];

  // Tailored CSS classes based on visual variants
  const strokeColor =
    variant === "light"
      ? "stroke-white"
      : variant === "dark"
      ? "stroke-gray-950"
      : "stroke-medical-600";

  const textColor =
    variant === "light"
      ? "text-white"
      : variant === "dark"
      ? "text-gray-950"
      : "text-medical-950";

  const subtextColor =
    variant === "light"
      ? "text-white/70"
      : variant === "dark"
      ? "text-gray-500"
      : "text-medical-700/80";

  const circleBg =
    variant === "light"
      ? "fill-white/10 stroke-white/25"
      : "fill-medical-100/30 stroke-medical-200/50";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center ${currentSize.icon}`}>
        {/* Continuous Line-Art Peony Flower & Rising Phoenix SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform transition-all duration-300 hover:scale-105"
        >
          {/* Polished ambient branding backdrop circle */}
          <circle
            cx="50"
            cy="50"
            r="44"
            className={`${circleBg} transition-colors`}
            strokeWidth="1.5"
          />
          
          {/* Continuous Line Art Path:
              - Left side (x: ~25 to 50): organic, looping layers of the peony rose petals
              - Transition center (x: ~45 to 55): soft flowing nodes
              - Right side (x: ~50 to 85): sweeping upward wings and tail plumes of the rising phoenix */}
          <path
            d="
              M 35,50 
              C 32,42, 36,36, 44,36 
              C 50,36, 54,41, 52,46 
              C 50,52, 42,53, 38,47 
              C 35,43, 39,38, 44,39 
              C 49,39, 52,44, 47,49 
              C 41,54, 30,56, 27,47 
              C 24,40, 29,29, 39,27 
              C 51,25, 63,33, 61,45
              C 59,51, 54,57, 48,59
              C 40,61, 34,57, 33,49
              
              M 48,59
              C 52,61, 56,63, 60,63
              C 64,63, 68,59, 68,53
              C 68,47, 62,43, 66,37
              C 69,33, 76,31, 82,33
              C 84,34, 86,36, 85,38
              C 83,40, 78,40, 75,43
              C 72,46, 74,51, 72,55
              C 70,59, 64,65, 58,67
              C 52,69, 44,67, 38,71
              C 32,75, 28,81, 30,85
              C 31,87, 34,87, 35,84
              C 37,80, 41,77, 46,77
              C 52,77, 58,81, 64,79
              C 70,77, 74,71, 78,65
              C 82,59, 88,51, 84,43
              C 82,40, 79,40, 77,43
              C 74,46, 75,53, 71,57
              C 68,61, 62,63, 58,63
            "
            className={`${strokeColor}`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden Core Ember Spark - represents the restorative phoenix fire */}
          <circle
            cx="66"
            cy="37"
            r="3.5"
            className="fill-amber-400 animate-pulse shadow-md"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-sans font-black tracking-[0.25em] leading-none uppercase ${textColor} ${currentSize.text}`}>
            PAEONIX
          </span>
          <span className={`font-mono text-[9px] font-extrabold tracking-[0.16em] uppercase mt-1 ${subtextColor} ${currentSize.subtitle}`}>
            Clinical Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
