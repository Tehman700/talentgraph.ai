import { useRef, useEffect } from 'react'
import Globe from 'react-globe.gl'
import type { TalentPoint, NICHE_COLORS as NicheColorsType } from '../types'
import { NICHE_COLORS } from '../types'

// Static demo data shown when no dynamic points are passed
const DEMO_POINTS: TalentPoint[] = [
  { lat: 0.35,   lng: 32.58,  city: 'Kampala',         country: 'Uganda',       name: 'Samuel O.',  role_type: 'non_tech', niche: 'Agriculture',       skills: [], experience_years: 8,  bio: '', color: '#8DC651' },
  { lat: 23.81,  lng: 90.41,  city: 'Dhaka',           country: 'Bangladesh',   name: 'Rina B.',    role_type: 'non_tech', niche: 'Manufacturing',     skills: [], experience_years: 5,  bio: '', color: '#94a3b8' },
  { lat: 6.52,   lng: 3.38,   city: 'Lagos',           country: 'Nigeria',      name: 'Chidi N.',   role_type: 'tech',     niche: 'Backend Engineering', skills: [], experience_years: 6, bio: '', color: '#00d4ff' },
  { lat: -1.29,  lng: 36.82,  city: 'Nairobi',         country: 'Kenya',        name: 'Amara K.',   role_type: 'tech',     niche: 'Mobile Development', skills: [], experience_years: 4, bio: '', color: '#a855f7' },
  { lat: 12.97,  lng: 77.59,  city: 'Bengaluru',       country: 'India',        name: 'Priya S.',   role_type: 'tech',     niche: 'Data Science & ML', skills: [], experience_years: 7,  bio: '', color: '#6366f1' },
  { lat: 19.08,  lng: 72.88,  city: 'Mumbai',          country: 'India',        name: 'Raj M.',     role_type: 'tech',     niche: 'Frontend Development', skills: [], experience_years: 5, bio: '', color: '#61DAFB' },
  { lat: -6.21,  lng: 106.85, city: 'Jakarta',         country: 'Indonesia',    name: 'Budi W.',    role_type: 'non_tech', niche: 'Finance',           skills: [], experience_years: 9,  bio: '', color: '#10b981' },
  { lat: 14.60,  lng: 120.98, city: 'Manila',          country: 'Philippines',  name: 'Maria L.',   role_type: 'non_tech', niche: 'Healthcare',        skills: [], experience_years: 11, bio: '', color: '#0ea5e9' },
  { lat: 37.77,  lng: -122.4, city: 'San Francisco',   country: 'United States',name: 'Alex C.',    role_type: 'tech',     niche: 'Frontend Development', skills: [], experience_years: 5, bio: '', color: '#61DAFB' },
  { lat: 51.51,  lng: -0.13,  city: 'London',          country: 'United Kingdom',name: 'Sophie T.', role_type: 'tech',     niche: 'DevOps & Cloud',    skills: [], experience_years: 6,  bio: '', color: '#f97316' },
  { lat: 52.52,  lng: 13.40,  city: 'Berlin',          country: 'Germany',      name: 'Lars K.',    role_type: 'tech',     niche: 'Security',          skills: [], experience_years: 8,  bio: '', color: '#ef4444' },
  { lat: 35.68,  lng: 139.69, city: 'Tokyo',           country: 'Japan',        name: 'Yuki T.',    role_type: 'tech',     niche: 'Game Development',  skills: [], experience_years: 7,  bio: '', color: '#84cc16' },
  { lat: -26.20, lng: 28.05,  city: 'Johannesburg',    country: 'South Africa', name: 'Thabo M.',   role_type: 'tech',     niche: 'Blockchain',        skills: [], experience_years: 3,  bio: '', color: '#eab308' },
  { lat: 48.85,  lng: 2.35,   city: 'Paris',           country: 'France',       name: 'Claire D.',  role_type: 'tech',     niche: 'UX & Design',       skills: [], experience_years: 6,  bio: '', color: '#ec4899' },
  { lat: -23.55, lng: -46.63, city: 'São Paulo',       country: 'Brazil',       name: 'Lucas F.',   role_type: 'tech',     niche: 'Backend Engineering', skills: [], experience_years: 4, bio: '', color: '#00d4ff' },
  { lat: 1.35,   lng: 103.82, city: 'Singapore',       country: 'Singapore',    name: 'Wei Lin',    role_type: 'tech',     niche: 'Data Science & ML', skills: [], experience_years: 5,  bio: '', color: '#6366f1' },
  { lat: 9.02,   lng: 38.75,  city: 'Addis Ababa',     country: 'Ethiopia',     name: 'Tigist H.',  role_type: 'non_tech', niche: 'Agriculture',       skills: [], experience_years: 12, bio: '', color: '#8DC651' },
  { lat: 24.86,  lng: 67.00,  city: 'Karachi',         country: 'Pakistan',     name: 'Zara A.',    role_type: 'non_tech', niche: 'Education',         skills: [], experience_years: 7,  bio: '', color: '#f59e0b' },
  { lat: 55.75,  lng: 37.62,  city: 'Moscow',          country: 'Russia',       name: 'Ivan P.',    role_type: 'tech',     niche: 'Backend Engineering', skills: [], experience_years: 9, bio: '', color: '#00d4ff' },
  { lat: -33.87, lng: 151.21, city: 'Sydney',          country: 'Australia',    name: 'Chloe R.',   role_type: 'tech',     niche: 'DevOps & Cloud',    skills: [], experience_years: 5,  bio: '', color: '#f97316' },
  { lat: 30.04,  lng: 31.24,  city: 'Cairo',           country: 'Egypt',        name: 'Ahmed H.',   role_type: 'non_tech', niche: 'Construction',      skills: [], experience_years: 14, bio: '', color: '#78716c' },
  { lat: 41.01,  lng: 28.96,  city: 'Istanbul',        country: 'Turkey',       name: 'Emre Y.',    role_type: 'tech',     niche: 'Mobile Development', skills: [], experience_years: 4, bio: '', color: '#a855f7' },
  { lat: -4.32,  lng: 15.32,  city: 'Kinshasa',        country: 'DRC',          name: 'Jean-Pierre', role_type: 'non_tech', niche: 'Healthcare',       skills: [], experience_years: 6,  bio: '', color: '#0ea5e9' },
  { lat: 10.82,  lng: 106.63, city: 'Ho Chi Minh',     country: 'Vietnam',      name: 'Nguyen T.',  role_type: 'tech',     niche: 'Frontend Development', skills: [], experience_years: 3, bio: '', color: '#61DAFB' },
  { lat: 59.33,  lng: 18.07,  city: 'Stockholm',       country: 'Sweden',       name: 'Anna L.',    role_type: 'tech',     niche: 'UX & Design',       skills: [], experience_years: 8,  bio: '', color: '#ec4899' },
]

