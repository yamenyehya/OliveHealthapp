import React, { useRef, useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ClockWheelPickerProps {
  value: number; // 3 to 60
  onChange: (value: number) => void;
  colorTheme?: "emerald" | "medical";
}

export default function ClockWheelPicker({
  value,
  onChange,
  colorTheme = "emerald",
}: ClockWheelPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const themeColors = {
    emerald: {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      stroke: "#10b981", // emerald-500
      strokeLight: "#a7f3d0", // emerald-200
      glow: "shadow-emerald-500/20",
    },
    medical: {
      text: "text-medical-600",
      bg: "bg-medical-50",
      border: "border-medical-100",
      stroke: "#0ea5e9", // medical/sky-500 equivalent
      strokeLight: "#bae6fd", // sky-200 equivalent
      glow: "shadow-medical-500/20",
    },
  };

  const activeTheme = themeColors[colorTheme] || themeColors.emerald;

  // Radius of active selection arc
  const radius = 70;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dashoffset for arc length representing current read time
  // Minimum of 3m, maximum of 60m
  const percentage = Math.max(3, Math.min(60, value)) / 60;
  const strokeDashoffset = circumference * (1 - percentage);

  // Convert pointer event to minute value (3 to 60)
  const handlePointerAction = (e: React.PointerEvent<SVGSVGElement> | PointerEvent) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    // Calculate angle in radians clockwise from 12 o'clock (-PI/2)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    
    // Adjust to make 0 deg be 12 o'clock, increasing clockwise
    let adjustedDeg = angleDeg + 90;
    if (adjustedDeg < 0) {
      adjustedDeg += 360;
    }
    
    // Map 360 degrees to 60 minutes
    let minutes = Math.round((adjustedDeg / 360) * 60);
    if (minutes === 0) {
      minutes = 60; // 12 o'clock represents 60m
    }
    
    // Clamp between 3 and 60 minutes
    const finalVal = Math.max(3, Math.min(60, minutes));
    onChange(finalVal);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
    handlePointerAction(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    handlePointerAction(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      setIsDragging(false);
      svgRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  // Generate clock hourly markers (1 to 12)
  const clockNumbers = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  return (
    <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-3xl shadow-2xs select-none">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Estimate Read Time
        </span>
      </div>

      <div className="relative w-48 h-48">
        {/* Interactive SVG Wheel */}
        <svg
          id="clock-wheel-picker"
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-full h-full cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Subtle Outer Glow & shadow */}
          <circle cx={cx} cy={cy} r="95" fill="#fafafa" stroke="#f1f5f9" strokeWidth="1" />

          {/* Clock Dial Background Rim */}
          <circle
            cx={cx}
            cy={cy}
            r="82"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="6"
          />

          {/* Clock Active Progress Arc Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Duration Filled Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={activeTheme.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-75"
          />

          {/* Hourly Ticks around the clock */}
          {Array.from({ length: 60 }).map((_, index) => {
            const angle = (index * 6 * Math.PI) / 180;
            const isFiveMin = index % 5 === 0;
            const length = isFiveMin ? 8 : 4;
            const rStart = 82 - length;
            const rEnd = 82;
            
            const x1 = cx + rStart * Math.sin(angle);
            const y1 = cy - rStart * Math.cos(angle);
            const x2 = cx + rEnd * Math.sin(angle);
            const y2 = cy - rEnd * Math.cos(angle);

            return (
              <line
                key={`tick-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isFiveMin ? "#94a3b8" : "#cbd5e1"}
                strokeWidth={isFiveMin ? 1.5 : 1}
              />
            );
          })}

          {/* Circular Minute Labels inside the clock */}
          {clockNumbers.map((num) => {
            const angle = (num * 6 * Math.PI) / 180;
            // Radius where numbers are placed
            const numRadius = 50;
            const x = cx + numRadius * Math.sin(angle);
            const y = cy - numRadius * Math.cos(angle) + 3; // +3 for vertical centering alignment

            const isSelected = value >= num - 2 && value <= num + 2;

            return (
              <text
                key={`num-${num}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="8"
                fontWeight={isSelected ? "bold" : "normal"}
                fill={isSelected ? activeTheme.stroke : "#64748b"}
                className="select-none pointer-events-none"
              >
                {num}
              </text>
            );
          })}

          {/* Draggable Drag Knob (Handle) */}
          {(() => {
            const handleAngle = ((value / 60) * 360 - 90) * (Math.PI / 180);
            const handleX = cx + radius * Math.cos(handleAngle);
            const handleY = cy + radius * Math.sin(handleAngle);

            return (
              <g className="cursor-grab active:cursor-grabbing">
                {/* Knob shadow */}
                <circle
                  cx={handleX}
                  cy={handleY}
                  r="12"
                  fill="#000000"
                  fillOpacity="0.1"
                />
                {/* Outer Knob */}
                <circle
                  cx={handleX}
                  cy={handleY}
                  r="9"
                  fill="#ffffff"
                  stroke={activeTheme.stroke}
                  strokeWidth="3.5"
                />
                {/* Inner Knob core */}
                <circle
                  cx={handleX}
                  cy={handleY}
                  r="3.5"
                  fill={activeTheme.stroke}
                />
              </g>
            );
          })()}
        </svg>

        {/* Digital display readout in the center of the clock wheel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-3xl font-extrabold font-mono tracking-tighter ${activeTheme.text}`}>
            {value}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider -mt-1">
            min read
          </span>
        </div>
      </div>

      {/* Manual selection buttons at the bottom for accessibility */}
      <div className="flex items-center gap-3 mt-3 w-full">
        <button
          type="button"
          onClick={() => onChange(Math.max(3, value - 1))}
          className="flex-1 py-1 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg text-[10px] font-bold transition-all border border-gray-100"
        >
          - 1m
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(60, value + 1))}
          className="flex-1 py-1 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg text-[10px] font-bold transition-all border border-gray-100"
        >
          + 1m
        </button>
      </div>
    </div>
  );
}
