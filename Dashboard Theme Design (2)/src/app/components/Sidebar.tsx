import { Database, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  impact: number;
}

interface SidebarProps {
  recommendations: Recommendation[];
  onRecommendationClick: (rec: Recommendation) => void;
}

export function Sidebar({ recommendations, onRecommendationClick }: SidebarProps) {
  return (
    <div className="w-[280px] h-full bg-[#F9FAFB] border-r border-[#E5E7EB] p-6 overflow-y-auto">
      {/* Dataset Overview */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-[#DC2626]" />
          <h3 className="font-semibold text-[#111827]">Dataset Overview</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-[#6B7280]">Rows:</span>
            <span className="text-sm text-[#374151] font-medium">12,450</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#6B7280]">Columns:</span>
            <span className="text-sm text-[#374151] font-medium">28</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#6B7280]">Missing values:</span>
            <span className="text-sm text-[#DC2626] font-medium">3.2%</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-[#6B7280]">Skewed features:</span>
            <div className="text-right">
              <div className="text-sm text-[#374151] font-medium">4</div>
              <div className="text-xs text-[#6B7280] mt-1">
                income, age, region, education
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-[#DC2626]" />
          <h3 className="font-semibold text-[#111827]">AI Recommendations</h3>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <button
              key={rec.id}
              onClick={() => onRecommendationClick(rec)}
              className="w-full p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#DC2626] hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#111827] group-hover:text-[#DC2626] transition-colors">
                  {rec.title}
                </h4>
                {rec.impact > 0 ? (
                  <TrendingDown className="h-4 w-4 text-[#10B981] flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-[#DC2626] flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-[#6B7280] mb-3">{rec.reason}</p>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                rec.impact > 0
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'bg-[#DC2626]/10 text-[#DC2626]'
              }`}>
                {rec.impact > 0 ? '-' : '+'}{Math.abs(rec.impact).toFixed(2)} bias
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
