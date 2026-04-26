import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { X, Filter, Users, TrendingUp } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  occupation: string;
  sector: string;
  education: 'none' | 'primary' | 'secondary' | 'tertiary';
  experienceYears: number;
  skills: string[];
  lat: number;
  lng: number;
  matchScore?: number;
}

interface CountryData {
  name: string;
  code: string;
  informalEmploymentPct: number;
  avgMonthlyWageUSD: number;
  workingPovertyRate: number;
  youthUnemploymentPct: number;
}

const workers: Worker[] = [
  // Uganda
  { id: '1', name: 'Amara Nakato', country: 'Uganda', countryCode: 'UGA', occupation: 'Market Stall Vendor', sector: 'Wholesale & Retail Trade', education: 'primary', experienceYears: 8, skills: ['inventory management', 'crop cultivation', 'customer service'], lat: 0.3476, lng: 32.5825, matchScore: 0.91 },
  { id: '2', name: 'Moses Okello', country: 'Uganda', countryCode: 'UGA', occupation: 'Mobile Phone Repair', sector: 'ICT Services', education: 'secondary', experienceYears: 5, skills: ['phone screen replacement', 'soldering', 'troubleshooting'], lat: 0.3136, lng: 32.5811, matchScore: 0.85 },
  { id: '3', name: 'Grace Namutebi', country: 'Uganda', countryCode: 'UGA', occupation: 'Farmer & Trader', sector: 'Agriculture', education: 'primary', experienceYears: 12, skills: ['crop rotation', 'soil management', 'market negotiation'], lat: 1.3733, lng: 32.2903, matchScore: 0.88 },

  // Bangladesh
  { id: '4', name: 'Fatima Rahman', country: 'Bangladesh', countryCode: 'BGD', occupation: 'Garment Worker', sector: 'Manufacturing', education: 'secondary', experienceYears: 6, skills: ['sewing', 'quality control', 'pattern cutting'], lat: 23.8103, lng: 90.4125, matchScore: 0.82 },
  { id: '5', name: 'Rahim Khan', country: 'Bangladesh', countryCode: 'BGD', occupation: 'Rickshaw Driver', sector: 'Transportation', education: 'primary', experienceYears: 10, skills: ['navigation', 'customer service', 'vehicle maintenance'], lat: 23.7461, lng: 90.3742, matchScore: 0.76 },
  { id: '6', name: 'Nazia Begum', country: 'Bangladesh', countryCode: 'BGD', occupation: 'Street Food Vendor', sector: 'Wholesale & Retail Trade', education: 'primary', experienceYears: 7, skills: ['food preparation', 'hygiene standards', 'cash handling'], lat: 22.3569, lng: 91.7832, matchScore: 0.79 },

  // Kenya
  { id: '7', name: 'James Mwangi', country: 'Kenya', countryCode: 'KEN', occupation: 'Boda Boda Operator', sector: 'Transportation', education: 'secondary', experienceYears: 4, skills: ['motorcycle repair', 'navigation', 'customer relations'], lat: -1.2921, lng: 36.8219, matchScore: 0.74 },
  { id: '8', name: 'Esther Wanjiru', country: 'Kenya', countryCode: 'KEN', occupation: 'Market Trader', sector: 'Wholesale & Retail Trade', education: 'primary', experienceYears: 9, skills: ['inventory tracking', 'negotiation', 'record keeping'], lat: -1.2864, lng: 36.8172, matchScore: 0.87 },

  // Nigeria
  { id: '9', name: 'Chioma Okafor', country: 'Nigeria', countryCode: 'NGA', occupation: 'Hairdresser', sector: 'Personal Services', education: 'secondary', experienceYears: 6, skills: ['hair styling', 'customer service', 'chemical treatments'], lat: 6.5244, lng: 3.3792, matchScore: 0.81 },
  { id: '10', name: 'Tunde Adeyemi', country: 'Nigeria', countryCode: 'NGA', occupation: 'Electronics Repair', sector: 'ICT Services', education: 'tertiary', experienceYears: 8, skills: ['circuit diagnosis', 'soldering', 'device configuration'], lat: 6.4541, lng: 3.3947, matchScore: 0.89 },

  // India
  { id: '11', name: 'Lakshmi Devi', country: 'India', countryCode: 'IND', occupation: 'Domestic Worker', sector: 'Personal Services', education: 'primary', experienceYears: 15, skills: ['cleaning', 'cooking', 'childcare'], lat: 28.6139, lng: 77.2090, matchScore: 0.72 },
  { id: '12', name: 'Rajesh Kumar', country: 'India', countryCode: 'IND', occupation: 'Auto Rickshaw Driver', sector: 'Transportation', education: 'secondary', experienceYears: 11, skills: ['vehicle maintenance', 'route planning', 'passenger safety'], lat: 19.0760, lng: 72.8777, matchScore: 0.75 },

  // Pakistan
  { id: '13', name: 'Ayesha Malik', country: 'Pakistan', countryCode: 'PAK', occupation: 'Tailor', sector: 'Manufacturing', education: 'secondary', experienceYears: 7, skills: ['garment construction', 'alterations', 'fabric selection'], lat: 31.5204, lng: 74.3587, matchScore: 0.83 },

  // Philippines
  { id: '14', name: 'Maria Santos', country: 'Philippines', countryCode: 'PHL', occupation: 'Street Vendor', sector: 'Wholesale & Retail Trade', education: 'secondary', experienceYears: 5, skills: ['product display', 'cash management', 'customer engagement'], lat: 14.5995, lng: 120.9842, matchScore: 0.78 },

  // Ghana
  { id: '15', name: 'Kwame Asante', country: 'Ghana', countryCode: 'GHA', occupation: 'Carpenter', sector: 'Construction', education: 'primary', experienceYears: 13, skills: ['furniture making', 'tool maintenance', 'measurement'], lat: 5.6037, lng: -0.1870, matchScore: 0.86 }
];

