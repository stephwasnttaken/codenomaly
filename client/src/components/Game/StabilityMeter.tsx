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
    pct > 60 ? "bg-white/60" : pct > 30 ? "bg-white/40" : "bg-[var(--color-accent-red)]";

  return (
    <div className="flex flex-col border-t border-white/20 pt-3 mt-3">
      <div className="p-2 border-b border-white/20 mb-2">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
          Stability
        </h3>
        <p className="text-xs text-white/70 mt-0.5">
          {isGlitched ? "Glitched — recovering..." : `${stability}%`}
        </p>
      </div>
      <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/20">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
