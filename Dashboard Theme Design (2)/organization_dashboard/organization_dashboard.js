/**
 * organization_dashboard.js
 *
 * Organization-specific business logic for the TalentGraph dashboard.
 * Handles candidate filtering/ranking, hiring form management,
 * connection requests, and CSV/Excel export.
 *
 * Exports:
 *   rankCandidates(workers, criteria)          → sorted Worker[]
 *   computeMatchScore(worker, criteria)        → 0-1 number
 *   filterCandidates(workers, filters)         → Worker[]
 *   buildHiringFormPayload(formMeta, questions) → Object
 *   submitHiringForm(payload, options)         → Promise<Object>
 *   fetchOrgForms(options)                     → Promise<Object[]>
 *   fetchFormResponses(formId, options)        → Promise<Object[]>
 *   exportResponsesToCSV(responses, filename)  → void (triggers download)
 *   sendConnectionRequest(targetUserId, opts)  → Promise<Object>
 */

// ── Candidate ranking & filtering ─────────────────────────────────────────────

/**
 * Compute a 0-1 match score for a worker against org hiring criteria.
 *
 * Scoring breakdown:
 *   40% — required skills match
 *   30% — profession/sector match
 *   20% — experience level match
 *   10% — location match
 *
 * @param   {Object} worker   Talent profile
 * @param   {Object} criteria { requiredSkills, profession, minExperience, location }
 * @returns {number}          0-1 score
 */
export function computeMatchScore(worker, criteria = {}) {
  let score = 0;

  // Skills match (40%)
  const required    = (criteria.requiredSkills ?? []).map(s => s.toLowerCase());
  const workerSkills = (worker.skills ?? []).map(s =>
    (typeof s === 'string' ? s : s.label ?? s.skill ?? '').toLowerCase()
  );
  if (required.length > 0) {
    const matched = required.filter(r => workerSkills.some(ws => ws.includes(r) || r.includes(ws)));
    score += 0.4 * (matched.length / required.length);
  } else {
    score += 0.4; // No skill requirement = full credit
  }

  // Profession match (30%)
  if (criteria.profession && criteria.profession !== 'all') {
    const workerProf = (worker.profession ?? worker.niche ?? worker.occupation ?? worker.sector ?? '').toLowerCase();
    const critProf   = criteria.profession.toLowerCase();
    if (workerProf.includes(critProf) || critProf.includes(workerProf)) {
      score += 0.3;
    } else if (SECTOR_TO_NICHE_MAP[criteria.profession]?.some(n => workerProf.includes(n.toLowerCase()))) {
      score += 0.15; // Related field
    }
  } else {
    score += 0.3;
  }

  // Experience match (20%)
  const minExp       = criteria.minExperience ?? 0;
  const workerExp    = worker.experienceYears ?? worker.experience_years ?? 0;
  if (workerExp >= minExp) {
    score += 0.2;
  } else if (workerExp >= minExp * 0.7) {
    score += 0.1; // Close to requirement
  }

  // Location match (10%)
  if (criteria.location && criteria.location !== 'all') {
    const workerLoc = (worker.country ?? worker.city ?? worker.location ?? '').toLowerCase();
    if (workerLoc.includes(criteria.location.toLowerCase())) {
      score += 0.1;
    }
  } else {
    score += 0.1;
  }

  return Math.min(Math.round(score * 100) / 100, 1);
}

const SECTOR_TO_NICHE_MAP = {
  'Software Engineer':     ['Frontend Development', 'Backend Engineering', 'Mobile Development', 'DevOps & Cloud'],
  'Designer':              ['UX & Design', 'Graphic Design'],
  'Data Scientist':        ['Data Science & ML'],
  'DevOps Engineer':       ['DevOps & Cloud'],
  'Mobile Developer':      ['Mobile Development'],
  'Security Engineer':     ['Security'],
  'Blockchain Developer':  ['Blockchain'],
};

/**
 * Rank an array of workers by match score (highest first).
 *
 * @param   {Array}  workers   Array of talent profiles
 * @param   {Object} criteria  Hiring criteria
 * @returns {Array}            Sorted workers with `orgMatchScore` attached
 */
export function rankCandidates(workers, criteria = {}) {
  return workers
    .map(w => ({ ...w, orgMatchScore: computeMatchScore(w, criteria) }))
    .sort((a, b) => b.orgMatchScore - a.orgMatchScore);
}

/**
 * Filter workers by organization-specific criteria.
 * More permissive than strict equality — checks inclusion.
 *
 * @param   {Array}  workers
 * @param   {Object} filters  { location?, profession?, skills?, minExperience?, education? }
 * @returns {Array}
 */
export function filterCandidates(workers, filters = {}) {
  return workers.filter(w => {
    const location = (w.country ?? w.city ?? w.location ?? '').toLowerCase();
    const prof     = (w.profession ?? w.niche ?? w.occupation ?? w.sector ?? '').toLowerCase();
    const skills   = (w.skills ?? []).map(s =>
      (typeof s === 'string' ? s : s.label ?? s.skill ?? '').toLowerCase()
    );
    const exp = w.experienceYears ?? w.experience_years ?? 0;

    if (filters.location && filters.location !== 'all') {
      if (!location.includes(filters.location.toLowerCase())) return false;
    }

    if (filters.profession && filters.profession !== 'all') {
      if (!prof.includes(filters.profession.toLowerCase())) return false;
    }

    if (filters.skills && filters.skills.length > 0) {
      const reqSkills = filters.skills.map(s => s.toLowerCase());
      const hasAny = reqSkills.some(r => skills.some(ws => ws.includes(r) || r.includes(ws)));
      if (!hasAny) return false;
    }

    if (filters.minExperience != null && filters.minExperience > 0) {
      if (exp < filters.minExperience) return false;
    }

    if (filters.education && filters.education !== 'all') {
      if ((w.education ?? '').toLowerCase() !== filters.education.toLowerCase()) return false;
    }

    return true;
  });
}

