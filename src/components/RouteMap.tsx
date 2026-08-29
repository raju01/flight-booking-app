"use client";

import { useId, useMemo } from "react";
import { Airport } from "@/types/flight";
import { stylizedPosition } from "@/lib/mapPosition";

export default function RouteMap({ from, to }: { from: Airport; to: Airport }) {
  const pathId = useId();
  const gradientId = useId();

  const { from: fromPos, to: toPos, pathD, midLabel } = useMemo(() => {
    const p1 = stylizedPosition(from.code);
    const p2 = stylizedPosition(to.code);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const controlX = midX - dy * 0.25;
    const controlY = midY + dx * 0.25;

    return {
      from: p1,
      to: p2,
      pathD: `M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`,
      midLabel: { x: midX, y: midY },
    };
  }, [from.code, to.code]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 border border-indigo-100 p-4 overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-40 sm:h-48" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>

        <path
          id={pathId}
          d={pathD}
          fill="none"
          className="stroke-indigo-200"
          strokeWidth="0.6"
          strokeDasharray="1.5 2"
        />
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="0.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset="100"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="2.2s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
            keyTimes="0;1"
          />
        </path>

        <circle cx={fromPos.x} cy={fromPos.y} r="1.6" className="fill-indigo-600" />
        <circle cx={toPos.x} cy={toPos.y} r="1.6" className="fill-fuchsia-500" />

        <text x="0" y="1" textAnchor="middle" fontSize="4">
          ✈️
          <animateMotion
            dur="2.2s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
            keyTimes="0;1"
            rotate="auto"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </text>

        <text
          x={fromPos.x}
          y={fromPos.y - 4}
          textAnchor="middle"
          className="fill-indigo-700"
          fontSize="3.5"
          fontWeight="800"
        >
          {from.code}
        </text>
        <text
          x={toPos.x}
          y={toPos.y - 4}
          textAnchor="middle"
          className="fill-fuchsia-700"
          fontSize="3.5"
          fontWeight="800"
        >
          {to.code}
        </text>
        <text
          x={midLabel.x}
          y={midLabel.y + 6}
          textAnchor="middle"
          className="fill-slate-400"
          fontSize="2.6"
        >
          {from.city} → {to.city}
        </text>
      </svg>
    </div>
  );
}
