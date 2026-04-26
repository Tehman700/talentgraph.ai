/**
 * ats_resume_formatter.js
 *
 * ATS-optimized resume generation pipeline:
 *   1. Parse raw CV text into labeled sections
 *   2. Pre-filter to remove ATS-hostile content
 *   3. Submit to backend LLM endpoint for LaTeX generation
 *   4. Return LaTeX source + shareable resume URL
 *
 * Exports:
 *   parseResumeData(rawText)                           → sections object
 *   preFilterResume(sections)                          → cleaned sections
 *   buildResumePayload(sections, profile)              → POST body
 *   generateATSResume(cvFile, profile, options)        → { latex, resumeUrl, profileId }
 *   generateResumeFromProfile(profileId, options)      → { latex, resumeUrl }
 *   getShareableResumeUrl(profile, options)            → string | null
 *   downloadLatex(latexContent, filename)              → triggers browser download
 *   renderResumePreview(container, latex)              → mounts a preview widget
 */

// ── Section detection rules ────────────────────────────────────────────────────

const SECTION_RULES = [
  { key: 'contact',        patterns: ['contact', 'email', 'phone', 'address', 'linkedin', 'github', 'website'] },
  { key: 'summary',        patterns: ['summary', 'objective', 'profile', 'about me', 'career objective', 'professional summary'] },
  { key: 'experience',     patterns: ['experience', 'employment', 'work history', 'positions held', 'career history', 'work experience'] },
  { key: 'education',      patterns: ['education', 'academic', 'qualification', 'degree', 'university', 'school', 'college', 'studies'] },
  { key: 'skills',         patterns: ['skills', 'technologies', 'tools', 'tech stack', 'competencies', 'technical skills', 'proficiencies', 'expertise'] },
  { key: 'projects',       patterns: ['projects', 'portfolio', 'work samples', 'case studies', 'key projects', 'selected projects'] },
  { key: 'certifications', patterns: ['certification', 'certificate', 'credential', 'award', 'achievement', 'honors', 'recognition'] },
  { key: 'languages',      patterns: ['language', 'spoken language', 'linguistic', 'fluency'] },
  { key: 'publications',   patterns: ['publication', 'research', 'paper', 'journal', 'conference'] },
  { key: 'volunteer',      patterns: ['volunteer', 'community', 'social work', 'nonprofit'] },
];

// ── Section parser ─────────────────────────────────────────────────────────────

/**
 * Parse raw CV/resume text into labeled sections.
 * Sections are detected by short header lines matching known keywords.
 *
 * @param   {string} rawText  Plain text extracted from a PDF or pasted resume
 * @returns {Object}          { contact?, summary?, experience?, education?, skills?, ... }
 */