// ── Hiring form management ─────────────────────────────────────────────────────

/**
 * Build a structured hiring form payload ready for the backend.
 *
 * @param {Object} formMeta    { jobTitle, jobDescription, company, deadline }
 * @param {Array}  questions   [{ id, text, type: 'text'|'choice', options?: string[] }]
 * @param {Array}  targetIds   Array of candidate user IDs to send the form to
 * @returns {Object}           Payload for POST /api/hiring/forms
 */
export function buildHiringFormPayload(formMeta, questions, targetIds = []) {
  return {
    job_title:       formMeta.jobTitle       ?? '',
    job_description: formMeta.jobDescription ?? '',
    company:         formMeta.company        ?? '',
    deadline:        formMeta.deadline       ?? null,
    questions:       questions.map((q, i) => ({
      id:      q.id ?? `q_${i}`,
      text:    q.text,
      type:    q.type ?? 'text',
      options: q.options ?? [],
      required: q.required ?? true,
    })),
    target_user_ids: targetIds,
  };
}

/**
 * Submit a hiring form to the backend and notify target candidates.
 *
 * @param   {Object} payload     Output of buildHiringFormPayload()
 * @param   {Object} options     { apiBase?: string }
 * @returns {Promise<Object>}    { form_id, notified_count, ... }
 */
export async function submitHiringForm(payload, options = {}) {
  const { apiBase = '' } = options;

  const res = await fetch(`${apiBase}/api/hiring/forms`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`Failed to submit hiring form: ${err.detail ?? res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch all hiring forms created by the current organization.
 *
 * @param   {Object} options  { apiBase?: string }
 * @returns {Promise<Array>}
 */
export async function fetchOrgForms(options = {}) {
  const { apiBase = '' } = options;
  const res = await fetch(`${apiBase}/api/hiring/forms`);
  if (!res.ok) throw new Error(`Failed to fetch forms: ${res.statusText}`);
  const data = await res.json();
  return data.forms ?? [];
}

/**
 * Fetch all candidate responses to a specific hiring form.
 *
 * @param   {string} formId
 * @param   {Object} options  { apiBase?: string }
 * @returns {Promise<Array>}
 */
export async function fetchFormResponses(formId, options = {}) {
  const { apiBase = '' } = options;
  const res = await fetch(`${apiBase}/api/hiring/forms/${formId}/responses`);
  if (!res.ok) throw new Error(`Failed to fetch responses: ${res.statusText}`);
  const data = await res.json();
  return data.responses ?? [];
}

// ── CSV / Excel export ─────────────────────────────────────────────────────────

/**
 * Export hiring form responses to a CSV file (opens in Excel).
 * Triggers a browser download.
 *
 * @param {Array}  responses  Array of response objects from fetchFormResponses()
 * @param {string} filename   Default: 'hiring_responses.csv'
 */
export function exportResponsesToCSV(responses, filename = 'hiring_responses.csv') {
  if (!responses.length) {
    console.warn('No responses to export.');
    return;
  }

  // Collect all unique keys across responses
  const allKeys = [...new Set(responses.flatMap(r => Object.keys(r)))];

  // Build CSV header row
  const header = allKeys.map(csvCell).join(',');

  // Build data rows
  const rows = responses.map(r =>
    allKeys.map(k => csvCell(r[k] ?? '')).join(',')
  );

  const csv = [header, ...rows].join('\r\n');
  const bom  = '﻿'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download pre-built CSV from the backend export endpoint.
 *
 * @param {string} formId
 * @param {Object} options  { apiBase?: string, filename?: string }
 */
export async function downloadFormResponsesCSV(formId, options = {}) {
  const { apiBase = '', filename = `form_${formId}_responses.csv` } = options;

  const res = await fetch(`${apiBase}/api/hiring/forms/${formId}/export.csv`);
  if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return /[,"\r\n]/.test(str) ? `"${str}"` : str;
}

// ── Connection requests ────────────────────────────────────────────────────────

/**
 * Send a connection request to a candidate.
 *
 * @param   {string} targetUserId   Candidate's user ID
 * @param   {Object} options        { apiBase?: string, message?: string }
 * @returns {Promise<Object>}
 */
export async function sendConnectionRequest(targetUserId, options = {}) {
  const { apiBase = '', message = '' } = options;

  const res = await fetch(`${apiBase}/api/connections/request`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ target_user_id: targetUserId, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`Connection request failed: ${err.detail ?? res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch all connection requests for the current user.
 *
 * @param   {Object} options  { apiBase?: string, status?: 'pending'|'accepted'|'rejected' }
 * @returns {Promise<Array>}
 */
export async function fetchConnections(options = {}) {
  const { apiBase = '', status } = options;
  const params = status ? `?status=${status}` : '';
  const res = await fetch(`${apiBase}/api/connections${params}`);
  if (!res.ok) throw new Error(`Failed to fetch connections: ${res.statusText}`);
  const data = await res.json();
  return data.connections ?? [];
}

// ── Utility: format experience band ───────────────────────────────────────────

export function formatExperienceBand(years) {
  if (years === 0) return 'Entry level';
  if (years <= 2)  return '1-2 years';
  if (years <= 5)  return '3-5 years';
  if (years <= 10) return '6-10 years';
  return '10+ years';
}

export function getMatchBadgeColor(score) {
  if (score >= 0.8) return '#8DC651'; // green
  if (score >= 0.6) return '#f59e0b'; // amber
  if (score >= 0.4) return '#f97316'; // orange
  return '#ef4444';                   // red
}