const countryDataMap: Record<string, CountryData> = {
  'Uganda': { name: 'Uganda', code: 'UGA', informalEmploymentPct: 94.7, avgMonthlyWageUSD: 145, workingPovertyRate: 58.2, youthUnemploymentPct: 13.4 },
  'Bangladesh': { name: 'Bangladesh', code: 'BGD', informalEmploymentPct: 85.1, avgMonthlyWageUSD: 180, workingPovertyRate: 42.3, youthUnemploymentPct: 10.6 },
  'Kenya': { name: 'Kenya', code: 'KEN', informalEmploymentPct: 83.6, avgMonthlyWageUSD: 165, workingPovertyRate: 36.1, youthUnemploymentPct: 12.7 },
  'Nigeria': { name: 'Nigeria', code: 'NGA', informalEmploymentPct: 92.4, avgMonthlyWageUSD: 135, workingPovertyRate: 51.8, youthUnemploymentPct: 19.3 },
  'India': { name: 'India', code: 'IND', informalEmploymentPct: 81.2, avgMonthlyWageUSD: 220, workingPovertyRate: 28.5, youthUnemploymentPct: 23.2 },
  'Pakistan': { name: 'Pakistan', code: 'PAK', informalEmploymentPct: 77.8, avgMonthlyWageUSD: 195, workingPovertyRate: 39.3, youthUnemploymentPct: 8.5 },
  'Philippines': { name: 'Philippines', code: 'PHL', informalEmploymentPct: 72.1, avgMonthlyWageUSD: 250, workingPovertyRate: 18.8, youthUnemploymentPct: 13.9 },
  'Ghana': { name: 'Ghana', code: 'GHA', informalEmploymentPct: 89.2, avgMonthlyWageUSD: 155, workingPovertyRate: 44.5, youthUnemploymentPct: 11.2 }
};

