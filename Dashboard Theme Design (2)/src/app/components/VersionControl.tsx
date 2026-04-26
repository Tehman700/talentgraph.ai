import { Clock, Star } from 'lucide-react';

interface Version {
  id: string;
  name: string;
  timestamp: string;
  biasScore: number;
  isBest?: boolean;
}

interface VersionControlProps {
  versions: Version[];
  selectedVersion: string;
  onVersionSelect: (versionId: string) => void;
}

export function VersionControl({ versions, selectedVersion, onVersionSelect }: VersionControlProps) {
  const getBiasColor = (score: number) => {
    if (score < 0.3) return '#10B981';
    if (score < 0.7) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="h-[45%] bg-[#F9FAFB] border-b border-[#E5E7EB] p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-[#DC2626]" />
        <h3 className="font-semibold text-[#111827]">Version History</h3>
      </div>

      <div className="space-y-3">
        {versions.map((version) => (
          <button
            key={version.id}
            onClick={() => onVersionSelect(version.id)}
            className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
              selectedVersion === version.id
                ? 'bg-white border-[#DC2626] shadow-lg shadow-[#DC2626]/10'
                : 'bg-white border-[#E5E7EB] hover:border-[#DC2626]/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-[#111827]">{version.name}</h4>
                  {version.isBest && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30">
                      <Star className="h-3 w-3 text-[#DC2626] fill-[#DC2626]" />
                      <span className="text-xs text-[#DC2626] font-medium">Best</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">{version.timestamp}</p>
              </div>
              <div
                className="text-xl font-bold"
                style={{ color: getBiasColor(version.biasScore) }}
              >
                {version.biasScore.toFixed(2)}
              </div>
            </div>

            <div className="h-1 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${version.biasScore * 100}%`,
                  backgroundColor: getBiasColor(version.biasScore)
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