const DEMO_ARCS = [
  { startLat: 12.97, startLng: 77.59, endLat: 37.77, endLng: -122.4, color: ['rgba(99,102,241,0.8)', 'rgba(99,102,241,0.05)'] },
  { startLat: -1.29, startLng: 36.82, endLat: 6.52,  endLng: 3.38,   color: ['rgba(141,198,81,0.7)', 'rgba(141,198,81,0.05)'] },
  { startLat: 23.81, startLng: 90.41, endLat: 14.60, endLng: 120.98, color: ['rgba(148,163,184,0.7)', 'rgba(148,163,184,0.05)'] },
  { startLat: 51.51, startLng: -0.13, endLat: 48.85, endLng: 2.35,   color: ['rgba(249,115,22,0.8)', 'rgba(249,115,22,0.05)'] },
  { startLat: 37.77, startLng: -122.4,endLat: 1.35,  endLng: 103.82, color: ['rgba(97,218,251,0.6)', 'rgba(97,218,251,0.05)'] },
]

interface Props {
  size?: number
  showLegend?: boolean
  points?: TalentPoint[]
  mode?: 'explore' | 'match'
  onPointClick?: (point: TalentPoint) => void
}

export function TalentGlobe({ size = 520, showLegend = true, points, mode = 'explore', onPointClick }: Props) {
  const globeRef = useRef<any>(null)
  const displayPoints = points && points.length > 0 ? points : DEMO_POINTS
  const showArcs = !points || points.length === 0

  useEffect(() => {
    const el = globeRef.current
    if (!el) return
    el.controls().autoRotate = true
    el.controls().autoRotateSpeed = 0.4
    el.controls().enableZoom = true
    el.controls().minDistance = 200
    el.controls().maxDistance = 600
    el.pointOfView({ lat: 15, lng: 30, altitude: 2.2 }, 1400)
  }, [])

  const getColor = (p: TalentPoint) => {
    if (mode === 'match' && p.match_score !== undefined) {
      if (p.match_score >= 0.55) return '#ef4444'
      if (p.match_score >= 0.25) return '#f59e0b'
      return '#374151'
    }
    return p.color || NICHE_COLORS[p.niche] || '#6b6458'
  }

  const getAltitude = (p: TalentPoint) => {
    if (mode === 'match' && p.match_score !== undefined) {
      return 0.04 + p.match_score * 0.15
    }
    return 0.05 + Math.min((p.experience_years || 1) / 25, 1) * 0.1
  }

  const legendItems = mode === 'match'
    ? [
        { color: '#ef4444', label: 'Strong match (55%+)' },
        { color: '#f59e0b', label: 'Moderate match (25–55%)' },
        { color: '#374151', label: 'Weak match (<25%)' },
      ]
    : Object.entries(NICHE_COLORS).map(([label, color]) => ({ color, label }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        atmosphereColor="#1710E6"
        atmosphereAltitude={0.18}
        pointsData={displayPoints}
        pointColor={(p: any) => getColor(p as TalentPoint)}
        pointAltitude={(p: any) => getAltitude(p as TalentPoint)}
        pointRadius={0.55}
        pointLabel={(p: any) => {
          const pt = p as TalentPoint
          const color = getColor(pt)
          const matchLine = mode === 'match' && pt.match_score !== undefined
            ? `<br/><span style="color:#f59e0b">Match: ${Math.round(pt.match_score * 100)}%</span>`
            : ''
          return `
            <div style="
              background:#0e0e12;color:#f6f4ef;
              padding:9px 14px;border-radius:7px;
              font-family:'JetBrains Mono',monospace;font-size:11px;
              border:1px solid rgba(246,244,239,0.18);
              white-space:nowrap;line-height:1.6;
            ">
              <span style="color:${color};font-weight:700">${pt.niche}</span><br/>
              <span style="font-weight:600">${pt.name}</span><br/>
              ${pt.city}, ${pt.country}${matchLine}<br/>
              <span style="opacity:0.6">${pt.experience_years}y exp · ${(pt.skills || []).slice(0, 3).join(', ')}</span>
            </div>
          `
        }}
        onPointClick={(p: any) => onPointClick && onPointClick(p as TalentPoint)}
        arcsData={showArcs ? DEMO_ARCS : []}
        arcColor={(a: any) => a.color}
        arcAltitude={0.2}
        arcStroke={0.5}
        arcDashLength={0.5}
        arcDashGap={0.3}
        arcDashAnimateTime={2500}
        ringsData={mode === 'match'
          ? displayPoints.filter(p => (p.match_score || 0) >= 0.55).slice(0, 8)
          : displayPoints.filter(p => (p.experience_years || 0) >= 8).slice(0, 8)
        }
        ringColor={(p: any) => getColor(p as TalentPoint)}
        ringMaxRadius={2.5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1600}
      />

      {showLegend && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
          justifyContent: 'center', maxWidth: size,
        }}>
          {legendItems.map(({ color, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6b6458',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0,
              }} />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