export function InteractiveGlobe() {
  const globeEl = useRef<any>();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState({ features: [] });

  // Filters
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterEducation, setFilterEducation] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');

  const sectors = ['all', 'Wholesale & Retail Trade', 'ICT Services', 'Agriculture', 'Manufacturing', 'Transportation', 'Personal Services', 'Construction'];
  const allSkills = ['all', ...Array.from(new Set(workers.flatMap(w => w.skills)))];

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      if (filterSector !== 'all' && w.sector !== filterSector) return false;
      if (filterEducation !== 'all' && w.education !== filterEducation) return false;
      if (filterSkill !== 'all' && !w.skills.includes(filterSkill)) return false;
      return true;
    });
  }, [filterSector, filterEducation, filterSkill]);

  const countryWorkerCounts = useMemo(() => {
    return filteredWorkers.reduce((acc, worker) => {
      acc[worker.country] = (acc[worker.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredWorkers]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);

    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.4;
    }
  }, []);

  const handleCountryClick = (polygon: any) => {
    setSelectedCountry(polygon.properties.NAME);
  };

  const getCountryColor = (countryName: string) => {
    const workerCount = countryWorkerCounts[countryName] || 0;
    if (selectedCountry === countryName) return '#1710E6'; // Electric blue
    if (workerCount === 0) return '#d4d1c7';
    if (workerCount >= 3) return '#1710E6';
    if (workerCount === 2) return '#8DC651'; // Lime
    return '#5e9ed6';
  };

  return (
    <div className="relative w-full h-full bg-[#f6f4ef]">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(246, 244, 239, 1)"

        polygonsData={countries.features}
        polygonAltitude={d => {
          const countryName = (d as any).properties.NAME;
          const workerCount = countryWorkerCounts[countryName] || 0;
          if (selectedCountry === countryName) return 0.04;
          return 0.01 + (workerCount * 0.004);
        }}
        polygonCapColor={d => getCountryColor((d as any).properties.NAME)}
        polygonSideColor={() => '#f6f4ef'}
        polygonStrokeColor={() => '#a39f91'}
        polygonLabel={({ properties }: any) => {
          const workerCount = countryWorkerCounts[properties.NAME] || 0;
          const countryData = countryDataMap[properties.NAME];
          return `
            <div style="background: #f6f4ef; padding: 16px; border-radius: 12px; border: 2px solid #1710E6; font-family: 'JetBrains Mono', monospace; min-width: 260px; box-shadow: 0 8px 24px rgba(23,16,230,0.15);">
              <div style="color: #1a1a1a; font-weight: 700; font-size: 18px; margin-bottom: 12px; font-family: 'Instrument Serif', serif;">${properties.NAME}</div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #fff; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 28px;">👥</div>
                <div>
                  <div style="color: #1710E6; font-weight: 800; font-size: 26px;">${workerCount}</div>
                  <div style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${workerCount === 1 ? 'Worker' : 'Workers'}</div>
                </div>
              </div>
              ${countryData ? `
                <div style="font-size: 11px; color: #6B7280; line-height: 1.6; border-top: 1px solid #d4d1c7; padding-top: 10px;">
                  <div style="margin-bottom: 4px;"><span style="color: #1710E6; font-weight: 600;">Informal Employment:</span> ${countryData.informalEmploymentPct}%</div>
                  <div style="margin-bottom: 4px;"><span style="color: #8DC651; font-weight: 600;">Avg Monthly Wage:</span> $${countryData.avgMonthlyWageUSD}</div>
                  <div style="color: #999; font-size: 10px; margin-top: 6px;">ILO ILOSTAT · 2023</div>
                </div>
              ` : ''}
            </div>
          `;
        }}
        onPolygonClick={handleCountryClick}

        pointsData={filteredWorkers}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#8DC651'}
        pointAltitude={0.02}
        pointRadius={0.35}
        pointLabel={(point: any) => `
          <div style="background: #f6f4ef; padding: 14px; border-radius: 12px; border: 2px solid #8DC651; font-family: 'JetBrains Mono', monospace; min-width: 240px; box-shadow: 0 8px 24px rgba(141,198,81,0.2);">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 10px;">
              <div>
                <div style="color: #1a1a1a; font-weight: 700; font-size: 15px; font-family: 'Instrument Serif', serif;">${point.name}</div>
                <div style="color: #1710E6; font-size: 12px; font-weight: 600; margin-top: 2px;">${point.occupation}</div>
              </div>
            </div>
            <div style="background: #fff; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
              <div style="color: #6B7280; font-size: 10px; margin-bottom: 4px;">SECTOR</div>
              <div style="color: #1a1a1a; font-size: 11px; font-weight: 600;">${point.sector}</div>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div style="background: #fff; padding: 6px 8px; border-radius: 6px; flex: 1;">
                <div style="color: #6B7280; font-size: 9px;">EXP</div>
                <div style="color: #1710E6; font-size: 12px; font-weight: 700;">${point.experienceYears}y</div>
              </div>
              <div style="background: #fff; padding: 6px 8px; border-radius: 6px; flex: 1;">
                <div style="color: #6B7280; font-size: 9px;">MATCH</div>
                <div style="color: #8DC651; font-size: 12px; font-weight: 700;">${(point.matchScore * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div style="color: #1710E6; font-size: 10px; font-weight: 600; margin-bottom: 4px;">SKILLS</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${point.skills.slice(0, 3).map((skill: string) => `
                <span style="background: #1710E6; color: #fff; padding: 3px 6px; border-radius: 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px;">${skill}</span>
              `).join('')}
            </div>
          </div>
        `}
      />

      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#f6f4ef] rounded-2xl border-2 border-[#1710E6] px-8 py-4 shadow-xl">
        <h1 className="text-2xl font-bold text-[#1710E6]" style={{ fontFamily: 'Instrument Serif, serif' }}>SkillPath Global Talent Map</h1>
        <p className="text-sm text-[#6B7280] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Informal Economy Workers · LMICs</p>
      </div>

      {/* Filter Panel */}
      <div className="absolute top-6 left-6 bg-[#f6f4ef] rounded-xl border-2 border-[#1710E6] p-5 shadow-xl max-w-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#1710E6]" />
          <h3 className="text-sm font-bold text-[#1710E6]">FILTER WORKERS</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#6B7280] block mb-2 uppercase tracking-wide">Sector</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border-2 border-[#d4d1c7] rounded-lg focus:border-[#8DC651] focus:outline-none"
            >
              {sectors.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Sectors' : s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#6B7280] block mb-2 uppercase tracking-wide">Education</label>
            <select
              value={filterEducation}
              onChange={(e) => setFilterEducation(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border-2 border-[#d4d1c7] rounded-lg focus:border-[#8DC651] focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="none">No Formal Education</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[#6B7280] block mb-2 uppercase tracking-wide">Skill</label>
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border-2 border-[#d4d1c7] rounded-lg focus:border-[#8DC651] focus:outline-none"
            >
              {allSkills.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Skills' : s}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t-2 border-[#d4d1c7]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280] uppercase">Showing:</span>
              <span className="text-lg font-bold text-[#1710E6]">{filteredWorkers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-6 right-6 bg-[#f6f4ef] rounded-xl border-2 border-[#8DC651] p-5 shadow-xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#8DC651]" />
          <h3 className="text-sm font-bold text-[#1710E6]">NETWORK STATS</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between gap-6">
            <span className="text-xs text-[#6B7280] uppercase">Workers:</span>
            <span className="text-2xl font-bold text-[#1710E6]">{filteredWorkers.length}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-xs text-[#6B7280] uppercase">Countries:</span>
            <span className="text-2xl font-bold text-[#8DC651]">{Object.keys(countryWorkerCounts).length}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-xs text-[#6B7280] uppercase">Avg Match:</span>
            <span className="text-2xl font-bold text-[#1710E6]">
              {filteredWorkers.length > 0
                ? (filteredWorkers.reduce((sum, w) => sum + (w.matchScore || 0), 0) / filteredWorkers.length * 100).toFixed(0)
                : 0}%
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-[#d4d1c7]">
          <h4 className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Top Countries</h4>
          <div className="space-y-2">
            {Object.entries(countryWorkerCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([country, count]) => (
                <div key={country} className="flex justify-between text-xs">
                  <span className="text-[#1a1a1a]">{country}</span>
                  <span className="font-bold text-[#1710E6]">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Selected Country Detail */}
      {selectedCountry && (
        <div className="absolute bottom-6 right-6 bg-[#f6f4ef] rounded-xl border-2 border-[#1710E6] p-5 shadow-xl min-w-[360px] max-h-[450px] overflow-y-auto" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <div className="flex items-start justify-between mb-4 sticky top-0 bg-[#f6f4ef] pb-3">
            <div>
              <h3 className="text-xl font-bold text-[#1710E6]" style={{ fontFamily: 'Instrument Serif, serif' }}>{selectedCountry}</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                {countryWorkerCounts[selectedCountry] || 0} workers · {countryDataMap[selectedCountry] ? `${countryDataMap[selectedCountry].informalEmploymentPct}% informal` : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-[#6B7280] hover:text-[#1710E6] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {countryDataMap[selectedCountry] && (
            <div className="bg-white rounded-lg p-4 mb-4 border-2 border-[#d4d1c7]">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[#6B7280] uppercase mb-1">Avg Wage</div>
                  <div className="text-[#8DC651] font-bold text-lg">${countryDataMap[selectedCountry].avgMonthlyWageUSD}/mo</div>
                </div>
                <div>
                  <div className="text-[#6B7280] uppercase mb-1">Poverty Rate</div>
                  <div className="text-[#1710E6] font-bold text-lg">{countryDataMap[selectedCountry].workingPovertyRate}%</div>
                </div>
              </div>
              <div className="text-[#999] text-[10px] mt-2 uppercase tracking-wide">ILO ILOSTAT · 2023</div>
            </div>
          )}

          <div className="space-y-2">
            {filteredWorkers
              .filter(w => w.country === selectedCountry)
              .map(worker => (
                <div key={worker.id} className="bg-white rounded-lg p-4 border-2 border-[#d4d1c7] hover:border-[#8DC651] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-[#1a1a1a]">{worker.name}</div>
                      <div className="text-xs text-[#1710E6] font-semibold">{worker.occupation}</div>
                    </div>
                    <div className="text-xs bg-[#8DC651] text-white px-2 py-1 rounded font-bold">
                      {(worker.matchScore! * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-xs text-[#6B7280] mb-2">{worker.sector} · {worker.experienceYears}y exp</div>
                  <div className="flex flex-wrap gap-1">
                    {worker.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[10px] bg-[#1710E6] text-white px-2 py-1 rounded uppercase">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {countryWorkerCounts[selectedCountry] === 0 && (
              <p className="text-sm text-[#6B7280] text-center py-6">No workers match current filters</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