export function parseResumeData(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) return {};

  const lines          = rawText.split(/\r?\n/);
  const sections       = {};
  let   currentSection = 'header';
  let   buffer         = [];

  function flush() {
    const text = buffer.join('\n').trim();
    if (text) {
      sections[currentSection] = sections[currentSection]
        ? sections[currentSection] + '\n' + text
        : text;
    }
    buffer = [];
  }

  function detectSectionHeader(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return null;
    const lower = trimmed.toLowerCase().replace(/[^a-z\s]/g, '');
    for (const { key, patterns } of SECTION_RULES) {
      if (patterns.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p))) {
        return key;
      }
    }
    return null;
  }

  for (const line of lines) {
    const section = detectSectionHeader(line);
    if (section) {
      flush();
      currentSection = section;
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}

// ── Pre-filter ─────────────────────────────────────────────────────────────────

/**
 * Pre-filter parsed sections to remove ATS-hostile content.
 * Normalizes bullets, dates, dashes, and collapses whitespace.
 *
 * @param   {Object} parsed  Output of parseResumeData()
 * @returns {Object}         Cleaned sections, same keys
 */
export function preFilterResume(parsed) {
  const filtered = {};

  for (const [key, text] of Object.entries(parsed)) {
    if (!text) continue;

    let clean = text
      // Strip page numbers
      .replace(/\bpage\s+\d+(\s+of\s+\d+)?\b/gi, '')
      // Keep LinkedIn/GitHub URLs, remove other external URLs
      .replace(/https?:\/\/(?!(?:www\.)?(linkedin|github)\.com)[^\s]+/gi, '')
      // Normalize em/en dashes to hyphens
      .replace(/[–—]/g, '-')
      // Normalize fancy bullet characters to plain hyphens
      .replace(/[•·▪▸►◦▹◉]/g, '-')
      // Normalize curly quotes
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      // Collapse multiple spaces/tabs on a single line
      .replace(/[ \t]{2,}/g, ' ')
      // Collapse excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Discard near-empty sections
    if (clean.replace(/\s/g, '').length > 15) {
      filtered[key] = clean;
    }
  }

  return filtered;
}

// ── Payload builder ────────────────────────────────────────────────────────────

/**
 * Build the structured POST payload for the backend resume generation endpoint.
 *
 * @param   {Object} filteredSections  Output of preFilterResume()
 * @param   {Object} profile           Talent profile data
 * @returns {Object}                   Ready for POST /api/talent/generate-resume
 */
export function buildResumePayload(filteredSections, profile = {}) {
  return {
    profile: {
      name:             profile.name             ?? '',
      tagline:          profile.tagline          ?? profile.bio         ?? '',
      profession:       profile.profession       ?? profile.niche       ?? '',
      location:         profile.location         ?? profile.detected_location ?? '',
      experience_years: profile.experience_years ?? 0,
      skills:           normalizeSkills(profile.skills),
      linkedin_url:     profile.linkedin_url     ?? '',
      github_username:  profile.github_username  ?? '',
      portfolio_url:    profile.portfolio_url    ?? '',
      email:            profile.email            ?? '',
      twitter_handle:   profile.twitter_handle   ?? '',
    },
    sections: filteredSections,
  };
}

// ── Full pipeline ──────────────────────────────────────────────────────────────

/**
 * Full pipeline: upload CV PDF → extract text → parse → pre-filter → generate ATS LaTeX resume.
 *
 * @param   {File|Blob} cvFile     Uploaded CV/resume PDF file
 * @param   {Object}    profile    Additional profile data (overrides extracted data)
 * @param   {Object}    options    { apiBase?: string }
 * @returns {Promise<{
 *   latex:      string,
 *   resumeUrl:  string|null,
 *   profileId:  string|null,
 *   sections:   Object,
 *   profile:    Object
 * }>}
 */
export async function generateATSResume(cvFile, profile = {}, options = {}) {
  const { apiBase = '' } = options;

  // Step 1: Extract structured data from CV via backend
  const formData = new FormData();
  formData.append('file', cvFile);

  const extractRes = await fetch(`${apiBase}/api/talent/extract/cv`, {
    method: 'POST',
    body:   formData,
  });
  if (!extractRes.ok) {
    const err = await extractRes.json().catch(() => ({ detail: extractRes.statusText }));
    throw new Error(`CV extraction failed: ${err.detail ?? extractRes.statusText}`);
  }
  const extracted = await extractRes.json();

  // Merge: provided profile fields override extracted data
  const merged = { ...extracted, ...profile };

  // Step 2: Parse raw CV text (if backend returned it) and pre-filter
  const rawText  = extracted.raw_text ?? '';
  const parsed   = parseResumeData(rawText);
  const sections = preFilterResume(parsed);

  // Step 3: Build payload and call LLM-powered resume generation endpoint
  const payload = buildResumePayload(sections, merged);

  const genRes = await fetch(`${apiBase}/api/talent/generate-resume`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!genRes.ok) {
    const err = await genRes.json().catch(() => ({ detail: genRes.statusText }));
    throw new Error(`Resume generation failed: ${err.detail ?? genRes.statusText}`);
  }

  const result = await genRes.json();

  return {
    latex:     result.latex      ?? '',
    resumeUrl: result.resume_url ?? null,
    profileId: result.profile_id ?? null,
    sections,
    profile:   merged,
  };
}

/**
 * Generate an ATS resume from an already-saved talent profile (no CV upload needed).
 *
 * @param   {string} profileId  Backend profile UUID or slug
 * @param   {Object} options    { apiBase?: string }
 * @returns {Promise<Object>}
 */
export async function generateResumeFromProfile(profileId, options = {}) {
  const { apiBase = '' } = options;

  const res = await fetch(`${apiBase}/api/talent/generate-resume`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ profile_id: profileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`Resume generation failed: ${err.detail ?? res.statusText}`);
  }

  return res.json();
}

