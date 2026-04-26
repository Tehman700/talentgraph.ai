/**
 * globe_visualization.js
 *
 * Core globe data utilities: point normalization, tag assignment,
 * filter logic, and backend API fetching for the talent globe.
 *
 * Imported by InteractiveGlobe.tsx and other components.
 */

export const PROFESSION_COLORS = {
  'Frontend Development':  '#61DAFB',
  'Backend Engineering':   '#00d4ff',
  'Mobile Development':    '#a855f7',
  'DevOps & Cloud':        '#f97316',
  'Data Science & ML':     '#6366f1',
  'UX & Design':           '#ec4899',
  'Security':              '#ef4444',
  'Blockchain':            '#eab308',
  'Game Development':      '#84cc16',
  'Agriculture':           '#8DC651',
  'Healthcare':            '#0ea5e9',
  'Education':             '#f59e0b',
  'Finance':               '#10b981',
  'Construction':          '#78716c',
  'Manufacturing':         '#94a3b8',
  'Retail':                '#e879f9',
  'Hospitality':           '#fb923c',
};

/**
 * Returns a display color for a profession/niche string.
 * Falls back to neutral grey if unrecognized.
 */
export function getProfessionColor(profession = '') {
  const key = Object.keys(PROFESSION_COLORS).find(
    k => k.toLowerCase() === (profession ?? '').toLowerCase()
  );
  return PROFESSION_COLORS[key] ?? '#6b6458';
}

/**
 * Assign structured tags to a user profile.
 *
 * @param   {Object} profile  Any profile object with country, city, profession/niche/occupation, skills
 * @returns {Array}           [{ type: 'location'|'profession'|'skill', value: string }]
 */
export function assignUserTags(profile) {
  const tags = [];

  if (profile.country) tags.push({ type: 'location', value: profile.country });
  if (profile.city)    tags.push({ type: 'location', value: profile.city });

  const prof = profile.profession ?? profile.niche ?? profile.occupation ?? '';
  if (prof) tags.push({ type: 'profession', value: prof });

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  for (const skill of skills) {
    const label = typeof skill === 'string' ? skill : (skill.label ?? skill.skill ?? '');
    if (label) tags.push({ type: 'skill', value: label });
  }

  return tags;
}

/**
 * Normalize a raw profile object into a typed globe point.
 * Attaches computed tags, color, and resumeUrl.
 *
 * @param   {Object} profile  Raw backend or form profile
 * @returns {Object}          Globe-ready point
 */
export function profileToPoint(profile) {
  const slug = profile.profile_slug ?? profile.id;
  return {
    ...profile,
    tags:      assignUserTags(profile),
    color:     profile.color ?? getProfessionColor(profile.profession ?? profile.niche ?? ''),
    resumeUrl: slug ? `/resume/${slug}` : null,
  };
}

/**
 * Filter an array of globe points by optional criteria.
 *
 * @param   {Array}  points
 * @param   {Object} filters  { profession?, skill?, country?, roleType? }
 * @returns {Array}
 */
export function applyFilters(points, filters = {}) {
  return points.filter(point => {
    const prof = (point.profession ?? point.niche ?? point.occupation ?? '').toLowerCase();

    if (filters.profession && filters.profession !== 'all') {
      if (!prof.includes(filters.profession.toLowerCase())) return false;
    }

    if (filters.skill && filters.skill !== 'all') {
      const skills = (point.skills ?? []).map(s =>
        (typeof s === 'string' ? s : (s.label ?? s.skill ?? '')).toLowerCase()
      );
      if (!skills.some(s => s.includes(filters.skill.toLowerCase()))) return false;
    }

    if (filters.country && filters.country !== 'all') {
      if ((point.country ?? '').toLowerCase() !== filters.country.toLowerCase()) return false;
    }

    if (filters.roleType && filters.roleType !== 'all') {
      if (point.role_type !== filters.roleType) return false;
    }

    return true;
  });
}

/**
 * Extract unique option values for filter dropdowns from a points array.
 *
 * @param   {Array}  points
 * @returns {{ professions: string[], countries: string[], skills: string[] }}
 */
export function extractFilterOptions(points) {
  const professions = [...new Set(
    points.map(p => p.profession ?? p.niche ?? p.occupation).filter(Boolean)
  )].sort();

  const countries = [...new Set(
    points.map(p => p.country).filter(Boolean)
  )].sort();

  const skills = [...new Set(
    points.flatMap(p =>
      (p.skills ?? []).map(s => typeof s === 'string' ? s : (s.label ?? s.skill ?? ''))
    ).filter(Boolean)
  )].sort();

  return { professions, countries, skills };
}

/**
 * Fetch live globe points from the backend API.
 *
 * @param   {Object} filters  Optional: { niche?, role_type?, country_code? }
 * @param   {string} baseUrl  API base URL (default: empty string → same origin)
 * @returns {Promise<Array>}  Normalized globe points
 */
export async function fetchGlobeData(filters = {}, baseUrl = '') {
  const params = new URLSearchParams();
  if (filters.niche)        params.set('niche',        filters.niche);
  if (filters.role_type)    params.set('role_type',    filters.role_type);
  if (filters.country_code) params.set('country_code', filters.country_code);

  const res = await fetch(`${baseUrl}/api/talent/globe?${params}`);
  if (!res.ok) throw new Error(`Globe data fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.points ?? []).map(profileToPoint);
}

/**
 * Build a full, shareable resume URL for a talent profile.
 *
 * @param   {Object} profile  Profile with profile_slug or id
 * @returns {string|null}
 */
export function getShareableResumeLink(profile) {
  const slug = profile.profile_slug ?? profile.id;
  if (!slug) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/resume/${slug}`;
}

/**
 * Group points by country, returning { [countryName]: point[] }.
 */
export function groupByCountry(points) {
  return points.reduce((acc, p) => {
    const c = p.country ?? 'Unknown';
    if (!acc[c]) acc[c] = [];
    acc[c].push(p);
    return acc;
  }, {});
}
