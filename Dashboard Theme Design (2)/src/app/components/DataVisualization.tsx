import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { BarChart3, Activity } from 'lucide-react';
import { useState } from 'react';

interface DataVisualizationProps {
  selectedVersion: string;
}

export function DataVisualization({ selectedVersion }: DataVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'comparison'>('distribution');

  // Mock data for distribution
  const distributionData = [
    { range: '20-30', before: 45, after: 52 },
    { range: '30-40', before: 78, after: 85 },
    { range: '40-50', before: 120, after: 125 },
    { range: '50-60', before: 95, after: 98 },
    { range: '60-70', before: 60, after: 65 },
    { range: '70-80', before: 35, after: 38 },
  ];

  // Mock data for group comparison
  const comparisonData = [
    { group: 'Male', income: 65000 },
    { group: 'Female', income: 62000 },
    { group: 'Non-binary', income: 63500 },
  ];

  return (
    <div className="h-[55%] bg-[#F9FAFB] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#DC2626]" />
          <h3 className="font-semibold text-[#111827]">Data Visualization</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-lg border border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'distribution'
                ? 'bg-[#DC2626] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Activity className="h-3 w-3 inline mr-1" />
            Distribution
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'comparison'
                ? 'bg-[#DC2626] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <BarChart3 className="h-3 w-3 inline mr-1" />
            Comparison
          </button>
        </div>
      </div>

      <div className="h-[250px] bg-white rounded-xl border border-[#E5E7EB] p-4">
        {activeTab === 'distribution' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributionData}>
              <defs>
                <linearGradient id="beforeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="afterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="range"
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Area
                type="monotone"
                dataKey="before"
                stroke="#9CA3AF"
                strokeWidth={2}
                fill="url(#beforeGradient)"
                name="Before"
              />
              <Area
                type="monotone"
                dataKey="after"
                stroke="#DC2626"
                strokeWidth={2}
                fill="url(#afterGradient)"
                name="After"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="group"
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Bar
                dataKey="income"
                fill="#DC2626"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        {activeTab === 'distribution' && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#9CA3AF]" />
              <span className="text-[#6B7280]">Before correction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#DC2626]" />
              <span className="text-[#6B7280]">After correction</span>
            </div>
          </>
        )}
        {activeTab === 'comparison' && (
          <div className="text-[#6B7280]">Average income by group (after bias correction)</div>
        )}
      </div>
    </div>
  );
}