/**
 * Build the shareable, absolute resume URL for a talent profile.
 *
 * @param   {Object} profile   Profile with profile_slug or id
 * @param   {Object} options   { baseUrl?: string }
 * @returns {string|null}
 */
export function getShareableResumeUrl(profile, options = {}) {
  const { baseUrl = typeof window !== 'undefined' ? window.location.origin : '' } = options;
  const slug = profile.profile_slug ?? profile.id;
  return slug ? `${baseUrl}/resume/${slug}` : null;
}

/**
 * Trigger a browser download of a .tex file.
 *
 * @param {string} latexContent  LaTeX source string
 * @param {string} filename      Default: 'resume.tex'
 */
export function downloadLatex(latexContent, filename = 'resume.tex') {
  const blob = new Blob([latexContent], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Resume preview widget ──────────────────────────────────────────────────────

/**
 * Mount a LaTeX source preview widget inside `container`.
 * Shows the raw LaTeX with a copy button and download button.
 *
 * @param {HTMLElement} container
 * @param {Object}      result    Output of generateATSResume()
 */
export function renderResumePreview(container, result) {
  const { latex = '', resumeUrl = null, profile = {} } = result;

  container.innerHTML = `
    <div style="font-family:'JetBrains Mono',monospace;background:#f6f4ef;padding:24px;border-radius:12px;border:2px solid #1710E6;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-family:'Instrument Serif',serif;font-size:20px;color:#1710E6;font-style:italic;">
            ATS Resume Ready
          </div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px;">
            ${esc(profile.name ?? '')} · ${esc(profile.profession ?? profile.niche ?? '')}
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="pf-resume-copy"
            style="padding:8px 14px;background:#8DC651;color:#fff;border:none;
                   border-radius:6px;font-family:inherit;font-size:12px;cursor:pointer;font-weight:700;">
            Copy LaTeX
          </button>
          <button id="pf-resume-download"
            style="padding:8px 14px;background:#1710E6;color:#fff;border:none;
                   border-radius:6px;font-family:inherit;font-size:12px;cursor:pointer;font-weight:700;">
            Download .tex
          </button>
        </div>
      </div>

      ${resumeUrl ? `
        <div style="background:#fff;border:1px solid #d4d1c7;border-radius:8px;padding:12px;
                    margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">
              Shareable Link
            </div>
            <a href="${esc(resumeUrl)}" target="_blank" rel="noopener"
               style="color:#1710E6;font-size:12px;font-weight:600;text-decoration:none;">
              ${esc(resumeUrl)}
            </a>
          </div>
          <button id="pf-resume-copy-link"
            style="padding:6px 12px;background:transparent;color:#1710E6;
                   border:1.5px solid #1710E6;border-radius:6px;
                   font-family:inherit;font-size:11px;cursor:pointer;">
            Copy Link
          </button>
        </div>
      ` : ''}

      <div style="
        background:#1a1a1a;color:#8DC651;padding:16px;border-radius:8px;
        font-size:11px;line-height:1.6;overflow-x:auto;
        max-height:400px;overflow-y:auto;white-space:pre;
      "><code id="pf-latex-source">${esc(latex)}</code></div>
    </div>
  `;

  container.querySelector('#pf-resume-copy')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(latex).catch(() => {});
    const btn = container.querySelector('#pf-resume-copy');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy LaTeX'; }, 2000); }
  });

  container.querySelector('#pf-resume-download')?.addEventListener('click', () => {
    const name = (profile.name ?? 'resume').toLowerCase().replace(/\s+/g, '_');
    downloadLatex(latex, `${name}_ats_resume.tex`);
  });

  container.querySelector('#pf-resume-copy-link')?.addEventListener('click', async () => {
    if (resumeUrl) await navigator.clipboard.writeText(resumeUrl).catch(() => {});
    const btn = container.querySelector('#pf-resume-copy-link');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000); }
  });
}

// ── Enhanced pre-filtering helpers ────────────────────────────────────────────

