import { TrendingDown, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  biasScore: number;
  genderBias: number;
  dataImbalance: number;
  confidence: number;
  biasHistory: number[];
}

export function Navbar({ biasScore, genderBias, dataImbalance, confidence, biasHistory }: NavbarProps) {
  const getBiasLevel = (score: number) => {
    if (score < 0.3) return { label: 'Low Risk', color: '#10B981' };
    if (score < 0.7) return { label: 'Moderate Risk', color: '#F59E0B' };
    return { label: 'High Risk', color: '#EF4444' };
  };

  const biasLevel = getBiasLevel(biasScore);

  return (
    <div className="sticky top-0 z-50 h-[72px] border-b border-[#E5E7EB] bg-white/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-8">
        {/* Left: Project Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm text-[#111827] font-semibold">Bias Detector</div>
              <div className="text-xs text-[#6B7280]">census_data.csv</div>
            </div>
          </div>
        </div>

        {/* Center: Large Bias Score */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold" style={{ color: biasLevel.color }}>
              {biasScore.toFixed(2)}
            </div>
            <div className="text-sm text-[#6B7280] mt-1">{biasLevel.label}</div>
          </div>

          {/* Sparkline */}
          <div className="flex items-end gap-1 h-12">
            {biasHistory.map((value, i) => (
              <div
                key={i}
                className="w-2 bg-[#DC2626] rounded-t"
                style={{
                  height: `${value * 48}px`,
                  opacity: 0.4 + (i / biasHistory.length) * 0.6
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Metric Chips */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280]">Gender Bias:</span>
            <span className="ml-2 text-sm font-semibold text-[#DC2626]">{genderBias.toFixed(2)}</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280]">Imbalance:</span>
            <span className="ml-2 text-sm font-semibold text-[#DC2626]">{dataImbalance.toFixed(2)}</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280]">Confidence:</span>
            <span className="ml-2 text-sm font-semibold text-[#111827]">{confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
