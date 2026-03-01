interface StabilityMeterProps {
  stability: number;
  isGlitched: boolean;
}

export function StabilityMeter({ stability, isGlitched }: StabilityMeterProps) {
  const pct =
    typeof stability === "number" && Number.isFinite(stability)
      ? Math.max(0, Math.min(100, stability))
      : 100;
  const color =
    pct > 60 ? "bg-green-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col border-t border-gray-300 pt-3 mt-3">
      <div className="p-2 border-b border-gray-300 mb-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Stability
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {isGlitched ? "Glitched — recovering..." : `${stability}%`}
        </p>
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
