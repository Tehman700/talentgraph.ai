/**
 * resume_generation.js
 *
 * Client-side LaTeX template filling from pre-filtered profile/resume data.
 * Works offline — no LLM call required (use ats_resume_formatter.js for LLM path).
 *
 * Exports:
 *   sanitizeForLatex(str)                 → escaped string
 *   categorizeSkills(skills, profession)  → { technical, tools, soft }
 *   parseExperienceText(text)             → JobEntry[]
 *   parseEducationText(text)              → EduEntry[]
 *   fillTemplate(profile, sections)       → LaTeX string
 *   generateLatexResume(profile, sections) → LaTeX string
 *   downloadLatexResume(profile, sections, filename) → void
 */

// ── LaTeX special character escaping ──────────────────────────────────────────

const LATEX_ESCAPES = [
  [/\\/g,  '\\textbackslash{}'],
  [/&/g,   '\\&'],
  [/%/g,   '\\%'],
  [/\$/g,  '\\$'],
  [/#/g,   '\\#'],
  [/_/g,   '\\_'],
  [/\{/g,  '\\{'],
  [/\}/g,  '\\}'],
  [/~/g,   '\\textasciitilde{}'],
  [/\^/g,  '\\textasciicircum{}'],
  [/</g,   '\\textless{}'],
  [/>/g,   '\\textgreater{}'],
  [/"/g,   "''"],
  [/'/g,   "'"],
];

export function sanitizeForLatex(str) {
  if (!str) return '';
  let out = String(str);
  // Handle backslash first, before other replacements add them
  out = out.replace(/\\/g, '\\textbackslash{}');
  for (const [re, sub] of LATEX_ESCAPES.slice(1)) {
    out = out.replace(re, sub);
  }
  return out;
}

// Raw substitution — used for already-valid LaTeX snippets (URLs, \hfill, etc.)
function raw(str) {
  return str ?? '';
}

// ── Skills categorization ──────────────────────────────────────────────────────

const TOOL_KEYWORDS = [
  'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'github', 'gitlab',
  'jenkins', 'terraform', 'ansible', 'linux', 'bash', 'jira', 'confluence',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision',
  'postman', 'swagger', 'webpack', 'vite', 'nginx', 'redis', 'rabbitmq',
  'kafka', 'elasticsearch', 'grafana', 'prometheus', 'datadog', 'splunk',
  'tableau', 'powerbi', 'excel', 'notion', 'slack', 'vercel', 'netlify',
  'firebase', 'heroku', 'digitalocean', 'mongodb atlas', 'supabase',
];

const SOFT_KEYWORDS = [
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
  'problem-solving', 'critical thinking', 'adaptability', 'creativity',
  'time management', 'project management', 'agile', 'scrum', 'kanban',
  'mentoring', 'coaching', 'presentation', 'negotiation', 'empathy',
  'attention to detail', 'analytical', 'organization', 'multitasking',
];

/**
 * Split a flat skill list into three groups: technical, tools, soft.
 * Unrecognised skills default to technical.
 *
 * @param {string[]} skills      Raw skill labels
 * @param {string}   profession  Used for profession-specific heuristics
 * @returns {{ technical: string[], tools: string[], soft: string[] }}
 */
export function categorizeSkills(skills = [], profession = '') {
  const technical = [];
  const tools     = [];
  const soft      = [];

  for (const skill of skills) {
    const lower = skill.toLowerCase();
    if (SOFT_KEYWORDS.some(k => lower.includes(k))) {
      soft.push(skill);
    } else if (TOOL_KEYWORDS.some(k => lower.includes(k))) {
      tools.push(skill);
    } else {
      technical.push(skill);
    }
  }

  // Ensure each bucket has a fallback so LaTeX doesn't get empty items
  return {
    technical: technical.length ? technical : ['See profile for technical details'],
    tools:     tools.length     ? tools     : ['Standard development tools'],
    soft:      soft.length      ? soft      : ['Collaboration', 'Communication'],
  };
}

// ── Experience text parser ─────────────────────────────────────────────────────

/**
 * Parse free-form experience text into structured job entries.
 *
 * Tries to detect patterns like:
 *   "Senior Engineer at Acme Corp (Jan 2020 – Mar 2023)"
 *   "• Led team of 5 engineers..."
 *   "- Reduced latency by 40%"
 *
 * @param {string} text
 * @returns {Array<{ title, company, location, start, end, bullets }>}
 */
export function parseExperienceText(text = '') {
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const jobs = [];
  let current = null;

  const dateRange = /(\w+[\s,]*\d{4})\s*[-–—to]+\s*(\w+[\s,]*\d{4}|present|current)/i;
  const bulletRe  = /^[-•*▸→]\s+(.+)/;
  const atRe      = /^(.+?)\s+at\s+(.+?)(?:\s*[,(|]\s*(.+?))?(?:\s*[,(|](.+))?$/i;

  for (const line of lines) {
    const dateMatch = line.match(dateRange);

    if (dateMatch || (line.length < 100 && !line.match(bulletRe) && current === null)) {
      // Likely a job header line
      if (current) jobs.push(current);
      current = { title: '', company: '', location: '', start: '', end: '', bullets: [] };

      let header = line;
      if (dateMatch) {
        current.start = dateMatch[1].trim();
        current.end   = dateMatch[2].trim();
        header = line.replace(dateMatch[0], '').trim().replace(/[,|(-]+$/, '').trim();
      }

      const atMatch = header.match(atRe);
      if (atMatch) {
        current.title    = atMatch[1].trim();
        current.company  = atMatch[2].trim();
        current.location = (atMatch[3] ?? atMatch[4] ?? '').trim();
      } else {
        current.title = header;
      }
    } else if (bulletRe.test(line)) {
      if (!current) current = { title: 'Role', company: '', location: '', start: '', end: '', bullets: [] };
      const bullet = line.match(bulletRe)[1];
      current.bullets.push(bullet);
    }
  }

  if (current) jobs.push(current);

  return jobs.filter(j => j.title || j.bullets.length);
}

// ── Education text parser ──────────────────────────────────────────────────────

const DEGREE_KEYWORDS = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'diploma', 'certificate', 'b.sc', 'b.eng', 'm.sc', 'm.eng', 'mba', 'bsc', 'msc'];

/**
 * Parse education text into structured entries.
 *
 * @param {string} text
 * @returns {Array<{ degree, field, institution, location, year, detail }>}
 */
export function parseEducationText(text = '') {
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const entries = [];
  let current = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isDegree = DEGREE_KEYWORDS.some(k => lower.includes(k));
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);

    if (isDegree || (yearMatch && !current)) {
      if (current) entries.push(current);
      current = { degree: '', field: '', institution: '', location: '', year: '', detail: '' };

      // Extract year
      if (yearMatch) {
        current.year = yearMatch[0];
      }

      // Try "B.Sc in Computer Science" pattern
      const inMatch = line.match(/^(.+?)\s+in\s+(.+?)(?:\s*,\s*(.+))?$/i);
      if (inMatch) {
        current.degree = inMatch[1].trim();
        current.field  = inMatch[2].replace(/\b(19|20)\d{2}\b/, '').trim().replace(/[,.-]+$/, '').trim();
      } else {
        current.degree = line.replace(/\b(19|20)\d{2}\b/, '').trim().replace(/[,.-]+$/, '').trim();
      }
    } else if (current && !current.institution && line.length < 80) {
      current.institution = line.replace(/\b(19|20)\d{2}\b/, '').trim();
    } else if (current) {
      current.detail += (current.detail ? ' ' : '') + line;
    }
  }

  if (current) entries.push(current);

  return entries.filter(e => e.degree || e.institution);
}

// ── LaTeX section builders ─────────────────────────────────────────────────────

function buildContactHeader(profile) {
  const name     = sanitizeForLatex(profile.name ?? profile.full_name ?? 'Your Name');
  const tagline  = sanitizeForLatex(profile.tagline ?? profile.profession ?? profile.niche ?? '');
  const location = sanitizeForLatex(profile.country ?? profile.city ?? profile.location ?? '');
  const email    = sanitizeForLatex(profile.email ?? '');
  const phone    = sanitizeForLatex(profile.phone ?? '');
  const linkedin = raw(profile.linkedin_url ?? '');
  const github   = sanitizeForLatex(profile.github_username ?? '');
  const portfolio = profile.portfolio_url
    ? `$\\,|\\,$ \\href{${raw(profile.portfolio_url)}}{Portfolio}`
    : '';

  return `\\begin{center}
  {\\Huge \\textbf{${name}}} \\\\[4pt]
  {\\large ${tagline}} \\\\[6pt]
  ${location}
  $\\,|\\,$ \\href{mailto:${email}}{${email}}
  $\\,|\\,$ ${phone}
  $\\,|\\,$ \\href{${linkedin}}{LinkedIn}
  $\\,|\\,$ \\href{https://github.com/${github}}{GitHub}
  ${portfolio}
\\end{center}`;
}

function buildSummarySection(summary) {
  if (!summary) return '';
  return `\\section{Summary}\n\n${sanitizeForLatex(summary)}`;
}

function buildSkillsSection(skills, profession) {
  const { technical, tools, soft } = categorizeSkills(skills, profession);
  const tex = s => s.map(sanitizeForLatex).join(', ');
  return `\\section{Skills}

\\begin{itemize}
  \\item \\textbf{Technical Skills:} ${tex(technical)}
  \\item \\textbf{Tools \\& Platforms:} ${tex(tools)}
  \\item \\textbf{Soft Skills:} ${tex(soft)}
\\end{itemize}`;
}

function buildExperienceSection(jobs) {
  if (!jobs.length) return '';
  const blocks = jobs.map(job => {
    const title    = sanitizeForLatex(job.title   || 'Position');
    const company  = sanitizeForLatex(job.company || '');
    const loc      = sanitizeForLatex(job.location || '');
    const start    = sanitizeForLatex(job.start   || '');
    const end      = sanitizeForLatex(job.end     || 'Present');
    const bullets  = (job.bullets ?? []).map(b =>
      `  \\item ${sanitizeForLatex(b)}`
    ).join('\n') || `  \\item ${sanitizeForLatex(job.description || 'Key contributor to team objectives.')}`;

    return `\\textbf{${title}} \\hfill ${start} -- ${end} \\\\
\\textit{${company}} \\hfill \\textit{${loc}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
  });

  return `\\section{Experience}\n\n${blocks.join('\n\n\\vspace{4pt}\n\n')}`;
}

function buildEducationSection(entries) {
  if (!entries.length) return '';
  const blocks = entries.map(e => {
    const degree  = sanitizeForLatex(e.degree   || 'Degree');
    const field   = sanitizeForLatex(e.field    || '');
    const inst    = sanitizeForLatex(e.institution || '');
    const loc     = sanitizeForLatex(e.location  || '');
    const year    = sanitizeForLatex(e.year      || '');
    const detail  = e.detail ? `\n${sanitizeForLatex(e.detail)}` : '';
    const fieldPart = field ? ` in ${field}` : '';

    return `\\textbf{${degree}${fieldPart}} \\hfill ${year} \\\\
\\textit{${inst}} \\hfill \\textit{${loc}}${detail}`;
  });

  return `\\section{Education}\n\n${blocks.join('\n\n')}`;
}

function buildProjectsSection(projects = []) {
  if (!projects.length) return '';
  const blocks = projects.map(p => {
    const name   = sanitizeForLatex(p.name  || 'Project');
    const tech   = sanitizeForLatex(p.tech  || p.stack || '');
    const date   = sanitizeForLatex(p.date  || '');
    const url    = p.url ? `\\href{${raw(p.url)}}{${name}}` : name;
    const desc   = sanitizeForLatex(p.description || '');
    const impact = p.impact ? `  \\item ${sanitizeForLatex(p.impact)}` : '';
    const bullet = desc ? `  \\item ${desc}` : '';

    return `\\textbf{${url}} \\hfill ${date} \\\\
\\textit{Tech stack: ${tech}}
\\begin{itemize}
${bullet}${impact ? '\n' + impact : ''}
\\end{itemize}`;
  });

  return `\\section{Projects}\n\n${blocks.join('\n\n\\vspace{4pt}\n\n')}`;
}

function buildCertificationsSection(certs = []) {
  if (!certs.length) return '';
  const items = certs.map(c => {
    const name   = sanitizeForLatex(c.name   || c.title || '');
    const issuer = sanitizeForLatex(c.issuer || c.provider || '');
    const date   = sanitizeForLatex(c.date   || c.year || '');
    return `  \\item \\textbf{${name}} --- ${issuer}, ${date}`;
  }).join('\n');

  return `\\section{Certifications}\n\n\\begin{itemize}\n${items}\n\\end{itemize}`;
}

function buildLanguagesSection(languages = []) {
  if (!languages.length) return '';
  const items = languages.map(l => {
    const lang    = sanitizeForLatex(typeof l === 'string' ? l : l.language || l.name || '');
    const fluency = sanitizeForLatex(typeof l === 'string' ? 'Fluent' : l.fluency || l.level || 'Fluent');
    return `  \\item ${lang}: ${fluency}`;
  }).join('\n');

  return `\\section{Languages}\n\n\\begin{itemize}\n${items}\n\\end{itemize}`;
}

// ── Main template builder ──────────────────────────────────────────────────────

const LATEX_PREAMBLE = `\\documentclass[11pt,letterpaper]{article}

\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}

\\hypersetup{
  colorlinks=true,
  urlcolor=black,
  linkcolor=black,
}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\titlerule \\vspace{-5pt}]

\\pagestyle{empty}

\\setlist[itemize]{leftmargin=*,topsep=0pt,itemsep=1pt,parsep=0pt}

\\begin{document}`;

const LATEX_FOOTER = `\n\\end{document}`;

/**
 * Fill the LaTeX resume template from a profile and optional pre-parsed sections.
 *
 * @param {Object} profile   User profile: { name, email, phone, tagline, profession,
 *                           country, skills, linkedin_url, github_username,
 *                           portfolio_url, experience_years }
 * @param {Object} sections  Pre-parsed sections from parseResumeData() / preFilterResume():
 *                           { summary?, experience?, education?, projects?,
 *                             certifications?, languages?, skills? }
 * @returns {string}  Complete LaTeX document
 */
export function fillTemplate(profile = {}, sections = {}) {
  const profileSkills = (profile.skills ?? []).map(s =>
    typeof s === 'string' ? s : s.label ?? s.skill ?? ''
  ).filter(Boolean);

  const allSkills = [
    ...profileSkills,
    ...((sections.skills ?? '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)),
  ];
  const uniqueSkills = [...new Set(allSkills)];

  // Parse experience: prefer structured array, then text block, then empty
  let jobs = [];
  if (Array.isArray(sections.experience)) {
    jobs = sections.experience;
  } else if (typeof sections.experience === 'string' && sections.experience.trim()) {
    jobs = parseExperienceText(sections.experience);
  }
  if (!jobs.length && profile.experience_years) {
    jobs = [{
      title:   profile.profession ?? profile.niche ?? 'Professional',
      company: '',
      start:   '',
      end:     'Present',
      bullets: [`${profile.experience_years}+ years of industry experience.`],
    }];
  }

  // Parse education
  let eduEntries = [];
  if (Array.isArray(sections.education)) {
    eduEntries = sections.education;
  } else if (typeof sections.education === 'string' && sections.education.trim()) {
    eduEntries = parseEducationText(sections.education);
  }
  if (!eduEntries.length && profile.education) {
    eduEntries = parseEducationText(profile.education);
  }

  // Optional sections
  const projects = Array.isArray(sections.projects)
    ? sections.projects
    : [];
  const certs = Array.isArray(sections.certifications)
    ? sections.certifications
    : [];
  const languages = Array.isArray(sections.languages)
    ? sections.languages
    : typeof sections.languages === 'string' && sections.languages.trim()
      ? sections.languages.split(/\n/).map(l => l.trim()).filter(Boolean)
      : [];

  const summary = sections.summary
    ?? profile.bio
    ?? profile.about
    ?? '';

  const bodyParts = [
    buildContactHeader(profile),
    buildSummarySection(summary),
    buildSkillsSection(uniqueSkills, profile.profession ?? ''),
    buildExperienceSection(jobs),
    buildEducationSection(eduEntries),
    buildProjectsSection(projects),
    buildCertificationsSection(certs),
    buildLanguagesSection(languages),
  ].filter(Boolean);

  return [LATEX_PREAMBLE, '', ...bodyParts, LATEX_FOOTER].join('\n\n');
}

// ── Primary export ─────────────────────────────────────────────────────────────

/**
 * Generate a complete ATS-optimized LaTeX resume from profile + sections.
 * This is the main entry point for client-side (offline) resume generation.
 *
 * @param {Object} profile   User profile object
 * @param {Object} sections  Pre-filtered sections from ats_resume_formatter.js
 * @returns {string}         LaTeX source code
 */
export function generateLatexResume(profile, sections = {}) {
  return fillTemplate(profile, sections);
}

/**
 * Trigger a browser download of the generated .tex file.
 *
 * @param {Object} profile
 * @param {Object} sections
 * @param {string} filename  Default: '<name>_resume.tex'
 */
export function downloadLatexResume(profile, sections = {}, filename) {
  const latex = generateLatexResume(profile, sections);
  const safeName = (profile.name ?? 'resume')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
  const file = filename ?? `${safeName}_resume.tex`;

  const blob = new Blob([latex], { type: 'application/x-tex;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
