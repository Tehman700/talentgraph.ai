import { useRef, useEffect, useMemo, useState } from 'react'
import Globe from 'react-globe.gl'
import type { TalentPoint } from '../types'
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
  visualStyle?: 'theme' | 'classic'
}

function hashText(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function seededUnit(seed: number, salt: number): number {
  const x = Math.sin((seed + salt) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function spreadPointsByCountry(points: TalentPoint[]): TalentPoint[] {
  const grouped = points.reduce((acc, p) => {
    const key = (p.country || 'unknown').toLowerCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {} as Record<string, TalentPoint[]>)

  const spread: TalentPoint[] = []
  for (const list of Object.values(grouped)) {
    const total = list.length
    if (total <= 1) {
      spread.push(list[0])
      continue
    }
    const baseRadius = Math.min(1.2 + total * 0.14, 3.8)
    list.forEach((p, idx) => {
      const key = `${p.id || p.name || 'person'}:${idx}`
      const seed = hashText(key)
      const angle = seededUnit(seed, 17) * Math.PI * 2
      const radiusNoise = Math.sqrt(seededUnit(seed, 53))
      const radius = baseRadius * (0.35 + radiusNoise * 0.95)
      const latOffset = Math.sin(angle) * radius
      const lngOffset = Math.cos(angle) * radius
      spread.push({
        ...p,
        lat: (p.lat || 0) + latOffset,
        lng: (p.lng || 0) + lngOffset,
      })
    })
  }
  return spread
}

export function TalentGlobe({ size = 520, showLegend = true, points, mode = 'explore', onPointClick, visualStyle = 'theme' }: Props) {
  const globeRef = useRef<any>(null)
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] })
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const displayPoints = points && points.length > 0 ? points : DEMO_POINTS
  const plottedPoints = useMemo(() => spreadPointsByCountry(displayPoints), [displayPoints])
  const showArcs = !points || points.length === 0

  const countryWorkerCounts = useMemo(() => {
    return plottedPoints.reduce((acc, p) => {
      const key = p.country || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [plottedPoints])

  useEffect(() => {
    const el = globeRef.current
    if (!el) return
    el.controls().autoRotate = true
    el.controls().autoRotateSpeed = 0.4
    el.controls().enableZoom = true
    el.controls().minDistance = 200
    el.controls().maxDistance = 600
    el.pointOfView({ lat: 15, lng: 30, altitude: 2.2 }, 1400)

    // Theme globe: keep original dark-blue sea style, but slightly lighter.
    if (visualStyle === 'theme') {
      const material = el.globeMaterial?.()
      if (material) {
        material.color.set('#b7d4ee')
        material.emissive.set('#2b5f90')
        material.emissiveIntensity = 0.08
        material.transparent = false
        material.opacity = 1
      }
    }

    const stopAutoRotate = () => {
      if (!el?.controls) return
      el.controls().autoRotate = false
    }

    const domEl = el.renderer?.()?.domElement
    domEl?.addEventListener('pointerdown', stopAutoRotate, { passive: true })
    domEl?.addEventListener('wheel', stopAutoRotate, { passive: true })
    domEl?.addEventListener('touchstart', stopAutoRotate, { passive: true })

    const idleTimeout = setTimeout(() => {
      if (el?.controls) el.controls().autoRotate = false
    }, 12000)

    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then((res) => res.json())
      .then((data) => setCountries({ features: data.features || [] }))
      .catch(() => setCountries({ features: [] }))

    return () => {
      clearTimeout(idleTimeout)
      domEl?.removeEventListener('pointerdown', stopAutoRotate)
      domEl?.removeEventListener('wheel', stopAutoRotate)
      domEl?.removeEventListener('touchstart', stopAutoRotate)
    }
  }, [visualStyle])

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

  const getCountryColor = (countryName: string) => {
    const workerCount = countryWorkerCounts[countryName] || 0
    if (selectedCountry === countryName) return '#2f7d32'
    if (workerCount === 0) return '#d4d1c7'
    if (workerCount >= 3) return '#3f8f45'
    if (workerCount === 2) return '#78b96e'
    return '#9fd293'
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
        globeImageUrl={visualStyle === 'theme' ? '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg' : undefined}
        backgroundColor={visualStyle === 'theme' ? 'rgba(246,244,239,1)' : 'rgba(0,0,0,0)'}
        atmosphereColor={visualStyle === 'theme' ? '#8fbce0' : '#1710E6'}
        atmosphereAltitude={visualStyle === 'theme' ? 0.15 : 0.18}

        polygonsData={visualStyle === 'theme' ? countries.features : []}
        polygonAltitude={(d: any) => {
          const countryName = d?.properties?.NAME || ''
          if (selectedCountry === countryName) return 0.018
          return 0.004
        }}
        polygonCapColor={(d: any) => getCountryColor(d?.properties?.NAME || '')}
        polygonSideColor={() => '#f6f4ef'}
        polygonStrokeColor={() => '#a39f91'}
        polygonLabel={(d: any) => {
          const countryName = d?.properties?.NAME || 'Unknown'
          const workerCount = countryWorkerCounts[countryName] || 0
          return `
            <div style="background:#f6f4ef;padding:12px;border-radius:10px;border:2px solid #1710E6;font-family:'JetBrains Mono',monospace;min-width:180px;">
              <div style="color:#1a1a1a;font-weight:700;font-size:14px;">${countryName}</div>
              <div style="margin-top:6px;color:#1710E6;font-weight:800;font-size:24px;">${workerCount}</div>
              <div style="color:#6B7280;font-size:11px;">${workerCount === 1 ? 'Worker' : 'Workers'}</div>
            </div>
          `
        }}
        onPolygonClick={(d: any) => visualStyle === 'theme' && setSelectedCountry(d?.properties?.NAME || null)}

        pointsData={plottedPoints}
        pointColor={(p: any) => getColor(p as TalentPoint)}
        pointAltitude={(p: any) => getAltitude(p as TalentPoint)}
        pointRadius={0.4}
        pointLabel={(p: any) => {
          const pt = p as TalentPoint
          const color = getColor(pt)
          const matchLine = mode === 'match' && pt.match_score !== undefined
            ? `<br/><span style="color:#f59e0b">Match: ${Math.round(pt.match_score * 100)}%</span>`
            : ''
          const initials = (pt.name || '?').split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
          const avatarInner = pt.photo_url
            ? `<img src="${pt.photo_url}" alt="${pt.name}" style="width:100%;height:100%;object-fit:cover;display:block;">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;">${initials || '?'}</div>`
          const github = pt.github_username
            ? `<a href="https://github.com/${pt.github_username}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;padding:3px 8px;background:#24292e;color:#fff;border-radius:4px;font-size:9px;font-weight:700;text-decoration:none;">gh GitHub</a>`
            : ''
          const linkedin = pt.linkedin_url
            ? `<a href="${pt.linkedin_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;padding:3px 8px;background:#0A66C2;color:#fff;border-radius:4px;font-size:9px;font-weight:700;text-decoration:none;">in LinkedIn</a>`
            : ''
          const resume = pt.resume_url
            ? `<a href="${pt.resume_url}" target="_blank" rel="noopener" style="display:block;margin-top:10px;padding:7px 12px;background:#1710E6;color:#fff;border-radius:6px;font-size:10px;font-weight:700;text-align:center;text-decoration:none;letter-spacing:0.05em;">View Resume ↗</a>`
            : ''
          return `
            <div style="
              background:#f6f4ef;
              color:#1a1a1a;
              padding:14px;
              border-radius:12px;
              border:2px solid #8DC651;
              font-family:'JetBrains Mono',monospace;
              min-width:220px;
              max-width:280px;
              box-shadow:0 8px 28px rgba(141,198,81,0.25);
            ">
              <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:#1710E6;border:2px solid #8DC651;flex-shrink:0;">${avatarInner}</div>
                <div style="min-width:0;flex:1;">
                  <div style="font-family:'Instrument Serif',serif;font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pt.name}</div>
                  <div style="color:${color};font-size:11px;font-weight:600;">${pt.profession || pt.niche}</div>
                  <div style="color:#6B7280;font-size:10px;">${pt.city}, ${pt.country}${matchLine}</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;margin-bottom:8px;">
                <div style="background:#fff;padding:6px 8px;border-radius:6px;flex:1;">
                  <div style="color:#6B7280;font-size:9px;text-transform:uppercase;">Exp</div>
                  <div style="color:#1710E6;font-size:12px;font-weight:700;">${pt.experience_years}y</div>
                </div>
                <div style="background:#fff;padding:6px 8px;border-radius:6px;flex:1;">
                  <div style="color:#6B7280;font-size:9px;text-transform:uppercase;">Role</div>
                  <div style="color:#1a1a1a;font-size:10px;font-weight:600;">${pt.role_type}</div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${(pt.skills || []).slice(0, 4).map((s) => `<span style="background:#1710E6;color:#fff;padding:3px 6px;border-radius:4px;font-size:9px;text-transform:uppercase;">${s}</span>`).join('')}
              </div>
              ${(github || linkedin) ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;">${github}${linkedin}</div>` : ''}
              ${resume}
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
          ? plottedPoints.filter(p => (p.match_score || 0) >= 0.55).slice(0, 8)
          : plottedPoints.filter(p => (p.experience_years || 0) >= 8).slice(0, 8)
        }
        ringColor={(p: any) => getColor(p as TalentPoint)}
        ringMaxRadius={2.5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1600}
      />

      {visualStyle === 'theme' && selectedCountry && (
        <div style={{
          width: Math.min(size, 420),
          background: '#f6f4ef',
          border: '2px solid #1710E6',
          borderRadius: 10,
          padding: 12,
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ color: '#1710E6', fontWeight: 700 }}>{selectedCountry}</div>
            <button
              onClick={() => setSelectedCountry(null)}
              style={{ border: 'none', background: 'transparent', color: '#6b6458', cursor: 'pointer', fontSize: 12 }}
            >
              Clear
            </button>
          </div>
          <div style={{ color: '#6b6458', fontSize: 12 }}>
            {countryWorkerCounts[selectedCountry] || 0} workers shown for current filters.
          </div>
        </div>
      )}

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