/**
 * Extract unique skill keywords from resume sections, optionally ranked by
 * overlap with a job description.
 *
 * @param   {Object} sections         Pre-filtered sections from preFilterResume()
 * @param   {string} jobDescription   Optional job description text for matching
 * @returns {{ matched: string[], unmatched: string[], all: string[] }}
 */
export function extractSkillKeywords(sections = {}, jobDescription = '') {
  const skillText = [
    sections.skills    ?? '',
    sections.summary   ?? '',
    sections.experience ?? '',
  ].join('\n');

  // Tokenize: extract word sequences 1-4 words long that look like skill phrases
  const tokens = new Set();
  const words   = skillText.match(/\b[A-Za-z][A-Za-z0-9.#+\-/&]{1,30}\b/g) ?? [];
  words.forEach(w => tokens.add(w.toLowerCase()));

  // Common English stop words to filter out
  const STOP = new Set([
    'and', 'the', 'for', 'with', 'was', 'are', 'has', 'have', 'been',
    'that', 'this', 'from', 'our', 'its', 'also', 'can', 'use', 'used',
    'using', 'able', 'via', 'per', 'etc', 'inc', 'llc', 'ltd',
  ]);

  // Recognize multi-word skill phrases (up to 4 words)
  const phraseRe = /\b([A-Z][A-Za-z0-9#+.]*(?:\s[A-Za-z0-9#+.&/-]+){0,3})\b/g;
  const phrases  = new Set();
  let m;
  while ((m = phraseRe.exec(skillText)) !== null) {
    const phrase = m[1].trim();
    if (phrase.length > 2 && !STOP.has(phrase.toLowerCase())) {
      phrases.add(phrase);
    }
  }

  const allSkills = [...phrases].filter(p => p.split(' ').length <= 4);

  if (!jobDescription.trim()) {
    return { matched: [], unmatched: allSkills, all: allSkills };
  }

  const jdLower = jobDescription.toLowerCase();
  const matched   = allSkills.filter(s => jdLower.includes(s.toLowerCase()));
  const unmatched = allSkills.filter(s => !jdLower.includes(s.toLowerCase()));

  // Sort matched by frequency in JD (higher first)
  matched.sort((a, b) => {
    const countOf = (str) => (jdLower.match(new RegExp(str.toLowerCase(), 'g')) ?? []).length;
    return countOf(b) - countOf(a);
  });

  return { matched, unmatched, all: [...matched, ...unmatched] };
}

/**
 * Parse experience section text into a structured array of job entries.
 * Returns richer data than the basic parser in resume_generation.js because
 * it also splits multi-role blocks and handles "Present" / "current" endings.
 *
 * @param   {string} text  Experience section text from preFilterResume()
 * @returns {Array<{
 *   title:    string,
 *   company:  string,
 *   location: string,
 *   start:    string,
 *   end:      string,
 *   bullets:  string[],
 *   rawBlock: string
 * }>}
 */
export function structureExperience(text = '') {
  if (!text.trim()) return [];

  const lines  = text.split(/\r?\n/);
  const jobs   = [];
  let cur      = null;
  let rawLines = [];

  const DATE_RANGE = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*\d{4}|\b\d{4})\s*[-–—to]+\s*(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*\d{4}|\b\d{4}|present|current|now)/i;
  const BULLET_RE  = /^[-•*]\s+(.+)/;
  const AT_RE      = /^(.+?)\s+(?:at|@)\s+(.+?)(?:[,|]\s*(.+))?$/i;

  function commit() {
    if (cur) {
      cur.rawBlock = rawLines.join('\n').trim();
      jobs.push(cur);
    }
    cur = null;
    rawLines = [];
  }

  for (const line of lines) {
    const trimmed   = line.trim();
    const dateMatch = trimmed.match(DATE_RANGE);
    const isBullet  = BULLET_RE.test(trimmed);

    if (dateMatch && !isBullet) {
      commit();
      cur = {
        title:    '',
        company:  '',
        location: '',
        start:    dateMatch[1].trim(),
        end:      dateMatch[2].trim(),
        bullets:  [],
      };
      // Everything on the same line before the date range = role/company info
      let header = trimmed.replace(dateMatch[0], '').replace(/[-|,]+$/, '').trim();
      const atMatch = header.match(AT_RE);
      if (atMatch) {
        cur.title    = atMatch[1].trim();
        cur.company  = atMatch[2].trim();
        cur.location = (atMatch[3] ?? '').trim();
      } else if (header) {
        cur.title = header;
      }
    } else if (isBullet) {
      if (!cur) {
        commit();
        cur = { title: '', company: '', location: '', start: '', end: 'Present', bullets: [] };
      }
      cur.bullets.push(trimmed.match(BULLET_RE)[1].trim());
    } else if (trimmed && cur && !cur.company && trimmed.length < 80) {
      // Second header line often has company name
      if (!cur.title) {
        cur.title = trimmed;
      } else if (!cur.company) {
        cur.company = trimmed;
      }
    }

    rawLines.push(line);
  }
  commit();

  return jobs.filter(j => j.title || j.bullets.length);
}

/**
 * Parse education section text into a structured array of entries.
 * Extracts: degree type, field of study, institution, location, graduation year.
 *
 * @param   {string} text  Education section text
 * @returns {Array<{
 *   degree:      string,
 *   field:       string,
 *   institution: string,
 *   location:    string,
 *   year:        string,
 *   gpa:         string,
 *   detail:      string
 * }>}
 */
export function structureEducation(text = '') {
  if (!text.trim()) return [];

  const DEGREE_MAP = [
    [/\bph\.?d\.?/i,                     'PhD'],
    [/\bmaster(?:s|'s)?\b/i,             'Master\'s'],
    [/\bm\.sc\.?\b/i,                    'M.Sc.'],
    [/\bm\.eng\.?\b/i,                   'M.Eng.'],
    [/\bmba\b/i,                          'MBA'],
    [/\bbachelor(?:s|'s)?\b/i,           'Bachelor\'s'],
    [/\bb\.sc\.?\b/i,                    'B.Sc.'],
    [/\bb\.eng\.?\b/i,                   'B.Eng.'],
    [/\bassociate(?:s|'s)?\b/i,          'Associate\'s'],
    [/\bdiploma\b/i,                     'Diploma'],
    [/\bcertificate\b/i,                 'Certificate'],
    [/\bhigh school|secondary school/i,  'High School Diploma'],
  ];

  const lines   = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const entries = [];
  let   cur     = null;

  for (const line of lines) {
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    const gpaMatch  = line.match(/\bGPA[:\s]+(\d\.\d+)/i);

    let degreeType = '';
    for (const [re, label] of DEGREE_MAP) {
      if (re.test(line)) { degreeType = label; break; }
    }

    if (degreeType) {
      if (cur) entries.push(cur);
      cur = { degree: degreeType, field: '', institution: '', location: '', year: '', gpa: '', detail: '' };

      // Extract field of study
      const inMatch = line.match(/\b(?:in|of)\s+([A-Za-z\s&]+?)(?:\s*[,(|]|$)/i);
      if (inMatch) cur.field = inMatch[1].trim().replace(/[,.-]+$/, '');

      if (yearMatch) cur.year = yearMatch[0];
      if (gpaMatch)  cur.gpa  = gpaMatch[1];

    } else if (cur) {
      if (yearMatch && !cur.year)     cur.year = yearMatch[0];
      if (gpaMatch  && !cur.gpa)      cur.gpa  = gpaMatch[1];

      // Institution: first non-degree line of reasonable length
      if (!cur.institution && line.length < 80 && !yearMatch) {
        cur.institution = line;
      } else if (cur.institution && !cur.location && line.length < 60 && !yearMatch) {
        cur.location = line;
      } else {
        cur.detail += (cur.detail ? ' ' : '') + line;
      }
    } else {
      // Orphaned line — create entry without degree label
      if (cur) entries.push(cur);
      cur = { degree: '', field: '', institution: line, location: '', year: yearMatch?.[0] ?? '', gpa: '', detail: '' };
    }
  }

  if (cur) entries.push(cur);

  return entries.filter(e => e.degree || e.institution);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(s => typeof s === 'string' ? s : (s.label ?? s.skill ?? ''))
    .filter(Boolean);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
